import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import "reflect-metadata";

export const QueryParameterLabel = "QueryParams";
export type QueryParameterOptions = {
    schema:OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined,
    description:string
}

export const QueryParameter = (name:string, options:QueryParameterOptions) => {
    return (target: any, memberName: string) => {
        const currentParams = Reflect.getMetadata(QueryParameterLabel, target, memberName);
        const newEntry = {name: name, options: options};

        Reflect.defineMetadata(QueryParameterLabel, currentParams ? [newEntry, ...currentParams] : [newEntry], target, memberName);
    };
  }
  