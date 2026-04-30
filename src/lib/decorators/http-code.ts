import { HTTP_STATUS_KEY } from "../metadata";

export function HttpCode(
  status: number,
): MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(HTTP_STATUS_KEY, status, target.constructor, propertyKey);
  };
}
