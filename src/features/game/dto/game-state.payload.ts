export interface GameStatePayload {
  players: {
    id: number;
    micState: number;
  }[];
}
