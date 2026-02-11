import "reflect-metadata";
import { Container } from "typedi";

import { AppController } from "./core/app.controller";
import { ConfigService } from "./core/config/env";
import { featuresControllers } from "./features";
import { createServer, registerControllers } from "./infra/http";
import { initInfrastructure } from "./infra/init";

async function bootstrap(): Promise<void> {
  const config = Container.get(ConfigService);

  const app = createServer();
  await initInfrastructure();

  registerControllers(app, featuresControllers.concat([AppController]));

  const port = config.getOrThrow<number>("PORT");
  app.listen({ port, host: "0.0.0.0" }).then(() => {
    app.log.info("Application started");
  });
}

await bootstrap();
