import { GameController } from "./game/transport/game.controller";
import { GameWsHandler } from "./game/transport/game.ws";
import { PlayerController } from "./player/transport/player.controller";
import { SettingsController } from "./settings/settings.controller";

export const featuresControllers: any[] = [
  SettingsController,
  GameController,
  GameWsHandler,
  PlayerController,
];
