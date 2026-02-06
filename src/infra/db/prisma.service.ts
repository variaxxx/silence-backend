import { PrismaPg } from "@prisma/adapter-pg";
import { Container, Service } from "typedi";

import { ConfigService } from "../../core/config";
import { Logger } from "../../core/logger";
import { PrismaClient } from "../../generated/prisma/client";

@Service()
export class PrismaService extends PrismaClient {
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const connectionString = configService.getOrThrow("DATABASE_URL");
    const adapter = new PrismaPg({ connectionString });
    super({ adapter, log: [] });

    this.logger = Container.get(Logger);
  }

  async connect(): Promise<void> {
    while (true) {
      try {
        await this.$connect();
        await this.$executeRaw`SELECT 1`;
        this.logger.log.info(("Database connection established"));
        return;
      } catch (e) {
        this.logger.log.error(`DB connection failed, retrying... : ${e instanceof Error ? e.stack : e}`);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
}
