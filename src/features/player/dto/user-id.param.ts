import Joi from "joi";

export const PlayerIdParamSchema = Joi.object({
  gameId: Joi.number().positive().required(),
  playerId: Joi.number().positive().required(),
}).required();
