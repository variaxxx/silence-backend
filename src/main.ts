import "reflect-metadata";
import fastifyWebsocket from "@fastify/websocket";
import Fastify, { FastifyBaseLogger } from "fastify";
import { Container } from "typedi";

import { errorHandler, joiValidator } from "./common/handlers";
import { leadingSlashHook } from "./common/hooks/leading-slash";
import { responseFormattingHook } from "./common/hooks/response-formatting";
import { AppController } from "./core/app.controller";
import { DynamicConfigService } from "./core/config/dynamic";
import { ConfigService } from "./core/config/env";
import { Logger } from "./core/logger";
import { registerControllers } from "./core/register-controllers";
import { featuresControllers } from "./features";
import { PrismaService } from "./infra/db/prisma.service";

async function bootstrap(): Promise<void> {
  const logger = Container.get(Logger);
  const config = Container.get(ConfigService);
  const prisma = Container.get(PrismaService);
  const dynamicConfig = Container.get(DynamicConfigService);

  const app = Fastify({
    loggerInstance: logger.log as unknown as FastifyBaseLogger,
  });

  app.register(fastifyWebsocket);
  app.addHook("onRequest", leadingSlashHook);
  app.addHook("preSerialization", responseFormattingHook);
  app.setErrorHandler(errorHandler);
  app.setValidatorCompiler(joiValidator);

  await dynamicConfig.load();
  await prisma.connect();

  registerControllers(app, featuresControllers.concat([AppController]));

  const port = config.getOrThrow<number>("PORT");
  app.listen({ port, host: "0.0.0.0" }).then(() => {
    app.log.info("Application started");
  });
}

await bootstrap();
