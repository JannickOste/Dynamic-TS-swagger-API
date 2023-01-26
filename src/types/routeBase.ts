import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as core from 'express-serve-static-core';
import { GetAPISpecMetadataOfMethod } from '../api/APISpecMetadata';


export  type IHTTPRequestMethodType = "get" |"put" | "post" | "patch" | "delete";

export default abstract class RouteBase 
{
    private readonly _express: core.Express;
    protected get express():core.Express
    {
        return this._express;
    }

    constructor(express: core.Express)
    {
        this._express = express;
    }

    public Setup = ():void => {
        for(let key of Object.getOwnPropertyNames(this))
        {
            const propertyMetadata: {route:string, data: OpenAPIV3.PathItemObject} = GetAPISpecMetadataOfMethod(this, key);
            if(propertyMetadata !== undefined)
            {
                const {route, data: pathObject} = propertyMetadata;
                const callbackMethod = Object.getOwnPropertyDescriptor(this, key);
                
                for(let requestMethod of Object.keys(pathObject))
                {
                    this.express[requestMethod as IHTTPRequestMethodType](route, callbackMethod?.value);
                }
            }
        }
    }

}