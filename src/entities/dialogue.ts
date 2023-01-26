import { Static, Type } from "@sinclair/typebox";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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

export type IDialogueType = Static<typeof DialogueSchema>;

@Entity()
export default class Dialogue implements IDialogueType
{
    @PrimaryGeneratedColumn()
    id!:number;

    @Column({unique:true, nullable: false})
    title!:string;

    @Column({unique:true, nullable:false})
    linesCSV!:string;
}
