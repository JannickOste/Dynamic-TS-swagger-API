import express from "express";
import * as swaggerUi from "swagger-ui-express"
import Database from "./services/database";
import routesMapper from "./services/routesMapper"
import * as dotenv from "dotenv"
import cors from "cors";
import * as core from 'express-serve-static-core';

import * as http from "http";
import * as https from "https"
import { IEnviromentServer } from "./types/IEnviromentServer";
import * as OpenApiValidator from 'express-openapi-validator';
import ApiSpecGenerator from "./APISpecBuilder";


class App 
{
    private readonly express:core.Express;
    private readonly serverInstances:any[] = [];

    /**
     * Server initializers, require a port or crede
     */
    private readonly serverLoader:IEnviromentServer[] = [
        {
            env_port_label: "SERVER_PORT_HTTP",
            throwOnNull: true,
            listener: (port) => http.createServer(this.express).listen(port)
        },
        {
            env_port_label: "SERVER_PORT_HTTPS",
            listenerWithArgs: (data, port) => https.createServer(this.express).listen(data, port)
        }
    ]

    constructor()
    {
        this.express = express();
    }

    /**
     * Load enviroment data and configure application services
     */
    async configure(): Promise<void>
    {
        dotenv.config();    

        this.express.use(cors({
            origin: '*', 
            allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
            methods: "GET, POST, PUT, PATCH, DELETE"
        }));
        
        this.express.use(express.json())     
        this.express.use(express.text())
        this.express.use(express.urlencoded({extended: true}))

        const spec = await new ApiSpecGenerator().build("./src/routes/**/*.ts");
        this.express.use(process.env.SWAGGER_DOC_ENDPOINT as string, 
                    swaggerUi.serve, swaggerUi.setup(spec));
        
        this.express.use(
            OpenApiValidator.middleware({
              apiSpec: spec,
              validateRequests: true,
              validateResponses: true,
            })
        );
        /**
         * Error handler
        this.express.use((err: any, req: any, res: any, next: any) => {
            // format error
            res.status(err.status || 500).json({
              message: err.message,
              errors: err.errors,
            });
        });
        */

        this.express.get("/", (req:any, res:any) => res.redirect(process.env.SWAGGER_DOC_ENDPOINT));
        
        await routesMapper(this.express);

        await Database.Singleton.connector.initialize();
    }

    /**
     * Load application service listeners and assign them to the server stack.
     */
    async start()
    {
        for(let serverInitializer of this.serverLoader)
        {
            let portRaw:string|undefined = process.env[serverInitializer.env_port_label];
            if(portRaw)
            {
                portRaw = portRaw.trim();

                if(/[0-9]+/.test(portRaw))
                {
                    const port:number = parseInt(portRaw);
                    const startMessage:string = `Starting webserver on port: ${portRaw}`

                    if(serverInitializer.listener)
                    {
                        console.log(startMessage);
                        this.serverInstances.push(serverInitializer.listener(port));
                    }
                    else if(serverInitializer.listenerWithArgs)
                    {
                        if(serverInitializer.credentials)
                        {
                            console.log(startMessage);

                            this.serverInstances.push(serverInitializer.listenerWithArgs(serverInitializer.credentials, port));
                        } else console.log(`[${serverInitializer.env_port_label}]: Attempting to load server with credentials, but no credentials found...`);
                    }
                    else console.log(`[${serverInitializer.env_port_label}]: No listener found for server`);
                } else console.log(`[${serverInitializer.env_port_label}]: value '${serverInitializer.env_port_label}' is invalid,  `);
            }
        }

    }
}

export default (async() => {
    const application = new App();

    await application.configure();
    await application.start();
})();
