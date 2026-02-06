import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { ApiResponse } from "../interfaces";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  request.log.error(error.stack);
  const status = error.statusCode || 500;
  const message = status !== 500 ? error.message : "Internal server error";
  reply.status(status).send({
    statusCode: status,
    message,
  } as ApiResponse);
}
