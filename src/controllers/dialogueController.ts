import { Repository } from "typeorm";
import Database from "../services/database";
import Dialogue from "../entities/dialogue";
import RouteBase from "../types/routeBase";
import { Request, Response } from "express";
import { IExpressRouteHandlerType } from "../types/IExpressRouteType";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { Type } from "@sinclair/typebox";
import mapper from "../utils/mapper";
import "reflect-metadata";
import { DialogueSchema } from "../schemas/dialogueSchema"; 
import { NextFunction } from "express-serve-static-core";
import { BadRequestSchema } from "../schemas/badRequestSchema";
import {  Route } from "../api/decorators/route";
import { Responses } from "../api/decorators/responses";
import { HTTPMethod } from "../api/decorators/httpMethod";
import { IHTTPRequestMethodType } from "../types/IHTTPRequestMethodType";
import { BodyData } from "../api/decorators/bodyData";
import { DialogueDeleteSchema } from "../schemas/dialogueDeleteSchema";
import { DialogueCreateSchema } from "../schemas/dialogueCreateSchema";
import { DialogueUpdateSchema } from "../schemas/dialogueUpdateSchema";

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
    @HTTPMethod(["get"] as IHTTPRequestMethodType[])
    @Route("/dialogues/", "Get all dialogue entity objects")
    @Responses([
        {
            statusCode: 200,
            description: "All dialogue entity object",
            schema: Type.Array(DialogueSchema) as OpenAPIV3.SchemaObject
        }
    ])
    private getAllDialogues = async(req: Request, res:Response):IExpressRouteHandlerType =>
    {
        const dialogues = await DialogueController.repo.find();

        return res.status(200).json(dialogues)
    }

    @HTTPMethod(["get"] as IHTTPRequestMethodType[])
    @Route("/dialogues/id/{id}", "Get a dialogue based on it's ID.")
    @Responses([
        {
            statusCode: 200,
            description: "The dialogue entity matching the specified ID parameter",
            schema: DialogueSchema as OpenAPIV3.SchemaObject
        },
        {
            statusCode: 400,
            description: "Bad request - fields not supplied",
            schema: BadRequestSchema as OpenAPIV3.SchemaObject
        },
        {
            statusCode: 404,
            description: "No dialogue found matching the ID",
            schema: BadRequestSchema as OpenAPIV3.SchemaObject
        }
    ])
    private getDialogueById = async(req: Request, res: Response):IExpressRouteHandlerType =>
    {
        console.dir(req.params.id)
        if(!/[0-9]+/.test(req.params.id))
            return res.status(400).json({
                error: `invalid field 'id' with value '${req.params.id}' must be numeric.`
                })
        
        const dialogue = await DialogueController.repo.findOne({where: {id: parseInt(req.params.id)}});
        if(!dialogue)
            return res.status(404).json({
                error: "No dialogue found with ID: "+req.params.id
            })
        
        console.dir(dialogue)
        return res.status(200).json(dialogue)
    }

    @Route("/dialogue/update", "Update a dialogue entity")
    @HTTPMethod(["put"])
    @Responses([
        {
            statusCode: 200,
            description: "Succesfully updated the dialogue entity.",
            schema: DialogueSchema as OpenAPIV3.SchemaObject
        },
        {
            statusCode: 400,
            description: "Invalid request.",
            schema: BadRequestSchema as OpenAPIV3.SchemaObject
        },
        {
            statusCode: 404,
            description: "Dialogue entity not found",
            schema: BadRequestSchema as OpenAPIV3.SchemaObject
        }
    ])
    @BodyData(DialogueUpdateSchema as OpenAPIV3.SchemaObject, true)
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
    @Route("/dialogues/create", 'Create a new dialogue entity')
    @HTTPMethod(["post"])
    @Responses([
        {
            statusCode: 200,
            description: 'The newly created dialogue entity data.',
            schema: DialogueSchema as OpenAPIV3.SchemaObject
        }
    ])
    @BodyData(DialogueCreateSchema as OpenAPIV3.SchemaObject, true)
    private createDialogue = async(req: Request, res:Response): IExpressRouteHandlerType =>
    {
        return res.status(200).json(
            await DialogueController.repo.save(
                mapper<Dialogue>(new Dialogue(), req.body)
            )
        );
    }

    /***
     * Example Delete 
     * 
     */
    @Route("/dialogue/delete", "Delete a dialogue entity")
    @HTTPMethod(["delete"])
    @Responses([
        {
            statusCode: 204,
            description: "Dialogue succesfully deleted"
        },
        {
            statusCode: 404,
            description: "Dialogue not found",
            schema: BadRequestSchema
        }
    ])
    @BodyData(DialogueDeleteSchema as OpenAPIV3.SchemaObject, true)
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