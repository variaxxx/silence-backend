import Joi, { Schema as JoiSchema } from "joi";

import { DynamicConfig } from "./dynamic.config";

export const DynamicConfigSchema = {
  VOLUME_THRESHOLD: Joi.number().positive().default(2000),
} satisfies Record<DynamicConfig, JoiSchema>;
