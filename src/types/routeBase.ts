import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as core from 'express-serve-static-core';
import APISpecBuilder from '../services/api/apiSpecBuilder';
import { IHTTPRequestMethodType } from './IHTTPRequestMethodType';


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

    public Configure = ():void => {
        for(let key of Object.getOwnPropertyNames(this))
        {
            const propertyMetadata: {route:string, data: OpenAPIV3.PathItemObject} = APISpecBuilder.buildSpecFromMethod(this, key)

            if(propertyMetadata)
            {
                const {route, data: pathObject} = propertyMetadata;
                const callbackMethod = Object.getOwnPropertyDescriptor(this, key);
                
                for(let requestMethod of Object.keys(pathObject))
                {
                    if(requestMethod !== "description")
                    this.express[requestMethod as IHTTPRequestMethodType](route.replace("{", ":").replace("}", ""), callbackMethod?.value);
                }
            }
        }   
    }

}