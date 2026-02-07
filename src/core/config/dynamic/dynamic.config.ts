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
}

export type DynamicConfigValue<K extends DynamicConfig> = JoiType<(typeof DynamicConfigSchema)[K]>;
