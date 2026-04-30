import pino, { Logger as PinoLogger } from "pino";
import { Service } from "typedi";

import { PgClient } from "../infra/db";
import { ConfigService } from "./config/env";

@Service()
export class Logger {
  public log!: PinoLogger;

  constructor(
    private readonly config: ConfigService,
    private readonly pg: PgClient,
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

  public writeLog(msg: string): void {
    try {
      this.pg.pool.query(`
        INSERT INTO logs (message)
        VALUES ($1)
        `, [msg]);

      this.log.info(msg);
    } catch {}
  }
}
