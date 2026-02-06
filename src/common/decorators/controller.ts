import { Service } from "typedi";

export const PREFIX_KEY = Symbol("prefix");

export function Controller(prefix: string = ""): ClassDecorator {
  return (target: object) => {
    const trimmedPrefix = prefix.trim();
    const normalizedPrefix = `/${trimmedPrefix.replace(/^\/+|\/+$/g, "")}`;

    Service()(target);
    Reflect.defineMetadata(PREFIX_KEY, normalizedPrefix, target);
  };
}
