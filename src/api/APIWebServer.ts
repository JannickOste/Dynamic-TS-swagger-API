import express, { NextFunction, Request, Response} from "express";
import * as swaggerUi from "swagger-ui-express"
import * as dotenv from "dotenv"
import cors from "cors";
import * as core from 'express-serve-static-core';

import * as http from "http";
import * as https from "https"
import * as OpenApiValidator from 'express-openapi-validator';
import APISpecBuilder from "./APISpecBuilder";
import glob from "glob";
import RouteBase from "../types/routeBase";
import { IExpressRouteHandlerType } from "../types/IExpressRouteType";
import Logger from "../utils/logger";


export default class APIWebServer 
{    
    private readonly express:core.Express;
    private listener?:http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;

    constructor()
    {
        this.express = express();
    }

    /**
     * Error handler middleware upon server error.
     * 
     * @param error 
     * @param request 
     * @param response 
     * @param next 
     * @returns 
     */
    private async onServerError(error: any, request: Request, response: Response, next: NextFunction):Promise<IExpressRouteHandlerType>
    {
        // format error
        return response.status(error.status || 500).json({
            message: error.message,
            errors: error.errors,
        });
    }

    /**
     * Scrape APISpecMetadata from controller functions and map controllers based found metadata.
     * 
     * @returns 
     */
    private async allocateEndpoints():Promise<boolean>
    {
        const handlerPaths = new glob.GlobSync(`${process.env.SWAGGER_API_CONTROLLER_ROOT}**/*Controller.ts`).found.map((v) => `${process.env.PWD}${v.slice(1)}`)
        

        Logger.log(this, `Found ${handlerPaths.length} controllers`)
        for(let path of handlerPaths)
        {
            const module = await import(path);

            if(module)
            {
                const moduleInstance: RouteBase = new module.default(this.express);
                if(moduleInstance)
                {
                    if(moduleInstance.Setup)
                    {
                        Logger.log(this, `allocating endpoints for '${moduleInstance.constructor.name}'`);

                        moduleInstance.Setup();
                    }
                    else throw new Error(`${moduleInstance} has not setup function`)
                }
            }
        }

        return !(!handlerPaths.length);
    }


    /**
     * Load enviroment data and configure application services
     */
    async configure(): Promise<void>
    {        
        // Setup response type handling
        this.express.use(express.json())     
        this.express.use(express.text())
        this.express.use(express.urlencoded({extended: true}))

        // Setup cors
        this.express.use(cors({
            origin: '*', 
            allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
            methods: "GET, POST, PUT, PATCH, DELETE"
        }));

        // Build the API metadata and bind to swaggerUI
        const spec = await new APISpecBuilder().build(`${process.env.SWAGGER_API_CONTROLLER_ROOT}**/*.ts`);
        this.express.use(process.env.SWAGGER_DOC_ENDPOINT as string, 
                    swaggerUi.serve, swaggerUi.setup(spec));
        
        // Setup schema validation middleware.
        this.express.use(
            OpenApiValidator.middleware({
              apiSpec: spec,
              validateRequests: true,
              validateResponses: true,
            })
        );
        
        
        this.express.use((err: any, req: Request, res: Response, next: NextFunction) =>  this.onServerError);
        await this.allocateEndpoints();
        this.express.get("/", (req:Request, res:Response) => res.redirect(process.env.SWAGGER_DOC_ENDPOINT as string));
        

    }

    public startHTTP =  (port: number) => this.listener = http.createServer(this.express).listen(port);
    public startHTTPS = (port:number)  => this.listener = https.createServer(this.express).listen(port);
}