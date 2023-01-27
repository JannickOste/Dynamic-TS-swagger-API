import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types"
import "reflect-metadata"

type APISpecMetadataObject = {
    route:string;
    data:OpenAPIV3.PathItemObject
    component?:OpenAPIV3.ComponentsObject;
}

/**
 * Primary APISpec metadata label
 */
export const APISpecMetadataLabel = "ApiSpec";

/**
 * Attempt to get a APISpec from an object based on it's method name.
 * 
 * @param {any}    instance   The target object instance
 * @param {string} methodName The target methodname
 * 
 * @returns {undefined|APISpecMetadataObject} APISpecMetadata object or undefined.
 */
export const GetAPISpecMetadataOfMethod = (instance: any, methodName: string): APISpecMetadataObject => Reflect.getMetadata(APISpecMetadataLabel, instance, methodName);

/**
 * APISpec Metadata decorator
 * 
 * @param {string} route Endpoint
 * @param {OpenAPIV3.PathItemObject} metadataValue HTTP-request/response data
 * 
 * @returns {Reflect} Reflection assignment
 */
const APISpecMetadata = (route: string, metadataValue: OpenAPIV3.PathItemObject, component?: OpenAPIV3.ComponentsObject): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
} => Reflect.metadata(APISpecMetadataLabel, Object.fromEntries([
    ["route", route],
    ["data", metadataValue],
    ["component", component]
]));

export default APISpecMetadata;