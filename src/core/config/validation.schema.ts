import Joi from "joi";

import { EnvConfig } from "./env.config";

export const validationSchema = Joi.object<EnvConfig>({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string(),
  DEBUG: Joi.boolean().default(true),
});
