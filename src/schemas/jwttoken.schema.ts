import { Type } from "@sinclair/typebox";

export const JWTTokenSchema = Type.Strict(Type.Object({
    id: Type.Optional(Type.Number()),
    token:Type.String()
}))