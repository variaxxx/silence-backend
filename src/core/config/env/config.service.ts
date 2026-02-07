import dotenv from "dotenv";
import { Service } from "typedi";

import { EnvConfig } from "./env.config";
import { envSchema } from "./env.schema";

@Service()
export class ConfigService {
  private readonly env: Record<string, any>;

  constructor() {
    dotenv.config();

    const { value, error } = envSchema.validate(process.env, {
      abortEarly: false,
      convert: true,
      allowUnknown: true,
    });

    if (error) {
      throw new Error(`Config validation error: ${error.details.map(d => d.message).join(", ")}`);
    }

    this.env = value;
  }

  public get<T = string>(
    key: keyof EnvConfig,
  ): T | undefined {
    return this.env[key];
  }

  public getOrThrow<T = string>(
    key: keyof EnvConfig,
  ): T {
    const res = this.env[key];

    if (!res)
      throw new Error(`Missing value for config variable: ${key}`);

    return res;
  }
}
