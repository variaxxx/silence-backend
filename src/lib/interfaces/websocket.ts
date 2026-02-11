import { WebSocket as BaseWebSocket } from "ws";

import { WsEmitter } from "./ws-emitter";

export type WebSocket = BaseWebSocket & WsEmitter;
