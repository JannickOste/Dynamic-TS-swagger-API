import { RequestListener } from "http";
import { Response } from "express";

export type IExpressRouteHandlerType = Promise<RequestListener|Response<any, Record<string, any>>>