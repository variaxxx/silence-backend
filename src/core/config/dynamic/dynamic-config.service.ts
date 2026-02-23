import { Service } from "typedi";

import { PrismaService } from "../../../infra/db";
import { HttpException } from "../../../lib/exceptions";
import { Logger } from "../../logger";
import { DynamicConfig, DynamicConfigValue } from "./dynamic.config";
import { DynamicConfigSchema } from "./dynamic.schema";

@Service()
export class DynamicConfigService {
  private cache = new Map<DynamicConfig, unknown>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  public async load(): Promise<void> {
    const rows = await this.prisma.config.findMany();

    this.loadDefaults();

    for (const row of rows) {
      if (!(row.key in DynamicConfigSchema))
        continue;

      const key = row.key as DynamicConfig;
      const schema = DynamicConfigSchema[key];

      const parsed = JSON.parse(row.value);
      const validated = schema.validate(parsed);

      if (validated.error) {
        this.logger.log.error(`Invalid value for ${key}`);
        continue;
      }

      this.cache.set(key, validated.value);
    }
  }

  private async loadOne<K extends DynamicConfig>(
    key: K,
  ): Promise<DynamicConfigValue<K> | undefined> {
    const stored = await this.prisma.config.findUnique({
      where: { key },
    });

    if (!stored)
      return undefined;

    const schema = DynamicConfigSchema[key];
    const parsed = JSON.parse(stored.value);
    const validated = schema.label(key).validate(parsed);

    if (validated.error)
      throw new HttpException(400, validated.error.message);

    this.cache.set(key, validated.value);
    return validated.value as DynamicConfigValue<K>;
  }

  public async get<K extends DynamicConfig>(
    key: K,
  ): Promise<DynamicConfigValue<K> | undefined> {
    if (this.cache.has(key))
      return this.cache.get(key) as DynamicConfigValue<K>;

    return await this.loadOne(key);
  }

  public async getOrThrow<K extends DynamicConfig>(
    key: K,
  ): Promise<DynamicConfigValue<K>> {
    if (this.cache.has(key))
      return this.cache.get(key) as DynamicConfigValue<K>;

    const loaded = await this.loadOne(key);

    if (!loaded)
      throw new Error(`Missing value for config variable: ${key}`);
    return loaded;
  }

  public async getAll(): Promise<any> {
    return Object.fromEntries(this.cache.entries());
  }

  public async set<K extends DynamicConfig>(
    key: K,
    value: DynamicConfigValue<K>,
  ): Promise<void> {
    const schema = DynamicConfigSchema[key];

    const validated = schema.label(key).validate(value);
    if (validated.error)
      throw new HttpException(400, validated.error.message);

    const stringified = JSON.stringify(validated.value);

    await this.prisma.config.upsert({
      create: { key, value: stringified },
      where: { key },
      update: { value: stringified },
    });

    this.cache.set(key, validated.value);
    this.logger.writeLog(`Variable ${key} was changed to ${validated.value}`);
  }

  public async setMany(
    values: Partial<{
      [K in DynamicConfig]: DynamicConfigValue<K>;
    }>,
  ): Promise<void> {
    const entries = Object.entries(values) as [DynamicConfig, unknown][];

    if (entries.length === 0)
      return;

    const upserts: { key: string; value: string }[] = [];

    for (const [key, value] of entries) {
      const schema = DynamicConfigSchema[key];
      if (!schema)
        continue;

      const validated = schema.label(key).validate(value);
      if (validated.error)
        throw new HttpException(400, validated.error.message);

      upserts.push({
        key,
        value: JSON.stringify(validated.value),
      });

      this.cache.set(key, validated.value);
      this.logger.writeLog(`Variable ${key} was changed to ${validated.value}`);
    }

    await this.prisma.$transaction(
      upserts.map(i => this.prisma.config.upsert({
        create: i,
        where: { key: i.key },
        update: { value: i.value },
      })),
    );
  };

  private loadDefaults(): void {
    for (const key of Object.values(DynamicConfig)) {
      const schema = DynamicConfigSchema[key];
      const validated = schema.validate(undefined);
      const value = validated.value as DynamicConfigValue<typeof key>;

      this.cache.set(key, value);
    }
  }
}
