import { Type } from "@sinclair/typebox";

export const DialogueSchema = Type.Strict(
    Type.Object({
        id:Type.Optional(Type.Number()),
        title:Type.String(),
        linesCSV:Type.String()
    }, 
    {
        additionalProperties: false
    })
)
