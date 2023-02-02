import { Repository } from "typeorm";
import Database from "../services/database";
import Dialogue from "../entities/dialogue.entity";
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
import { DialogueDeleteSchema } from "../schemas/dialogueDeleteSchema";
import { DialogueCreateSchema } from "../schemas/dialogueCreateSchema";
import { DialogueUpdateSchema } from "../schemas/dialogueUpdateSchema";
import { HTTPMethod } from "../services/api/decorators/httpMethod";
import { Route } from "../services/api/decorators/route";
import { BodyData } from "../services/api/decorators/bodyData";
import { QueryParameter } from "../services/api/decorators/queryParameter";
import { HTTPResponse } from "../services/api/decorators/httpResponse";

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
    @HTTPMethod("get")
    @Route("/[controller]/", "Get all dialogue entity objects")
    @HTTPResponse(200,{description: "All dialogue entity object", schema: Type.Array(DialogueSchema) as OpenAPIV3.SchemaObject })
    private getAllDialogues = async(req: Request, res:Response):IExpressRouteHandlerType =>
    {
        const dialogues = await DialogueController.repo.find();

        return res.status(200).json(dialogues)
    }
    

    /**
     * Example: Get using query parameters
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    @HTTPMethod("get")
    @Route("/[controller]/get", "Get a dialogue based on a field of it")
    @HTTPResponse(200, {description: "The dialogue with the matching field", schema: DialogueSchema as OpenAPIV3.SchemaObject })
    @HTTPResponse(400, {description: "Bad request - fields not supplied", schema: BadRequestSchema as OpenAPIV3.SchemaObject })
    @HTTPResponse(404, {description: "No dialogue found matching any of the specified fields", schema: DialogueSchema as OpenAPIV3.SchemaObject })
    @QueryParameter("id", {schema: { type: "number", minimum: 0 }, description: "The 'ID' of the dialogue"})
    @QueryParameter("title", {schema: { type: "string", minLength: 0 }, description: "The 'title' of the dialogue"})
    @QueryParameter("linesCSV", {schema: { type: "string", minLength: 0 },  description: `The 'linesCSV' of the dialogue`})
    private getDialogue = async(req: Request, res: Response):IExpressRouteHandlerType =>
    {
        if(!Object.keys(req.query).length)
            return res.status(404).json({error: 'No search query supplied'});

        const dialogue = await DialogueController.repo.findOne({where: req.query})

        if(!dialogue)
            return res.status(404).json({
                error: `No dialogue found with found with any of the fields: ${Object.entries(req.query).map(v => `${v[0]} = ${v[1]}`).join(", ")}`
            })
        
        return res.status(200).json(dialogue)
    }

    /**
     * Example: PUT request.
     * 
     * @param request 
     * @param response 
     * @param next 
     * @returns 
     */
    @HTTPMethod("put")
    @Route("/[controller]/update", "Update a dialogue entity")
    @HTTPResponse(200, { description: "Succesfully updated the dialogue entity.",schema: DialogueSchema as OpenAPIV3.SchemaObject})
    @HTTPResponse(400, { description: "Invalid request.",schema: BadRequestSchema as OpenAPIV3.SchemaObject})
    @HTTPResponse(404, { description: "Dialogue entity not found",schema: BadRequestSchema as OpenAPIV3.SchemaObject})
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
    @HTTPMethod("post")
    @Route("/[controller]/create", 'Create a new dialogue entity')
    @HTTPResponse(200,{ description: 'The newly created dialogue entity data.',schema: DialogueSchema as OpenAPIV3.SchemaObject})
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
    @HTTPMethod("delete")
    @Route("/[controller]/delete", "Delete a dialogue entity")
    @HTTPResponse(204, {description: "Dialogue succesfully deleted"})
    @HTTPResponse(404, {description: "Dialogue not found", schema: BadRequestSchema as OpenAPIV3.SchemaObject})
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