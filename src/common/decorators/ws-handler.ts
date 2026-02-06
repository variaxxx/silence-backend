import { Service } from "typedi";

export const WS_PREFIX_KEY = Symbol("ws_prefix");

export function WsHandler(prefix: string = ""): ClassDecorator {
  return (target: object) => {
    const trimmedPrefix = prefix.trim();
    const normalizedPrefix = `/${trimmedPrefix.replace(/^\/+|\/+$/g, "")}`;

    Service()(target);
    Reflect.defineMetadata(WS_PREFIX_KEY, normalizedPrefix, target);
  };
}
