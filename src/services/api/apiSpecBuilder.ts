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
import { PathParameterLabel, PathParameterOptions } from './decorators/pathParameter';
import RouteBase from '../../types/routeBase';
import Database from '../database/database.service';
import JWTTokenEntity from '../../entities/internal/jwt.entity';
import { JWTTokenLabel, SecurityDecoratorLabel } from './decorators/jwtToken';

/**
 * Class for building OpenAPI specification for the API service.
 * 
 * @class APISpecBuilder
 */
export default class APISpecBuilder
{
  //#region Getters
  /**
   * Returns the OpenAPI version (3.0.3).
   * @returns OpenAPI version as string
   */
  public static get openapi(): string
  {
    return "3.0.3";
  } 

  /**
   * Returns the API name and version from environment variables, with default values of 
   * {title: 'API Service', version: '1.0.0'}.
   * @returns Info object for API
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
   * Returns the API server domains as an array of server objects. 
   * Server domains and ports are taken from environment variables.
   * @returns Array of server objects
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

  /**
   * Returns the API components based on the schemas found using a glob pattern match.
   * @param schemaGlob glob pattern to match schema files
   * @returns Components object for API
   */
  private static async getComponents(schemaGlob:string):Promise<OpenAPIV3.ComponentsObject>
  {
    const schemas: {[key:string]: OpenAPIV3.ReferenceObject|OpenAPIV3.SchemaObject} = await APISpecBuilder.getSchemas(schemaGlob);

    Logger.log(this, `Found ${Object.entries(schemas).length} schemas`);
    return {
      schemas: schemas,
      securitySchemes: {
        [JWTTokenLabel]: {       
            type: 'http',
            scheme: "bearer",
            bearerFormat: "JWT"
        }
      }
    }
  }

  /**
   * Returns the schemas found using a glob pattern match.
   * @param schemaGlob glob pattern to match schema files
   * @returns Schemas object for API
   */
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


  private static getSecurity = async() => [
    {
      [JWTTokenLabel]: (await Database.Singleton.connector.getRepository(JWTTokenEntity).find()).map(tokenEntity => tokenEntity.token)
    }
  ]
  /**
   * API tags.
  */
  private static tags?: OpenAPIV3.TagObject[] | undefined;

  /**
  * External API documentation.
  */
  private static externalDocs?:OpenAPIV3.ExternalDocumentationObject;

  /**
   * Returns all accessible endpoints with APISpecMetadataObjects bound as decorators, 
   * found using a glob pattern match and reflection.
   * @param routesGlob glob pattern to match route files
   * @returns Paths object for API
   */
  private static async getPaths(routesGlob:string): Promise<OpenAPIV3.PathsObject>
  {
    const paths: OpenAPIV3.PathsObject = {}

    for(let path of new glob.GlobSync(routesGlob).found)
    {
        const objectInstance: RouteBase = new (await import(process.env.PWD+path.slice(1))).default();
        const propNames:string[] = Object.getOwnPropertyNames(objectInstance);
        
        for(let propName of propNames)
        {
          const spec = APISpecBuilder.buildSpecFromMethod(objectInstance, propName);
          if(spec)
            paths[spec.route] = spec.data
        }
    }


    return paths;
  }
  //#endregion
  //#region Parsers
  /**
   * Parses the QueryParameter decorators for a given set of entries.
   * 
   * @param entries - An array of objects containing data for each QueryParameter decorator
   * @returns An object representing the query parameters in OpenAPI format
  */
  private static parseQueryParameters = (entries: {name:string, options:QueryParameterOptions}[]): OpenAPIV3.ParameterObject[] => entries.map(v => {
    return {in: "query", name:v.name, description:v.options.description, schema: v.options.schema}
  })

  /**
   * Parses the PageParameter decorators for a given set of entries.
   * 
   * @param entries - An array of objects containing data for each PageParameter decorator
   * @returns An object representing the path parameters in OpenAPI format
   */
  private static parsePageParameters = (entries: {name: string, options: PathParameterOptions}[]): OpenAPIV3.ParameterObject[] => entries.map(v => {
    return {in: "path", name: v.name,required: v.options.required !== undefined, schema: v.options.schema, description: v.options.description};
  })

