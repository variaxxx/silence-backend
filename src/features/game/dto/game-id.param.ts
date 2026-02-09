import Joi from "joi";

export const GameIdParamSchema = Joi.object<GameIdParam>({
  gameId: Joi.number().positive().required(),
}).required();

export interface GameIdParam {
  gameId: number;
}
