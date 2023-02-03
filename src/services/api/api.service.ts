import express, { NextFunction, Request, Response} from "express";
import * as swaggerUi from "swagger-ui-express"
import cors from "cors";
import * as core from 'express-serve-static-core';

import * as http from "http";
import * as https from "https"
import * as OpenApiValidator from 'express-openapi-validator';
import glob, { GlobSync } from "glob";
import APISpecBuilder from "./apiSpecBuilder";
import { Socket } from "node:net";
import AppServiceModel from "../appServiceModel";
import Logger from "../../utils/logger";
import RouteBase from "../../types/routeBase";
import { IExpressRouteHandlerType } from "../../types/IExpressRouteType";
import StringUtils from "../../utils/StringUtils";
import * as fs from "fs";

type IHTTPSCredentials = {
    key:string;
    certificate:string;
}

export default class APIService extends AppServiceModel
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
            onSuccessMessage:'Succesfully configure API service',
            priority: 1
        });

        this.express = express();
        
        super.configureCallback = this.configure;
        super.startCallback = this.start;
    }


    /**
     * Scrape APISpecMetadata from controller functions and map controllers based found metadata.
     * 
     * @returns 
     */
    private async allocateEndpoints():Promise<boolean>
    {
        const {SWAGGER_API_CONTROLLER_NAME_SUFFIX, SWAGGER_API_CONTROLLER_ROOT, SWAGGER_API_SCHEMA_NAME_SUFFIX} = process.env
        const handlerPaths = new glob.GlobSync(`${SWAGGER_API_CONTROLLER_ROOT}**/*${SWAGGER_API_CONTROLLER_NAME_SUFFIX}.{ts, js}`).found.map((v) => `${process.env.PWD}${v.slice(1)}`)
        

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

        this.express.get("/", (req:Request, res:Response) => res.redirect(process.env.SWAGGER_DOC_ENDPOINT as string));
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
            `${process.env.SWAGGER_API_CONTROLLER_ROOT}**/*${process.env.SWAGGER_API_CONTROLLER_NAME_SUFFIX}.{ts, js}`,
            `${process.env.SWAGGER_API_SCHEMA_ROOT}**/*${process.env.SWAGGER_API_SCHEMA_NAME_SUFFIX}.{ts, js}`
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
        
        
        await this.allocateEndpoints();
    }

    private start = async() => {
        const {SERVER_PORT_HTTP, SERVER_PORT_HTTPS, SERVER_DOMAIN, HTTPS_CERT, HTTPS_KEY} = process.env;

        if(SERVER_DOMAIN)
        {
            if(SERVER_PORT_HTTP)
            {
                if(StringUtils.IsDigit(SERVER_PORT_HTTP))
                {
                    const httpPort: number = parseInt(SERVER_PORT_HTTP);
                    Logger.log(this, `env variable 'SERVER_PORT_HTTP' found, starting server on http://${SERVER_DOMAIN}:${SERVER_PORT_HTTP}/`)
                    this.startHTTP(httpPort);
                } else Logger.error(this, `Failed to start API using http, value '${SERVER_PORT_HTTP}' is not a digit`)
            }

            //!Todo: Add credential check here, start HTTPS if registered, otherwise not.
            if(SERVER_PORT_HTTPS)
            {
                if(!StringUtils.IsDigit(SERVER_PORT_HTTPS))
                {
                    Logger.error(this, "Attempting to start HTTPS listener but 'SERVER_PORT_HTTPS' env variable must be numeric.");
                    return;
                }
                
                if(!HTTPS_CERT)
                {
                    Logger.error(this, "Attempting to start HTTPS listener but no 'HTTPS_CERT' env variable found.");
                    return;
                } 
                else if(!fs.existsSync(HTTPS_CERT))
                {
                    Logger.error(this, "HTTPS_CERT env variable found but path is invalid");
                    return;
                }


                if(!HTTPS_KEY)
                {
                    Logger.error(this, "Attempting to start HTTPS listener but no 'HTTPS_KEY' env variable found.");
                    return;
                } 
                else if(!fs.existsSync(HTTPS_KEY))
                {
                    Logger.error(this, "HTTPS_KEY env variable found but path is invalid");
                    return;
                }

                const httpPort: number = parseInt(SERVER_PORT_HTTPS);
                Logger.log(this, `env variable 'SERVER_PORT_HTTPS' found and certificate information, starting server on https://${SERVER_DOMAIN}:${SERVER_PORT_HTTPS}/`)
                this.startHTTPS(httpPort, {
                    certificate: fs.readFileSync(HTTPS_CERT).toString(),
                    key: fs.readFileSync(HTTPS_KEY).toString()
                });
            }
        }
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
    public startHTTPS = (port:number, credentials: IHTTPSCredentials)  => this.listener = this.configureListener(https.createServer({
        key:credentials.key,
        cert: credentials.certificate    
    }, this.express).listen(port));

    public destroy = (listenerExitCallback?: (err?: Error) => void) => {
        for(let socket of this.sockets)
        {
            socket.destroy();

            this.sockets.delete(socket);
        }

        return this.listener?.close(listenerExitCallback);
    }
}