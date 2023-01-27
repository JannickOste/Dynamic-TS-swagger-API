import { Type } from "@sinclair/typebox";

export const BadRequestSchema = Type.Strict(
    Type.Object({
        error:Type.String()
    })
)
