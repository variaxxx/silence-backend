import pino, { Logger as PinoLogger } from "pino";
import { Service } from "typedi";

import { ConfigService } from "./config";

@Service()
export class Logger {
  public readonly log: PinoLogger;

  constructor(
    private readonly config: ConfigService,
  ) {
    const level = config.getOrThrow<boolean>("DEBUG") ? "debug" : "info";

    this.log = pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    });
  }
}
