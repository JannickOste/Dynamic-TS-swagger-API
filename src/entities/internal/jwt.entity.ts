import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("JWTToken")
export default class JWTTokenEntity
{
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({unique: true, nullable: false, length: 64, generated: "uuid"})
    public token!:string;
}