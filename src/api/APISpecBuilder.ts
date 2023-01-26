import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as glob from "glob";
import { APISpecMetadataLabel } from './APISpecMetadata';
import "reflect-metadata"

export default class APISpecBuilder
{
  private static get openapi():string {return "3.0.0"}
  
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

  private static components?: OpenAPIV3.ComponentsObject;
  private static security?: OpenAPIV3.SecurityRequirementObject[];
  private static tags?: OpenAPIV3.TagObject[] | undefined;
  private static externalDocs?:OpenAPIV3.ExternalDocumentationObject;

  private static async getPaths(routesGlob:string) 
  {
    const paths: OpenAPIV3.PathsObject = {}

    for(let path of new glob.GlobSync(routesGlob).found)
    {
        const objectInstance = new (await import(process.env.PWD+path.slice(1))).default();
        
        const propNames = Object.getOwnPropertyNames(objectInstance);
        for(let propName of propNames)
        {
          const metadata = Reflect.getMetadata(APISpecMetadataLabel, objectInstance, propName);
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

  build = async(routesGlob:string): Promise<OpenAPIV3.Document> =>
  {
    return {
      openapi: APISpecBuilder.openapi,
      info: APISpecBuilder.info,
      paths: await APISpecBuilder.getPaths(routesGlob),//await APISpecBuilder.getPaths(routesGlob),
      components: APISpecBuilder.components,
      externalDocs: APISpecBuilder.externalDocs,
      security: APISpecBuilder.security,
      servers: APISpecBuilder.servers,
      tags: APISpecBuilder.tags
    }
  }
}