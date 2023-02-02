import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as glob from "glob";
import "reflect-metadata"
import { RouteDecoratorLabel } from './decorators/route';
import { HTTPMethodDecoratorLabel } from './decorators/httpMethod';
import { BodyDataDecoratorLabel } from './decorators/bodyData';
import Logger from '../../utils/logger';
import { IHTTPRequestMethodType } from '../../types/IHTTPRequestMethodType';
import { QueryParameterLabel, QueryParameterOptions } from './decorators/queryParameter';
import { HTTPResponseLabel, HTTPResponseOptions } from './decorators/httpResponse';

export default class APISpecBuilder
{
  /**
   * OpenAPI version: 3.0.0 
   */
  public static openapi = "3.0.0";

  /**
   * API name and version. => default: {title: API Version, version: '1.0.0'}
   */
  private static get info(): OpenAPIV3.InfoObject 
  {
    const {SWAGGER_API_NAME, SWAGGER_API_VERSION} = process.env;

    const info:OpenAPIV3.InfoObject = {
      title: "API Service",
      version: "1.0.0"
    }

    if(SWAGGER_API_NAME)
      info["title"] = SWAGGER_API_NAME;

    if(SWAGGER_API_VERSION)
      info["version"] = SWAGGER_API_VERSION;

    return info;
  }

  /**
   * API HTTP & HTTPS server domains.
   */
  private static get servers(): OpenAPIV3.ServerObject[]
  {
    const servers = [];

    const {
      SERVER_DOMAIN,
      SERVER_PORT_HTTP,
      SERVER_PORT_HTTPS
    } = process.env;

    if(SERVER_PORT_HTTP)
      servers.push({
        url: `http://${SERVER_DOMAIN}:${SERVER_PORT_HTTP}`
      });

    if(SERVER_PORT_HTTPS)
      servers.push({
        url: `https://${SERVER_DOMAIN}:${SERVER_PORT_HTTPS}`
      })
      
    return servers;
  }


  private static async getComponents(schemaGlob:string):Promise<OpenAPIV3.ComponentsObject>
  {
    const schemas: {[key:string]: OpenAPIV3.ReferenceObject|OpenAPIV3.SchemaObject} = await APISpecBuilder.getSchemas(schemaGlob);

    Logger.log(this, `Found ${Object.entries(schemas).length} schemas`);
    return {
      schemas: schemas
      
    }
  }

  private static async getSchemas(schemaGlob: string): Promise<{[key:string]:OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject}> 
  {
    let schemas: {[key:string]: OpenAPIV3.ReferenceObject|OpenAPIV3.SchemaObject} = {}
    
    let module: any = undefined;
    for(let schemaPath of new glob.GlobSync(schemaGlob).found)
      if(module = await import(process.env.PWD+schemaPath.slice(1)))
        schemas = {
          ...schemas, 
          ...Object.fromEntries(Object.entries(module))
        }
    
    return schemas;
  }

  private static security?: OpenAPIV3.SecurityRequirementObject[];
  private static tags?: OpenAPIV3.TagObject[] | undefined;
  private static externalDocs?:OpenAPIV3.ExternalDocumentationObject;

  /**
   * All accessible endpoints with APISpecMetadataObjects bound as decorator found using pattern match using reflection.
   * @param routesGlob 
   * @returns 
   */
  private static async getPaths(routesGlob:string): Promise<OpenAPIV3.PathsObject>
  {
    const paths: OpenAPIV3.PathsObject = {}

    for(let path of new glob.GlobSync(routesGlob).found)
    {
        const objectInstance = new (await import(process.env.PWD+path.slice(1))).default();
        
        const propNames = Object.getOwnPropertyNames(objectInstance);
        for(let propName of propNames)
        {
          const spec = APISpecBuilder.buildSpecFromMethod(objectInstance, propName);
          if(spec)
            paths[spec.route] = spec.data
        }
    }


    return paths;
  }

  public static buildSpecFromMethod = (obj: any, propName: string, requestsRequireBody:IHTTPRequestMethodType[] = ["post", "put", "delete"]): any => {
    const routeData = Reflect.getMetadata(RouteDecoratorLabel, obj, propName);
    if(!routeData) return;

    let result:OpenAPIV3.PathItemObject = {}

    const requestMethods = Reflect.getMetadata(HTTPMethodDecoratorLabel, obj, propName);
    if(!requestMethods)
    {
      Logger.error(this, `Route definition '${routeData.route}' found but no HTTPMethods specified, skipping assignment...`);
      return;
    }


    for(let method of requestMethods){
      const methodData: {[key:string]:any} =  {
        summary: routeData.description
      }

      const bodyData = Reflect.getMetadata(BodyDataDecoratorLabel, obj, propName);
      if(bodyData)
      {
        methodData["requestBody"] = bodyData
      } else if(requestsRequireBody.includes(method as IHTTPRequestMethodType))
      {
        Logger.error(this, `Attempting to assign '${method}' method without body data for endpoints '${routeData.route}' but this is marked as required, skipping generation`);
        continue;
      }

      // Get parameter data
      const paramData = Reflect.getMetadata(QueryParameterLabel, obj, propName);
      if(paramData)
        methodData["parameters"] = this.parseQueryParameters(Reflect.getMetadata(QueryParameterLabel, obj, propName));

      // Build response schemas.
      const responses = Reflect.getMetadata(HTTPResponseLabel, obj, propName);
      if(responses)
      {
        methodData["responses"] = this.parseHTTPResponses(responses)
      }

      result = {...result, ...Object.fromEntries([[method, methodData]])}
    }
      return {
        route:routeData.route,
        data: result
      };
  }

  private static parseQueryParameters = (entries: {name:string, options:QueryParameterOptions}[]) => entries.map(v => {
      return {in: "query", name:v.name, description:v.options.description, schema: v.options.schema}
  })

  private static parseHTTPResponses = (entries: {statusCode: number, options:HTTPResponseOptions}[]) => {
    let output: any = {};
    entries.forEach(v => {
      output[v.statusCode] = {
        description: v.options.description,
        content: {
          [v.options.mediaType as string]: {
            schema: v.options.schema
          }
        }
      }
    })
    return output;
  }

  /**
   * Build an {OpenAPIV3.Document} based on eniroment data and the specified path pattern.
   * 
   * @param routesGlob 
   * @returns 
   */
  build = async(routesGlob:string, schemasGlob:string): Promise<OpenAPIV3.Document> =>
  {
    return {
      openapi: APISpecBuilder.openapi,
      info: APISpecBuilder.info,
      paths: await APISpecBuilder.getPaths(routesGlob),
      components: await APISpecBuilder.getComponents(schemasGlob),
      externalDocs: APISpecBuilder.externalDocs,
      security: APISpecBuilder.security,
      servers: APISpecBuilder.servers,
      tags: APISpecBuilder.tags
    }
  }
}