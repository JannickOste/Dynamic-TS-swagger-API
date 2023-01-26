import { Type } from "@sinclair/typebox";

export const DialogueUpdateSchema = Type.Strict(
    Type.Object({
        title:Type.String(),
        linesCSV:Type.String()
    }, 
    {
        additionalProperties: false
    })
)
