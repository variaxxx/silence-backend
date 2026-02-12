import Joi, { Schema as JoiSchema } from "joi";

import { DynamicConfig } from "./dynamic.config";

export const DynamicConfigSchema = {
  VOLUME_THRESHOLD: Joi.number().integer().positive().default(2000),
  GAME_DEATH_TIMEOUT: Joi.number().integer().positive().default(3000),
  STRIKE_PRICE: Joi.number().integer().positive().default(100),
  STATE_POLLING_RATE: Joi.number().integer().positive().default(1000),
} satisfies Record<DynamicConfig, JoiSchema>;
