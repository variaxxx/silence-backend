export interface WsMessage<T = any> {
  event: string;
  payload?: T;
}
