/* eslint-disable unused-imports/no-unused-vars */
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Container } from "typedi";
import { WebSocket } from "ws";

import { EndpointSchemas, HTTP_STATUS_KEY, PREFIX_KEY, RouteConfig, ROUTES_KEY, WS_EVENTS_KEY, WS_PREFIX_KEY, WsEventConfig } from "../common/decorators";
import { HTTP_METHOD } from "../common/enums";
import { HttpException } from "../common/exceptions";
import { WsMessage } from "../common/interfaces";
import { Logger } from "./logger";

interface HandlerConfig {
  wsHandler?: any;
  httpHandler?: any;
  schema?: EndpointSchemas;
}

export function registerControllers(
  fastify: FastifyInstance,
  controllers: any[],
): void {
  const handlersMap = new Map<string, HandlerConfig>();

  for (const Controller of controllers) {
    const instance = Container.get<typeof Controller>(Controller);

    const prefix = Reflect.getMetadata(PREFIX_KEY, Controller);
    const wsPrefix = Reflect.getMetadata(WS_PREFIX_KEY, Controller);

    if (wsPrefix === undefined && prefix === undefined)
      throw new Error(`${instance.name} is not a controller`);

    if (prefix) {
      const routes: RouteConfig[] = Reflect.getMetadata(ROUTES_KEY, Controller) || [];

      for (const r of routes) {
        const url = (prefix + r.path).replace(/\/+/g, "/");
        const status = Reflect.getMetadata(HTTP_STATUS_KEY, Controller, r.handlerName);
        const handler = createHttpHandler(instance, r.handlerName, status);

        if (r.method !== HTTP_METHOD.GET) {
          fastify.route({
            url,
            method: r.method,
            handler,
            schema: r.schema,
          });
        } else {
          const meta = handlersMap.get(url);
          if (meta?.httpHandler)
            throw new Error(`Duplicate handlers: ${url}`);

          handlersMap.set(url, {
            ...meta,
            httpHandler: handler,
            schema: r.schema,
          });
        }
      }
    } else {
      const events: WsEventConfig[] = Reflect.getMetadata(WS_EVENTS_KEY, Controller) || [];

      const meta = handlersMap.get(wsPrefix);
      if (meta?.wsHandler)
        throw new Error(`Duplicate WS handlers: ${wsPrefix}`);

      const handler = createWsHandler(instance, events);

      handlersMap.set(wsPrefix, {
        ...meta,
        wsHandler: handler,
      });
    }

    fastify.log.info(`Registered ${Controller.name} routes (prefix ${prefix ?? wsPrefix})`);
  }

  for (const [url, meta] of handlersMap) {
    fastify.register(async (fastify) => {
      fastify.route({
        method: "GET",
        url,
        handler: meta.httpHandler ?? ((req, rep): void => {
          throw new HttpException(404, "Not found");
        }),
        wsHandler: meta.wsHandler,
        schema: meta.schema?.params ? { params: meta.schema.params } : undefined,
      });
    });
  }
}

function createHttpHandler(
  instance: FastifyInstance,
  handlerName: string | symbol,
  status: number = 200,
) {
  return async (req: FastifyRequest, rep: FastifyReply): Promise<any> => {
    const res = await (instance as any)[handlerName].call(instance, req, rep);

    rep.code(status);

    if (status === 204)
      return rep.send();
    return res;
  };
}

function createWsHandler(
  instance: FastifyInstance,
  events: WsEventConfig[],
) {
  const eventsMap = new Map(
    events.map(e => [e.event, e.handlerName]),
  );
  const logger = Container.get(Logger);

  return (socket: WebSocket, req: FastifyRequest): void => {
    socket.on("open", () => {
      socket.send(
        JSON.stringify({ event: "connection-established" } as WsMessage),
      );
    });

    socket.on("message", (raw): void => {
      try {
        let json: WsMessage;

        try {
          json = JSON.parse(raw.toString());
        } catch {
          return void socket.send(
            JSON.stringify({
              event: "error",
              payload: "Invalid payload",
            } as WsMessage),
          );
        }

        const handlerName = eventsMap.get(json.event);

        if (!handlerName) {
          return void socket.send(
            JSON.stringify({
              event: "error",
              payload: "Invalid event",
            } as WsMessage),
          );
        }

        (instance as any)[handlerName](socket, json.payload);
      } catch (e) {
        logger.log.error(`WebSocket error: ${e instanceof Error ? e.stack : e}`);

        // socket.send(
        //   JSON.stringify({
        //     event: "error",
        //     payload: "Internal server error",
        //   } as WsMessage),
        // );
      }
    });
  };
}
