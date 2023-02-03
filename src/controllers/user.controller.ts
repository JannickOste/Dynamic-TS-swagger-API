import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import "reflect-metadata"
import { Repository } from "typeorm";
import JWTTokenEntity from "../entities/internal/jwt.entity";
import { APIUserSchema } from "../schemas/apiuser.schema";
import { HTTPMethod } from "../services/api/decorators/httpMethod";
import { HTTPResponse } from "../services/api/decorators/httpResponse";
import { Route } from "../services/api/decorators/route";
import Database from "../services/database/database.service";
import RouteBase from "../types/routeBase";
import {Request, Response} from "express";
import { Type } from "@sinclair/typebox";
import APIUserEntity from "../entities/internal/apiuser.entity";
import { BodyData } from "../services/api/decorators/bodyData";
import { BadRequestSchema } from "../schemas/badRequest.schema";
import { JWTToken } from "../services/api/decorators/jwtToken";

export default class UserController extends RouteBase
{
    private static repo: Repository<APIUserEntity> = Database.Singleton.connector.getRepository(APIUserEntity);

    @JWTToken()
    @HTTPMethod("get")
    @Route("/[controller]", "Get all users")
    @HTTPResponse(200, {schema: Type.Array(APIUserSchema) as OpenAPIV3.SchemaObject, description: "OK"})
    public getAllUsers = async(request:Request, response: Response) => {
        const results = await UserController.repo.find({
            relations: {
                token: true
            }
        });

        return response.status(200).json(results);
    }

    @JWTToken()
    @HTTPMethod("post")
    @Route("/[controller]/[target]", "Create a new user")
    @HTTPResponse(400, {description: "Bad Request", schema: BadRequestSchema})
    @HTTPResponse(200, {description: "OK", schema: Type.Strict(Type.Object({}))})
    @BodyData(Type.Strict(Type.Object({username: Type.String(), password: Type.String()})) as OpenAPIV3.SchemaObject)
    public create = async(request:Request, response: Response) => {

        const {username, password} = request.body;
        if(await UserController.repo.findOne({where: {username: username}}))
            return  response.status(204).json({error: "Username already exists..."});

        const newToken = await Database.Singleton.connector.getRepository(JWTTokenEntity).save(new JWTTokenEntity());
        let newUser = new APIUserEntity();
        newUser.username = username;
        newUser.hash = password; 
        newUser.token = newToken;
        newUser = await UserController.repo.save(newUser);
        await Database.Singleton.connector.getRepository(JWTTokenEntity).save(newToken);

        return response.status(200).json(newUser);
    }

    @JWTToken()
    @HTTPMethod("put")
    @Route("/[controller]/[target]", "Update a new user")
    @HTTPResponse(204, {description: "No content", schema: Type.Strict(Type.Object({}))})
    @HTTPResponse(400, {description: "Bad request", schema: BadRequestSchema})
    @BodyData(Type.Strict(Type.Object({id: Type.Number(), username: Type.Optional(Type.String()), hash: Type.Optional(Type.String())})) as OpenAPIV3.SchemaObject)
    public update = async(request: Request, response:Response) => {
        const {id, username, hash} = request.body;

        const user = await UserController.repo.findOne({where: {id: id}});
        if(!user)
            return response.status(400).json({error: `No user exists with ID: '${id}'`});

        if(await UserController.repo.findOne({where:{username: username}}))
            return response.status(400).json({error: `A user already exists with the username: ${username}`});

        if(username) user.username = username;
        if(hash) user.hash = hash;

        await UserController.repo.save(user);

        return response.status(204).json({})
    }

    @JWTToken()
    @HTTPMethod("delete")
    @Route("/[controller]/[target]", "Delete a new user")
    @HTTPResponse(204, {description: "No content", schema: Type.Strict(Type.Object({}))})
    @HTTPResponse(400, {description: "Bad request", schema: BadRequestSchema})
    @BodyData(Type.Strict(Type.Object({id: Type.Optional(Type.Number()), username: Type.Optional(Type.String()), hash: Type.Optional(Type.String())})) as OpenAPIV3.SchemaObject)
    public delete = async(request: Request, response:Response) => {
        const user = await UserController.repo.findOne({where: request.body});
        if(!user)
            return response.status(400).json({error: `No user exists with any of the fields: '${request.body}'`});


        await UserController.repo.remove(user);

        return response.status(204).json({})
    }

}