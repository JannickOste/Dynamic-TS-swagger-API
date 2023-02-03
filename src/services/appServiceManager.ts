import { glob, GlobSync } from "glob";
import AppServiceModel from "./appServiceModel";
import Logger from "../utils/logger";

export default class AppServiceManager 
{
    private static services?: Set<AppServiceModel> = new Set<AppServiceModel>();

    private static getServices = async(nullOnError:boolean = true): Promise<Set<AppServiceModel>|undefined> =>
    {
        let output: Set<AppServiceModel> = new Set<AppServiceModel>();

        const {APPLICATION_SERVICES_ROOT, APPLICATION_SERVICES_PREFIX} = process.env;
        for(let globPath of new GlobSync(`${APPLICATION_SERVICES_ROOT}**/*${APPLICATION_SERVICES_PREFIX}.{ts, js}`).found)
        {
            const modulePath:string = `${process.env.PWD}${globPath.slice(1)}`;
            let err: Error|undefined = undefined;
            try
            {
                const module = (await import(modulePath));
                const moduleInstance = new module.default();
                if(moduleInstance.Singleton)
                    console.dir(module)

                output.add(moduleInstance);
            }
            catch(e)
            {
                err = (e as Error);

                Logger.error(this, "Failed importing module");
                Logger.error(this, err.message);
            }
            finally
            {
                if(err && nullOnError)
                    return undefined;
            }
            
        }

        return output;
    }

    

    public static loadServices = async(): Promise<boolean> => {
        this.services = await this.getServices();
        if(!this.services)
        {
            Logger.error(this, "Failed to start services...");
            return false;
        }

        let currentService: AppServiceModel | undefined;
        let serviceQueue = [... this.services.values()].sort((a, b) => 
            b.priority !== undefined && a.priority !== undefined 
            ? 1
            : -1)
        try
        {
            while((currentService = serviceQueue.shift()))
                await currentService.startService();
        }
        catch(err)
        {
            if(currentService)
                Logger.error(this, `Failed start service ${currentService.constructor.name}`);
            else 
            {
                Logger.error(this, "Unkown error:");
                Logger.exception(this, (err as Error).message);
            }

            return false;
        }

        return true;
    }

    public static destroyServices = async() => {
        if(this.services)
            for(let service of this.services)
                if(service.stopService)
                    service.stopService();
    }
}