import * as core from 'express-serve-static-core';
import * as glob from "glob";
import RouteBase from '../types/routeBase';


export default async(app:core.Express) => {
    const handlerPaths = new glob.GlobSync("./src/routes/**/*Handler.ts").found.map((v) => `${process.env.PWD}${v.slice(1)}`)

    for(let path of handlerPaths)
    {
        const module = await import(path);
        if(module)
        {
            const moduleInstance: RouteBase = new module.default(app);
            if(moduleInstance)
            {
                if(moduleInstance.Setup)
                    moduleInstance.Setup();
                else throw new Error(`${moduleInstance} has not setup function`)
            }
        }
    }
}