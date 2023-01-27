import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types"
import "reflect-metadata"

export const ResponseDecoratorLabel = "APIResponses"

export function Responses(responses: {statusCode:number, description:string, schema?: OpenAPIV3.SchemaObject}[]) 
{
    return Reflect.metadata(ResponseDecoratorLabel, responses)
}
