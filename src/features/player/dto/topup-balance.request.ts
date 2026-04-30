import Joi from "joi";

export const TopupBalanceSchema = Joi.object<TopupBalanceRequest>({
  amount: Joi.number().positive().required(),
}).required();

export interface TopupBalanceRequest {
  amount: number;
}
