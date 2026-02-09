import Joi from "joi";

export const PlayerIdParamSchema = Joi.object<PlayerIdParam>({
  playerId: Joi.number().positive().required(),
}).required();

export interface PlayerIdParam {
  playerId: number;
}
