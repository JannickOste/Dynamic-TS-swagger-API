import express from "express";
import * as swaggerUi from "swagger-ui-express"
import Database from "./services/database";
import * as dotenv from "dotenv"
import APIWebServer from "./api/APIWebServer";
import Logger from "./utils/logger";


class App 
{
    private readonly serverInstance:APIWebServer;

    constructor()
    {

        this.serverInstance = new APIWebServer();
    }
    
    private async configure(): Promise<boolean>
    {
        const serviceStarts = [
            {
                onInitMessage:`Attempting to connect to mariadb server.`,
                onFailMessage:'Failed to connect to database...',
                onSuccessMessage:'Succesfully connected to database.',
                startCallback: async() => await Database.Singleton.connector.initialize()
            },
            {
                onInitMessage:`Attempting to build API configuration`,
                onFailMessage:'Failed to configure API endpoints',
                onSuccessMessage:'Succesfully configure API service',
                startCallback: async() => await this.serverInstance.configure()
            }
        ]

        for(let service of serviceStarts)
        {
            try
            {
                Logger.log(this, service.onInitMessage);
                await service.startCallback()
                Logger.log(this, service.onSuccessMessage)
            }
            catch(e)
            {
                Logger.error(this, service.onFailMessage)
                return false;
            }
        }

        return true;
    }

    async startHTTP()
    {
        dotenv.config();    

        const {SERVER_PORT_HTTP, SERVER_DOMAIN, SWAGGER_DOC_ENDPOINT} = process.env;
        if(SERVER_PORT_HTTP)
        {
            if(/[0-9]+/.test(SERVER_PORT_HTTP))
            {
                if(await this.configure() && SWAGGER_DOC_ENDPOINT)
                {
                    Logger.log(this, `Starting API using HTTP on: http://${SERVER_DOMAIN}:${SERVER_PORT_HTTP}${SWAGGER_DOC_ENDPOINT}/`);
                    
                    return this.serverInstance.startHTTP(parseInt(SERVER_PORT_HTTP))
                } else Logger.error(this, "Failed to configure application, exiting...");
            } else Logger.error(this, `Invalid enviroment variabe 'SERVER_PORT_HTTP' found '${SERVER_PORT_HTTP}' but value must be numeric.`);
        } else Logger.error(this, `Enviroment variabe 'SERVER_PORT_HTTP' is unset, variable required to start server on HTTP.`);
    }

    async startHTTPS()
    {
        return Logger.log(this, "HTTPS is temporarly disabled until credential loading is reimpemented")
        /*
        dotenv.config();    

        const {SERVER_PORT_HTTPS, SERVER_DOMAIN} = process.env;
        if(SERVER_PORT_HTTPS)
        {
            if(/[0-9]+/.test(SERVER_PORT_HTTPS))
            {
                if(await this.configure())
                {

                    Logger.log(this, `Starting API using HTTP on: https://${SERVER_DOMAIN}:${SERVER_PORT_HTTPS}/`);
                    
                    return this.serverInstance.startHTTP(parseInt(SERVER_PORT_HTTPS))
                } else Logger.error(this, "Failed to configure application, exitting...");
            } else Logger.error(this, `Invalid enviroment variabe 'SERVER_PORT_HTTP' found '${SERVER_PORT_HTTPS}' but value must be numeric.`);
        } else Logger.error(this, `Enviroment variabe 'SERVER_PORT_HTTP' is unset, variable required to start server on HTTP.`);
        */
    }

}
(async() => {
    const application = new App();

    await application.startHTTP();
})()