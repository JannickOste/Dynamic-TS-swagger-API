import { Static } from "@sinclair/typebox";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { DialogueSchema } from "../schemas/dialogueSchema";

/**
 * A dialogue TypeORM entity that is build upon a Swagger OpenAPIV3 type object.
 */
@Entity()
export default class Dialogue implements Static<typeof DialogueSchema>
{
    @PrimaryGeneratedColumn()
    id!:number;

    @Column({unique:true, nullable: false})
    title!:string;

    @Column({unique:true, nullable:false})
    linesCSV!:string;
}
