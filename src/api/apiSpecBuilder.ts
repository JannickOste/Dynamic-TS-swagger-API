import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as glob from "glob";
import "reflect-metadata"
import Logger from '../utils/logger';
import { RouteDecoratorLabel } from './decorators/route';
import { ResponseDecoratorLabel } from './decorators/responses';
import { HTTPMethodDecoratorLabel } from './decorators/httpMethod';
import { BodyDataDecoratorLabel } from './decorators/bodyData';
import { IHTTPRequestMethodType } from '../types/IHTTPRequestMethodType';

export default class APISpecBuilder
{
  /**
   * OpenAPI version: 3.0.0 (current)
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
    const requestMethods = Reflect.getMetadata(HTTPMethodDecoratorLabel, obj, propName);

    let result:OpenAPIV3.PathItemObject = {}

    const route = Reflect.getMetadata(RouteDecoratorLabel, obj, propName);
    if(route)
    {
      if(requestMethods)
      {
        for(let method of requestMethods)
        {
          let data: any = {}
          data[method] = {}

            data[method]["summary"] = route.description;

            const bodyData = Reflect.getMetadata(BodyDataDecoratorLabel, obj, propName);
            if(bodyData)
            {
              data[method]["requestBody"] = bodyData
            } else if(requestsRequireBody.includes(method as IHTTPRequestMethodType))
            {
              Logger.error(this, `Attempting to assign '${method}' method without body data for endpoints '${route.route}' but this is marked as required, skipping generation`);
              continue;
            }


            const responses = Reflect.getMetadata(ResponseDecoratorLabel, obj, propName);
            if(responses)
            {
              data[method]["responses"] = {}
              for(let response of responses)
              {
                data[method]["responses"][response.statusCode] = {
                  description: response.description,
                  content: {
                    "application/json":{
                      schema: response.schema
                    }
                  }
                }

                result = {...result, ...data}
              }
            }
          }
        }
      return {
        route:route.route,
        data: result
      };
    }
  }

  /**
   * Build an {OpenAPIV3.Document} based on eniroment data and the specified path pattern.
   * !TODO: change enviroment based loading to parameters based with auto-fill.
   * 
   * @param routesGlob 
   * @returns 
   */
  build = async(routesGlob:string, schemasGlob:string): Promise<OpenAPIV3.Document> =>
  {
    return {
      openapi: APISpecBuilder.openapi,
      info: APISpecBuilder.info,
      paths: await APISpecBuilder.getPaths(routesGlob),//await APISpecBuilder.getPaths(routesGlob),
      components: await APISpecBuilder.getComponents(schemasGlob),
      externalDocs: APISpecBuilder.externalDocs,
      security: APISpecBuilder.security,
      servers: APISpecBuilder.servers,
      tags: APISpecBuilder.tags
    }
  }
}