import Joi from "joi";

export const GameIdParamSchema = Joi.object({ gameId: Joi.number().positive().required() }).required();
