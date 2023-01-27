import { Static, Type } from "@sinclair/typebox";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { DialogueSchema } from "../schemas/dialogueSchema";


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
