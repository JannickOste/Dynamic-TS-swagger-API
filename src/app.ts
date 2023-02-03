import Database from "./services/database/database.service";
import AppServiceModel from "./services/appServiceModel";
import * as dotenv from "dotenv"
import APIService from "./services/api/api.service";
import AppServiceManager from "./services/appServiceManager";
import JWTTokenEntity from "./entities/internal/jwt.entity";


export class App 
{
    constructor()
    {
        // Setup enviroment variables.
        dotenv.config();
    }

    /**
     * Configure env and start services.
     * 
     * @returns exitcode
     */
    public async start(): Promise<number>
    {
        await AppServiceManager.loadServices();

        return 0;
    }

    public async Stop(): Promise<number>
    {
        await AppServiceManager.destroyServices();
        return 0;
    }

}

if(process.env.PWD === process.env.INIT_CWD)
{
    (async() => {
        const application = new App();
    
        await application.start();
    })()
} 