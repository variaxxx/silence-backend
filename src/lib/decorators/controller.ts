import { Service } from "typedi";

import { PREFIX_KEY } from "../metadata";

export function Controller(prefix: string = ""): ClassDecorator {
  return (target: object) => {
    const trimmedPrefix = prefix.trim();
    const normalizedPrefix = `/${trimmedPrefix.replace(/^\/+|\/+$/g, "")}`;

    Service()(target);
    Reflect.defineMetadata(PREFIX_KEY, normalizedPrefix, target);
  };
}
