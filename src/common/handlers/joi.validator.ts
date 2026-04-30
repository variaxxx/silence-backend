import { FastifySchemaCompiler } from "fastify";
import Joi from "joi";

export const joiValidator: FastifySchemaCompiler<Joi.Schema> = ({ schema }) => {
  return (data): any => {
    try {
      const { error, value } = schema.validate(data);
      if (error) {
        return { error };
      }
      return { value };
    } catch (e: any) {
      return { error: e };
    }
  };
};
