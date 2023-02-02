import { Type } from "@sinclair/typebox";

export const DialogueDeleteSchema = Type.Strict(
    Type.Object({
        id:Type.Optional(Type.Number()),
        title:Type.Optional(Type.String()),
        linesCSV:Type.Optional(Type.String())
    }, 
    {
        additionalProperties: false
    })
)
