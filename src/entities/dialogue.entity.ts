import { Static } from "@sinclair/typebox";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { DialogueSchema } from "../schemas/dialogue.schema";

/**
 * A dialogue TypeORM entity that is build upon a Swagger OpenAPIV3 type object.
 */
@Entity("dialogue")
export default class Dialogue implements Static<typeof DialogueSchema>
{
    @PrimaryGeneratedColumn("increment")
    id!:number;

    @Column({unique:true, nullable: false})
    title!:string;

    @Column({unique:true, nullable:false})
    linesCSV!:string;
}
