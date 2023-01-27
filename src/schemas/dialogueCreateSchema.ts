import { Type } from "@sinclair/typebox";

/**
 * The required properties for creating an dialogue entity in the database using the dialogueController.
 */
export const DialogueCreateSchema = Type.Strict(
    Type.Object({
        title:Type.Optional(Type.String()),
        linesCSV:Type.Optional(Type.String())
    }, 
    {
        additionalProperties: false
    })
)
