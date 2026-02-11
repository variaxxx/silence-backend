export const WS_ON_CONNECT_KEY = Symbol("wsOnConnect");

export interface WsOnConnectHandlerConfig {
  handlerName: string | symbol;
}

export function OnConnect(): MethodDecorator {
  return (target: object, propertyKey: symbol | string) => {
    const onConnect: string = Reflect.getMetadata(WS_ON_CONNECT_KEY, target.constructor);

    if (onConnect)
      throw new Error(`On connect handler already specified for ${target.constructor.name}`);

    const cfg: WsOnConnectHandlerConfig = {
      handlerName: propertyKey,
    };

    Reflect.defineMetadata(WS_ON_CONNECT_KEY, cfg, target.constructor);
  };
}
