import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as glob from "glob";
import { GetAPISpecMetadataOfMethod } from './apiSpecMetadata';
import "reflect-metadata"
import Logger from '../utils/logger';

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
          const metadata = GetAPISpecMetadataOfMethod(objectInstance, propName);
          if(metadata)
          {
            const {route, data:apiSpec} = metadata;
            if(route && apiSpec)
              paths[route] = apiSpec;
          }
        }
    }


    return paths;
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