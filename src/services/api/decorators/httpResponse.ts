import "reflect-metadata";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { HTTPStatusCode } from "../../../types/HTTPStatusCode";

export type HTTPResponseOptions = {
    description?:string;
    schema?:OpenAPIV3.ReferenceObject|OpenAPIV3.SchemaObject;
    mediaType?:string;
}

export const HTTPResponseLabel = "HTTPResponse"

export const HTTPResponse = (statusCode: HTTPStatusCode, options?: HTTPResponseOptions) => {
    return (target:any, propName:string) => {
        if(!options) options = {mediaType: "application/json"}
        else if(!options.mediaType) options["mediaType"] = "application/json";

        const currentData = Reflect.getMetadata(HTTPResponseLabel, target, propName);
        const newEntry = {statusCode: statusCode, options: options}

        Reflect.defineMetadata(HTTPResponseLabel, currentData ? [newEntry, ...currentData] : [newEntry], target, propName);
    }
}