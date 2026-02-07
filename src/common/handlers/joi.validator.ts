import { FastifySchemaCompiler } from "fastify";
import { Schema as JoiSchema } from "joi";

export const joiValidator: FastifySchemaCompiler<JoiSchema> = ({ schema }) => {
  return (data): any => {
    try {
      console.log(data);
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
