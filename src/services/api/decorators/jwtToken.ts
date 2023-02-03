
import "reflect-metadata";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { IHTTPStatusCode } from "../../../types/IHTTPStatusCode";


export const SecurityDecoratorLabel = "Security"
export const JWTTokenLabel = "jwtToken"

export const JWTToken = (... access:("read"|"write")[]) => {
    return (target:any, propName:string) => {

        const currentData = Reflect.getMetadata(SecurityDecoratorLabel, access);
        const newEntry = {[JWTTokenLabel]:access}

        Reflect.defineMetadata(SecurityDecoratorLabel, currentData ? [newEntry, ...currentData] : [newEntry], target, propName);
    }
}