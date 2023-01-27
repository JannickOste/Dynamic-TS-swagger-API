import { Repository } from "typeorm";
import Database from "../services/database";
import Dialogue from "../entities/dialogue";
import RouteBase from "../types/routeBase";
import { Request, Response } from "express";
import { IExpressRouteHandlerType } from "../types/IExpressRouteType";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import APISpecMetadata from "../api/apiSpecMetadata";
import { Type } from "@sinclair/typebox";
import mapper from "../utils/mapper";
import "reflect-metadata";
import { DialogueSchema } from "../schemas/dialogueSchema";
import { DialogueUpdateSchema } from "../schemas/dialogueUpdateSchema";
import { NextFunction } from "express-serve-static-core";
import { BadRequestSchema } from "../schemas/badRequestSchema";
import { DialogueDeleteSchema } from "../schemas/dialogueDeleteSchema";

export default class DialogueController extends RouteBase
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
              description: 'All dialogue entity objects',
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
        const dialogues = await DialogueController.repo.find();

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
                    description: "The dialogue entity matching the specified ID parameter",
                    content: {
                        "application/json": {
                            schema: DialogueSchema as OpenAPIV3.SchemaObject
                        }
                    }
                },
                400: {
                    description: "Bad request - Invalid parameters",
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
        
        const dialogue = await DialogueController.repo.find({where: {id: parseInt(req.params.id)}});

        return res.status(dialogue === undefined ? 404 : 200).json(dialogue)
    }

    @APISpecMetadata("/dialogue/update", {
        put: {
            summary: "Update a dialogue entity",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: DialogueUpdateSchema as OpenAPIV3.SchemaObject
                    }
                }
            },
            responses: {
                200: {
                    description: "Succesfully updated the dialogue entity.",
                    content: {
                        "application/json": {
                            schema:  DialogueSchema as OpenAPIV3.SchemaObject
                        }
                    }
                },
                400: {
                    description: "Invalid request",
                    content: {
                        "application/json": {
                            schema: BadRequestSchema as OpenAPIV3.SchemaObject
                        }
                    }
                },
                404: {
                    description: "Dialogue entity not found.", 
                    content: {
                        "application/json": {
                            schema: BadRequestSchema as OpenAPIV3.SchemaObject
                        }
                    }
                }
            }
        }
    })
    private updateBlogProps = async(request: Request, response: Response, next: NextFunction): IExpressRouteHandlerType =>
    {
        const id = parseInt(request.body.id);
        if(isNaN(id))
            return response.status(400).json({
                error: "Invalid field 'id', field must be numeric."
            });

        const dialogueEntity = await DialogueController.repo.findOne({where: {id: id}});
        if(!dialogueEntity)
            return response.status(404).json({
                error: `No dialogue found with ID: ${request.body.id}`
            })
        
        const newDialogue = mapper<Dialogue>(dialogueEntity, request.body);
        
        await DialogueController.repo.save(newDialogue);

        return response.status(200).json(newDialogue);
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
                        schema: DialogueUpdateSchema as OpenAPIV3.SchemaObject,
                    }
                }
            },

            responses: {
                200: {
                    description: 'The newly created dialogue entity data.',
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
        return res.status(200).json(
            await DialogueController.repo.save(
                mapper<Dialogue>(new Dialogue(), req.body)
            )
        );
    }

    @APISpecMetadata("/dialogue/delete", {
        delete: {
            summary: "Delete a dialogue entity", 
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: DialogueDeleteSchema as OpenAPIV3.SchemaObject
                    }
                }
            },
            responses: {
                204: {description: "Dialogue succesfully deleted"},
                404: {description: "Dialogue not found", content: {"application/json":{schema: BadRequestSchema as OpenAPIV3.SchemaObject}}}
            }
        }
    })
    private deleteDialogue = async(request: Request, response: Response): IExpressRouteHandlerType => 
    {
        const dialogue = await DialogueController.repo.findOne({where:[
            {id: request.body.id},
            {title: request.body.title},
            {linesCSV: request.body.linesCSV},
        ]});
        if(!dialogue)
            return response.status(404).json({
                error: `No dialogue match found for ['${Object.entries(request.body).map((v) => `${v[0]}:${v[1]}`).join(" or ")}'] `
            })
        
        await DialogueController.repo.delete(dialogue);
        
        return response.status(204).send()
    }
    //#endregion
    
    
}