import Joi, { Schema as JoiSchema } from "joi";

import { DynamicConfig } from "./dynamic.config";

export const DynamicConfigSchema = {
  VOLUME_THRESHOLD: Joi.number().positive().default(2000),
  GAME_DEATH_TIMEOUT: Joi.number().positive().default(3000),
  STRIKE_PRICE: Joi.number().positive().default(100),
} satisfies Record<DynamicConfig, JoiSchema>;
