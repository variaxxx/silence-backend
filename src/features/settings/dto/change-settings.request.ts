import Joi from "joi";

import { DynamicConfig, DynamicConfigValue } from "../../../core/config/dynamic";

export const ChangeSettingsSchema = Joi.object(
  Object.fromEntries(
    Object.values(DynamicConfig).map(key => [
      key,
      Joi.any(),
    ]),
  ),
)
  .min(1)
  .required();

export type ChangeSettingsRequest = Partial<{ [K in DynamicConfig]: DynamicConfigValue<K>; }>;
