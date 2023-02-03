import { Type } from "@sinclair/typebox";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import JWTTokenEntity from "../entities/internal/jwt.entity";
import { JWTTokenSchema } from "./jwttoken.schema";

export const APIUserSchema = Type.Strict(
    Type.Object({
        id: Type.Optional(Type.Number()),
        username: Type.String(),
        hash: Type.String(),
        token: JWTTokenSchema
    })
)