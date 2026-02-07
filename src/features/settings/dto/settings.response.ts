import { DynamicConfig, DynamicConfigValue } from "../../../core/config/dynamic";

export type SettingsResponse = {
  [K in DynamicConfig]: DynamicConfigValue<K>;
};
