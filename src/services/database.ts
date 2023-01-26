import { DataSource } from "typeorm";
import Dialogue from "../entities/dialogue";

export default class Database 
{
    private static _singleton:Database;
    public static get Singleton()
    {
        if(this._singleton === undefined)
            this._singleton = new Database();
        
        return this._singleton;
    }

    public readonly connector: DataSource;

    private constructor()
    {
        this.connector =  new DataSource({
            type: "mysql",
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT as string),
            username: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASS,
            database: process.env.DATABASE_DB,
            synchronize: true,
            logging: false,
            entities: [Dialogue],
            subscribers: [],
            migrations: []
        })
    }
}