import Joi from "joi";

import { DynamicConfigSchema } from "./dynamic.schema";

export type JoiType<T extends Joi.Schema>
  = T extends Joi.NumberSchema ? number
    : T extends Joi.StringSchema ? string
      : T extends Joi.BooleanSchema ? boolean
        : T extends Joi.ArraySchema ? unknown[]
          : unknown;

export enum DynamicConfig {
  VOLUME_THRESHOLD = "VOLUME_THRESHOLD",
  GAME_DEATH_TIMEOUT_MS = "GAME_DEATH_TIMEOUT_MS",
  STRIKE_PRICE = "STRIKE_PRICE",
  STATE_POLLING_RATE_MS = "STATE_POLLING_RATE_MS",
  DOT_INTERVAL_MS = "DOT_INTERVAL_MS",
  DOT_FUNDS_WRITE_OFF = "DOT_FUNDS_WRITE_OFF",
}

export type DynamicConfigValue<K extends DynamicConfig> = JoiType<(typeof DynamicConfigSchema)[K]>;
