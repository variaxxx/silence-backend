import Joi from "joi";

export const CreatePlayerSchema = Joi.object<CreatePlayerRequest>({
  micId: Joi.number().positive().required(),
  name: Joi.string().min(1).required(),
}).required();

export interface CreatePlayerRequest {
  micId: number;
  name: string;
}
