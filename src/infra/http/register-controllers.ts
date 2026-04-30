/* eslint-disable unused-imports/no-unused-vars */
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Container } from "typedi";
import { WebSocket as WS } from "ws";

import { Logger } from "../../core/logger";
import { EndpointSchemas, RouteConfig, WsEventConfig, WsOnConnectHandlerConfig } from "../../lib/decorators";
import { HTTP_METHOD } from "../../lib/enums";
import { HttpException } from "../../lib/exceptions";
import { WebSocket, WsMessage } from "../../lib/interfaces";
import { HTTP_STATUS_KEY, PREFIX_KEY, ROUTES_KEY, WS_EVENTS_KEY, WS_ON_CONNECT_KEY, WS_PREFIX_KEY } from "../../lib/metadata";

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
      const meta = handlersMap.get(wsPrefix);
      if (meta?.wsHandler)
        throw new Error(`Duplicate WS handlers: ${wsPrefix}`);

      const handler = createWsHandler(Controller, instance);

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
  Controller: any,
  instance: FastifyInstance,
) {
  const events: WsEventConfig[] = Reflect.getMetadata(WS_EVENTS_KEY, Controller) || [];
  const eventsMap = new Map(events.map(e => [e.event, e.handlerName]));

  const onConnectHandler: WsOnConnectHandlerConfig = Reflect.getMetadata(WS_ON_CONNECT_KEY, Controller);
  const logger = Container.get(Logger);

  return async (socket: WS, req: FastifyRequest): Promise<void> => {
    const ws = wrapSocket(socket);

    if (onConnectHandler)
      await (instance as any)[onConnectHandler.handlerName](ws, req);

    // if (o)
    // socket.on("close")

    socket.on("message", async (raw): Promise<void> => {
      try {
        let json: WsMessage;

        try {
          json = JSON.parse(raw.toString());
        } catch {
          throw new Error("Invalid payload");
        }

        const handlerName = eventsMap.get(json.event);

        if (!handlerName)
          throw new Error("Invalid event");

        await (instance as any)[handlerName](ws, json.payload);
      } catch (e) {
        logger.log.error(`WebSocket error: ${e instanceof Error ? e.message : e}`);
        ws.sendEvent("error", e instanceof Error ? e.message : e);
      }
    });
  };
}

function wrapSocket(socket: WS): WebSocket {
  return Object.assign(socket, {
    sendEvent<T>(event: string, payload?: T) {
      socket.send(JSON.stringify({ event, payload } as WsMessage));
    },
  });
}
