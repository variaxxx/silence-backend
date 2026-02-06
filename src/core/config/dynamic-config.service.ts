import { Service } from "typedi";

import { PrismaService } from "../../infra/db/prisma.service";
import { DynamicConfig } from "./dynamic.config";

@Service()
export class DynamicConfigService {
  private cache = new Map<DynamicConfig, string>();

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  public async load(): Promise<void> {
    const rows = await this.prisma.config.findMany();
    for (const row of rows) {
      if ((Object.keys(DynamicConfig) as string[]).includes(row.key)) {
        this.cache.set(row.key as DynamicConfig, row.value);
      }
    }
  }

  public async get(
    key: DynamicConfig,
  ): Promise<string | undefined> {
    if (this.cache.has(key))
      return this.cache.get(key);

    const row = await this.prisma.config.findUnique({
      where: { key },
    });

    return row?.value;
  }

  public async getOrThrow(
    key: DynamicConfig,
  ): Promise<string> {
    const cached = this.cache.get(key);
    if (cached)
      return cached;

    const row = await this.prisma.config.findUnique({
      where: { key },
    });

    if (!row)
      throw new Error(`Missing value for config variable: ${key}`);
    return row.value;
  }

  public async set(
    key: DynamicConfig,
    value: string,
  ): Promise<void> {
    await this.prisma.config.upsert({
      create: {
        key,
        value,
      },
      where: {
        key,
      },
      update: {
        value,
      },
    });

    this.cache.set(key, value);
  }
}
