import Joi from "joi";

export const DeductBalanceSchema = Joi.object<DeductBalanceRequest>({
  amount: Joi.number().positive().required(),
}).required();

export interface DeductBalanceRequest {
  amount: number;
}
