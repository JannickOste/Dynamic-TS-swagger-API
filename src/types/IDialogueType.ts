import { Static } from "@sinclair/typebox";
import { DialogueSchema } from "../schemas/dialogueSchema";

export type IDialogueType = Static<typeof DialogueSchema>;
