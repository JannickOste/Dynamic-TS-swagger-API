import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types"
import "reflect-metadata"

export const HTTPParamsDecoratorLabel = "HTTPParameters"

export function Parameters(methodType: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]) {
    return Reflect.metadata(HTTPParamsDecoratorLabel, methodType)
}
