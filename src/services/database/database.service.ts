import { DataSource, Entity, PrimaryGeneratedColumn } from "typeorm";
import AppServiceModel from "../appServiceModel";
import Dialogue from "../../entities/dialogue.entity";
import * as dotenv from "dotenv"

export default class Database  extends AppServiceModel
{
    private static _singleton?:Database;
    public static get Singleton()
    {
        return this._singleton as Database;
    }

    public get connector(): DataSource{ 
        return this._connector as DataSource
    }
    private _connector?: DataSource;

    private constructor()
    {
        if(Database.Singleton !== undefined)
            throw new Error("Database singleton is already initialized");

        super({
            onInitMessage:`Attempting to connect to mariadb server.`,
            onFailMessage:'Failed to connect to database...',
            onSuccessMessage:'Succesfully connected to database.',
            priority: 0
        })

        Database._singleton = this;
        
        
        this.configureCallback = async() => {
            const {APPLICATION_ENTITIES_ROOT, APPLICATION_ENTITIES_PREFIX} = process.env;
            console.log(`${APPLICATION_ENTITIES_ROOT}**/*${APPLICATION_ENTITIES_PREFIX}.{ts, js}`);
            this._connector =  new DataSource({
                type: "mysql",
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT as string),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASS,
                database: process.env.DATABASE_DB,
                synchronize: true,
                logging: false,
                entities: [`${APPLICATION_ENTITIES_ROOT}**/*${APPLICATION_ENTITIES_PREFIX}.{ts, js}`],
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
