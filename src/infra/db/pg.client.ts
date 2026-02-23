import { Pool } from "pg";
import { Service } from "typedi";

import { ConfigService } from "../../core/config/env";

@Service()
export class PgClient {
  public readonly pool: Pool;

  constructor(
    private readonly config: ConfigService,
  ) {
    this.pool = new Pool({
      connectionString: config.getOrThrow("DATABASE_URL"),
    });
  }
}
