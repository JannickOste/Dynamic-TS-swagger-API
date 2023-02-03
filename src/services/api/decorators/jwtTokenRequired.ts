
import "reflect-metadata";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { IHTTPStatusCode } from "../../../types/IHTTPStatusCode";


export const SecurityDecoratorLabel = "Security"
export const JWTTokenLabel = "jwtToken"

export const JWTToken = () => {
    return (target:any, propName:string) => {

        const currentData = Reflect.getMetadata(SecurityDecoratorLabel, target);
        const newEntry = {[JWTTokenLabel]:[]}

        Reflect.defineMetadata(SecurityDecoratorLabel, currentData ? [newEntry, ...currentData] : [newEntry], target, propName);
    }
}