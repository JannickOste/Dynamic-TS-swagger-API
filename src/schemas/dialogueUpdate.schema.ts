import { Type } from "@sinclair/typebox";

export const DialogueUpdateSchema = Type.Strict(
    Type.Object({
        id:Type.Number(),
        title:Type.Optional(Type.String()),
        linesCSV:Type.Optional(Type.String())
    }, 
    {
        additionalProperties: false
    })
)
