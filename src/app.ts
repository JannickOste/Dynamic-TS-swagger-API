import Database from "./services/database";
import AppService from "./appService";
import * as dotenv from "dotenv"
import APIServerService from "./services/api/apiServer";


export class App 
{
    // Application services, mayby replace this using glob patern?
    private readonly services:Set<AppService> = new Set([
        Database.Singleton,
        new APIServerService()
    ].map(v => v as AppService));

    /**
     * Configure env and start services.
     * 
     * @returns exitcode
     */
    public async start(): Promise<number>
    {
        // Setup enviroment variables.
        dotenv.config();

        // Start application services.
        for(let service of this.services)
            await service.startService();
        
        return 0;
    }

    public async destroy () {
        await Database.Singleton.destroy();
    }

}

if(process.env.PWD === process.env.INIT_CWD)
{
    (async() => {
        const application = new App();
    
        await application.start();
    })()
} 