import express, { NextFunction, Request, Response} from "express";
import * as swaggerUi from "swagger-ui-express"
import cors from "cors";
import * as core from 'express-serve-static-core';

import * as http from "http";
import * as https from "https"
import * as OpenApiValidator from 'express-openapi-validator';
import glob from "glob";
import APISpecBuilder from "./apiSpecBuilder";
import { Socket } from "node:net";
import AppService from "../../appService";
import Logger from "../../utils/logger";
import RouteBase from "../../types/routeBase";
import { IExpressRouteHandlerType } from "../../types/IExpressRouteType";

type IHTTPSCredentials = {
    key:string;
    certificate:string;
}

export default class apiServer extends AppService
{    
    private readonly express:core.Express;
    private listener?:http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
                        |https.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;

    private sockets: Set<Socket> = new Set();

    constructor()
    {
        super({
            onInitMessage:`Attempting to build API configuration`,
            onFailMessage:'Failed to configure API endpoints',
            onSuccessMessage:'Succesfully configure API service'
        });

        this.express = express();
        
        super.configureCallback = this.configure;
        super.startCallback = async() => {
            //!Todo: Add credential check here, start HTTPS if registered, otherwise not.
            this.startHTTP(8080);
        }
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
                    Logger.log(this, `allocating endpoints for '${moduleInstance.constructor.name}'`);

                    moduleInstance.Configure();
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
        Logger.log(this, "Configuring service...");

        // Setup response type handling
        Logger.log(this, "Setting up text, json and body data handling");
        this.express.use(express.json())     
        this.express.use(express.text())
        this.express.use(express.urlencoded({extended: true}))

        // Setup cors
        Logger.log(this, "Setting up CORS access.")
        this.express.use(cors({
            origin: '*', 
            allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
            methods: "GET, POST, PUT, PATCH, DELETE"
        }));

        // Build the API metadata and bind to swaggerUI
        const spec = await new APISpecBuilder().build(
            `${process.env.SWAGGER_API_CONTROLLER_ROOT}**/*Controller.ts`,
            `${process.env.SWAGGER_API_SCHEMA_ROOT}**/*Schema.ts`
        );
        
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

    private configureListener(listener: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
                                          |https.Server<typeof http.IncomingMessage, typeof http.ServerResponse>)
    {
        listener.on("connection", (socket: Socket) => {
            this.sockets.add(socket);

            socket.on("close", (hadError) => {
                if(hadError)
                {
                    Logger.error(this, "A socket error occured");
                    console.dir(socket)
                }

                this.sockets.delete(socket);
            });
        })

        return listener;
    }
    public startHTTP =  (port: number) => this.listener = this.configureListener(http.createServer(this.express).listen(port))
    public startHTTPS = (port:number)  => this.listener = this.configureListener(https.createServer(this.express).listen(port));

    public destroy = (listenerExitCallback?: (err?: Error) => void) => {
        for(let socket of this.sockets)
        {
            socket.destroy();

            this.sockets.delete(socket);
        }

        return this.listener?.close(listenerExitCallback);
    }
}