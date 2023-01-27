import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types"
import "reflect-metadata"

export const BodyDataDecoratorLabel = "HTTPBodyData"

export function BodyData(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, required?: boolean) {

    return Reflect.metadata(BodyDataDecoratorLabel, {
        required: required,
        content: {
            "application/json":{schema: schema}
        }
    })
}
