import Joi, { Schema as JoiSchema } from "joi";

import { DynamicConfig } from "./dynamic.config";

export const DynamicConfigSchema = {
  VOLUME_THRESHOLD: Joi.number().integer().positive().default(2000),
  GAME_DEATH_TIMEOUT_MS: Joi.number().integer().positive().default(3000),
  STRIKE_PRICE: Joi.number().integer().positive().default(100),
  STATE_POLLING_RATE_MS: Joi.number().integer().positive().default(1000),
  DOT_INTERVAL_MS: Joi.number().integer().positive().default(1000),
  DOT_FUNDS_WRITE_OFF: Joi.number().integer().positive().default(10),
} satisfies Record<DynamicConfig, JoiSchema>;
