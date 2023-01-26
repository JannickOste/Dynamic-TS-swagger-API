import { Repository } from "typeorm";
import Database from "../services/database";
import Dialogue, { DialogueSchema } from "../entities/dialogue";
import RouteBase from "../types/routeBase";
import { Request, Response } from "express";
import { IExpressRouteHandlerType } from "../types/IExpressRouteType";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import APISpecMetadata from "../APISpecMetadata";
import { Type } from "@sinclair/typebox";
import mapper from "../utils/mapper";
import "reflect-metadata";

/**
 * @controller
 */
export default class DialogueRouteHandler extends RouteBase
{
    private static readonly repo:Repository<Dialogue> = Database.Singleton.connector.getRepository(Dialogue);

    /**
     * Example: GET(without parameters)
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    @APISpecMetadata('/dialogues/', {
        get: {
          summary: 'Get all dialogue entity objects', 
          responses: {
            200: {
              description: 'successful response',
              content: {
                'application/json': {
                  schema: Type.Array(DialogueSchema) as OpenAPIV3.SchemaObject,
                }
              }
            }
          }
        }
    })
    private getAllDialogues = async(req: Request, res:Response):IExpressRouteHandlerType =>
    {
        const dialogues = await DialogueRouteHandler.repo.find();

        return res.status(200).json(dialogues)
    }

    /**
     * Example: GET => With parameters
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    @APISpecMetadata("/dialogues/id/:id", {
        get: {
            summary: "Get a dialogue based on it's ID.",
            parameters: [/*
                {
                    in: "id",
                    name: "id",
                    schema: {
                        type: "string",
                        componentId: "id"
                    }
                }   
            */],
            responses: {
                200: {
                    description: "Dialogue results",
                    content: {
                        "application/json": {
                            schema: DialogueSchema as OpenAPIV3.SchemaObject
                        }
                    }
                },
                400: {
                    description: "Bad request",
                    content: {
                        "application/json": {
                            schema: Type.Strict(Type.Object({
                                error: Type.String()
                            })) as OpenAPIV3.SchemaObject
                        }
                    }
                }
            
            }
        }
    })
    private getDialogueById = async(req: Request, res: Response):IExpressRouteHandlerType =>
    {
        if(!/[0-9]+/.test(req.params.id))
            return res.status(400).json({error: `invalid field 'id' with value '${req.params.id}' must be numeric.`})
        
        const dialogue = await DialogueRouteHandler.repo.find({where: {id: parseInt(req.params.id)}});

        return res.status(dialogue === undefined ? 404 : 200).json(dialogue)
    }

    /**
     * Example: POST
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    @APISpecMetadata("/dialogues/create", {
        post: {
            summary: 'Create a new dialogue entity',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: DialogueSchema as OpenAPIV3.SchemaObject,
                    }
                }
            },

            responses: {
                200: {
                    description: 'successful response',
                    content: {
                        'application/json': {
                            schema: DialogueSchema as OpenAPIV3.SchemaObject
                        }
                    }
                }
            }
        }
    })  
    private createDialogue = async(req: Request, res:Response): IExpressRouteHandlerType =>
    {
        let dialogue:Dialogue = mapper<Dialogue>(new Dialogue(), req.body);

        dialogue = await DialogueRouteHandler.repo.save(dialogue);
        return res.status(200).json(dialogue);
    }
    //#endregion
  
}