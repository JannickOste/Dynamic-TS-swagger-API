import "reflect-metadata"
import { IHTTPRequestMethodType } from "../../types/IHTTPRequestMethodType"

export const HTTPMethodDecoratorLabel = "HTTPMethod"

export function HTTPMethod(methodType: IHTTPRequestMethodType[]) {
    return Reflect.metadata(HTTPMethodDecoratorLabel, methodType)
}
