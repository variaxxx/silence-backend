export interface WsEmitter {
  sendEvent: <T = unknown>(event: string, payload?: T) => void;
}
