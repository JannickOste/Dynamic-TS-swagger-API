import { RequestListener } from "http";
import { Response, Request } from "express";

export type IExpressRouteHandlerType = Promise<RequestListener|Response<any, Record<string, any>>>