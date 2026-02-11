import { Service } from "typedi";

import { WS_PREFIX_KEY } from "../metadata";

export function WsHandler(prefix: string = ""): ClassDecorator {
  return (target: object) => {
    const trimmedPrefix = prefix.trim();
    const normalizedPrefix = `/${trimmedPrefix.replace(/^\/+|\/+$/g, "")}`;

    Service()(target);
    Reflect.defineMetadata(WS_PREFIX_KEY, normalizedPrefix, target);
  };
}
