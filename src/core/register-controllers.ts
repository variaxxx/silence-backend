/* eslint-disable unused-imports/no-unused-vars */
import { FastifyInstance, FastifyRequest } from "fastify";
import { Container } from "typedi";
import { WebSocket } from "ws";

import { PREFIX_KEY, RouteConfig, ROUTES_KEY, WS_EVENTS_KEY, WS_PREFIX_KEY, WsEventConfig } from "../common/decorators";
import { HTTP_METHOD } from "../common/enums";
import { WsMessage } from "../common/interfaces";

interface HandlerConfig {
  wsHandler?: any;
  httpHandler?: any;
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
        const handler = instance[r.handlerName].bind(instance);

        if (r.method !== HTTP_METHOD.GET) {
          fastify.route({
            url,
            method: r.method,
            handler,
          });
        } else {
          const meta = handlersMap.get(url);
          if (meta?.httpHandler)
            throw new Error(`Duplicate handlers: ${url}`);

          handlersMap.set(url, {
            ...meta,
            httpHandler: handler,
          });
        }
      }
    } else {
      const events: WsEventConfig[] = Reflect.getMetadata(WS_EVENTS_KEY, Controller) || [];

      const eventsMap = new Map(
        events.map(e => [e.event, e.handlerName]),
      );

      const meta = handlersMap.get(wsPrefix);
      if (meta?.wsHandler)
        throw new Error(`Duplicate WS handlers: ${wsPrefix}`);

      const handler = (socket: WebSocket, req: FastifyRequest): void => {
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

            instance[handlerName](socket, json.payload);
          } catch (e) {
            fastify.log.error(`WebSocket error: ${e instanceof Error ? e.stack : e}`);

            // socket.send(
            //   JSON.stringify({
            //     event: "error",
            //     payload: "Internal server error",
            //   } as WsMessage),
            // );
          }
        });
      };

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
          rep.status(404).send();
        }),
        wsHandler: meta.wsHandler,
      });
    });
  }
}
