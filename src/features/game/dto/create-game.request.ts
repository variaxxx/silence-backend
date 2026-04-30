import Joi from "joi";

export const CreateGameSchema = Joi.object<CreateGameRequest>({
  isDotEnabled: Joi.boolean(),
})
  .required();

export interface CreateGameRequest {
  isDotEnabled: boolean;
}
