import { GameController } from "./game/game.controller";
import { GameWsHandler } from "./game/game.ws";
import { PlayerController } from "./player/player.controller";
import { SettingsController } from "./settings/settings.controller";

export const featuresControllers: any[] = [
  SettingsController,
  GameController,
  GameWsHandler,
  PlayerController,
];