  /**
   * Parses the HTTPResponse decorators for a given set of entries.
   * 
   * @param entries - An array of objects containing data for each HTTPResponse decorator
   * @returns An object representing the HTTP responses in OpenAPI format
   */
  private static parseHTTPResponses = (entries: {statusCode: number, options:HTTPResponseOptions}[]): OpenAPIV3.ResponsesObject => {
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
  //#endregion
  //#region Builders
  /**
   * Builds the specification for a given HTTP request method type from the provided object, property name, 
   * and whether the request requires a body.
   * 
   * @param obj - The object containing data for the API route
   * @param propName - The property name of the method on the object
   * @param requestsRequireBody - Whether the request method requires a body
   * @returns An object representing the HTTP request method in OpenAPI format
   */
  public static buildSpecFromMethod = (obj: any, propName: string, requestsRequireBody:IHTTPRequestMethodType[] = ["post", "put", "delete"]): {route:string, data: OpenAPIV3.PathItemObject}|undefined => {
    const routeData = Reflect.getMetadata(RouteDecoratorLabel, obj, propName);
    if(!routeData) return;

    let result:OpenAPIV3.PathItemObject = {
      
    }

    const requestMethods = Reflect.getMetadata(HTTPMethodDecoratorLabel, obj, propName);
    if(!requestMethods)
    {
      Logger.error(this, `Route definition '${routeData.route}' found but no HTTPMethods specified, skipping assignment...`);
      return;
    }


    for(let method of requestMethods){
      const methodData: {[key:string]:any} =  {
        summary: routeData.description,
        tags: [obj.constructor.name.replace("Controller", "")],
        parameters: [],
        security:[]
      }

      const security = Reflect.getMetadata(SecurityDecoratorLabel, obj, propName);
      if(security)
        methodData["security"] = security;

      const bodyData = Reflect.getMetadata(BodyDataDecoratorLabel, obj, propName);
      if(bodyData)
      {
        methodData["requestBody"] = bodyData
      } else if(requestsRequireBody.includes(method as IHTTPRequestMethodType))
      {
        Logger.error('APISpecBuilder', `Attempting to assign '${method}' method without body data for endpoints '${routeData.route}' but this is marked as required, skipping generation`);
        continue;
      }

      // Get Query parameter data
      const queryParamData = Reflect.getMetadata(QueryParameterLabel, obj, propName);
      if(queryParamData) // Destructure to allow multi param type parsing.
        methodData["parameters"] = [...methodData.parameters, ...this.parseQueryParameters(Reflect.getMetadata(QueryParameterLabel, obj, propName))];


      // Get Path parameter data. (currently disabled, doesnt work properly.) #!TODO: Look into path params, for some reason example given doesnt work.
      const pathParamData = Reflect.getMetadata(PathParameterLabel, obj, propName);
      if(pathParamData)
      {
        const parsedParamData = this.parsePageParameters(pathParamData);

        const notInPath = parsedParamData.filter(v => !routeData.route.includes(v.name));
        if(notInPath.length)
        {
          Logger.error('APISpecBuilder', `The route '${routeData.route}' misses the following path parameters: ${notInPath.map(v => v.name).join(", ")}, skipping assignment...`)
          return;
        }

        Logger.warning('APISpecBuilder', `Path parameters are currently disabled, unable to load route params for '${routeData.route}', skipping assignment...`);
        return;
        methodData.parameters = [...methodData.parameters, parsedParamData]
      }


      // Build response schemas.
      const responses = Reflect.getMetadata(HTTPResponseLabel, obj, propName);
      if(!responses)
      {
        Logger.error('APISpecBuilder', `No responses specified for route '${routeData.route}', skipping assignment...`);
        return;
      }
      methodData["responses"] = this.parseHTTPResponses(responses);


      result = {...result, ...Object.fromEntries([[method, methodData]])}
    }
      return {
        route:routeData.route,
        data: result
      };
  }

  /**
    Builds the entire OpenAPI specification from the target functions.
    @param controllerGlob Glob pattern to match schema files.
    @param schemaGlob Glob pattern to match schema files.
    @returns OpenAPIV3 Document.
  */
  build = async(controllerGlob:string, schemasGlob:string): Promise<OpenAPIV3.Document> =>
  {
    return {
      openapi: APISpecBuilder.openapi,
      info: APISpecBuilder.info,
      paths: await APISpecBuilder.getPaths(controllerGlob),
      components: await APISpecBuilder.getComponents(schemasGlob),
      externalDocs: APISpecBuilder.externalDocs,
      security: await APISpecBuilder.getSecurity(),
      servers: APISpecBuilder.servers,
      tags: APISpecBuilder.tags
    }
  }
  //#endregion
}