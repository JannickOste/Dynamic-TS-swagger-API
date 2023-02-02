import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import "reflect-metadata";

export const PathParameterLabel = "PathParameter";
export type PathParameterOptions = {
    schema?:OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined,
    description?:string;
    required?:true;
}

export const PathParameter = (name:string, options:PathParameterOptions) => {
    return (target: any, memberName: string) => {
        const currentParams = Reflect.getMetadata(PathParameterLabel, target, memberName);
        const newEntry = {name: name, options: options};

        Reflect.defineMetadata(PathParameterLabel, currentParams ? [newEntry, ...currentParams] : [newEntry], target, memberName);
    };
  }
  