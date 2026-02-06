import { FastifyReply, FastifyRequest } from "fastify";

import { ApiResponse } from "../interfaces";

export function responseFormattingHook(
  req: FastifyRequest,
  rep: FastifyReply,
  payload: any,
  done: any,
): void {
  const response = {
    statusCode: rep.statusCode,
    data: payload,
  } as ApiResponse;
  done(null, response);
}
