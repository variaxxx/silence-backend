import { Schema as JoiSchema } from "joi";

import { HTTP_METHOD, HttpMethod } from "../enums/http-method";

export const ROUTES_KEY = Symbol("routes");

type HttpMethodDecorator = (endpoint?: string, options?: HttpMethodOptions) => MethodDecorator;

export interface RouteConfig {
  method: HttpMethod;
  handlerName: symbol | string;
  path: string;
  schema?: JoiSchema;
}

export interface HttpMethodOptions {
  schema?: JoiSchema;
}

function createMethodDecorator(
  method: HttpMethod,
): HttpMethodDecorator {
  return (endpoint: string = "", options?: HttpMethodOptions) => {
    return (target: object, propertyKey: symbol | string) => {
      const routes: RouteConfig[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];

      const trimmedEndpoint = endpoint.trim();
      const normalizedEndpoint = ["", "/"].includes(trimmedEndpoint) ? "" : `/${trimmedEndpoint.replace(/^\/+|\/+$/g, "")}`;

      routes.push({
        method,
        path: normalizedEndpoint,
        handlerName: propertyKey,
        schema: options?.schema,
      });

      Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
    };
  };
}

export const Get = createMethodDecorator(HTTP_METHOD.GET);
export const Post = createMethodDecorator(HTTP_METHOD.POST);
export const Put = createMethodDecorator(HTTP_METHOD.PUT);
export const Patch = createMethodDecorator(HTTP_METHOD.PATCH);
export const Delete = createMethodDecorator(HTTP_METHOD.DELETE);
