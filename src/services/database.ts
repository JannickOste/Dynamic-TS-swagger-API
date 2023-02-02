import { DataSource, Entity, PrimaryGeneratedColumn } from "typeorm";
import AppService from "../appService";
import Dialogue from "../entities/dialogue.entity";
import * as dotenv from "dotenv"

export default class Database  extends AppService
{
    private static _singleton?:Database;
    public static get Singleton()
    {
        if(this._singleton === undefined)
            this._singleton = new Database();
        
        return this._singleton;
    }

    public get connector(): DataSource{ 
        return this._connector as DataSource
    }
    private _connector?: DataSource;

    private constructor()
    {
        super({
            onInitMessage:`Attempting to connect to mariadb server.`,
            onFailMessage:'Failed to connect to database...',
            onSuccessMessage:'Succesfully connected to database.'
        })
        
        
        this.configureCallback = async() => {
            this._connector =  new DataSource({
                type: "mysql",
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT as string),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASS,
                database: process.env.DATABASE_DB,
                synchronize: true,
                logging: false,
                entities: ["src/entities/*.entity.ts"],
                subscribers: [],
                migrations: []
            });

            await this._connector.initialize();
        };
    }



    public async destroy()
    {true
        this.connector.destroy();

        Database._singleton = undefined;
    }
}
