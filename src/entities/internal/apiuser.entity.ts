import { Static } from "@sinclair/typebox";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import JWTTokenEntity from "./jwt.entity";
import {APIUserSchema} from "../../schemas/apiuser.schema"

@Entity("APIUser")
export default class APIUserEntity implements Static<typeof APIUserSchema>
{
    @PrimaryGeneratedColumn()
    public id!:number;

    @Column({unique: true, nullable: false})
    public username!:string; 

    @Column({unique: true, nullable: false})
    public hash!:string;

    @OneToOne((t) => JWTTokenEntity)
    @JoinColumn()
    public token!:Relation<JWTTokenEntity>;
}