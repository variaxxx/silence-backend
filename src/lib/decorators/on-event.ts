import { WS_EVENTS_KEY } from "../metadata";

export interface WsEventConfig {
  event: string;
  handlerName: string | symbol;
}

export function OnEvent(
  event: string,
): MethodDecorator {
  return (target: object, propertyKey: symbol | string) => {
    const events: WsEventConfig[] = Reflect.getMetadata(WS_EVENTS_KEY, target.constructor) || [];

    const normalizedEvent = event.trim();

    events.push({
      handlerName: propertyKey,
      event: normalizedEvent,
    });

    Reflect.defineMetadata(WS_EVENTS_KEY, events, target.constructor);
  };
}
