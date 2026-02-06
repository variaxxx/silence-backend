import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";

import { OnEvent, WsHandler } from "../common/decorators";
import { Logger } from "./logger";

@WsHandler("test")
export class TestHandler {
  constructor(private readonly logger: Logger) {}

  @OnEvent("test")
  test(
    socket: WebSocket,
    req: FastifyRequest,
  ): void {
    this.logger.log.debug("test");
  }
}
