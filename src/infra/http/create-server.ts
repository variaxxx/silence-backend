import fastifyWebsocket from "@fastify/websocket";
import fastify, { FastifyBaseLogger, FastifyInstance } from "fastify";
import { Container } from "typedi";

import { errorHandler, joiValidator } from "../../common/handlers";
import { leadingSlashHook, responseFormattingHook } from "../../common/hooks";
import { Logger } from "../../core/logger";

export function createServer(): FastifyInstance {
  const logger = Container.get(Logger);

  const app = fastify({
    loggerInstance: logger.log as unknown as FastifyBaseLogger,
  });

  app.register(fastifyWebsocket);
  app.addHook("onRequest", leadingSlashHook);
  app.addHook("preSerialization", responseFormattingHook);
  app.setErrorHandler(errorHandler);
  app.setValidatorCompiler(joiValidator);

  return app;
}
