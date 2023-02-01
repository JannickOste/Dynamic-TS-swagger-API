import { DataSource } from "typeorm";
import AppService from "../appService";
import Dialogue from "../entities/dialogue";

export default class Database  extends AppService
{
    private static _singleton:Database | undefined;
    public static get Singleton()
    {
        if(this._singleton === undefined)
            this._singleton = new Database();
        
            console.dir(this)
        return this._singleton;
    }

    public get connector(): DataSource{ return this._connector as DataSource}
    private _connector: DataSource | undefined;

    private constructor()
    {
        super({
            onInitMessage:`Attempting to connect to mariadb server.`,
            onFailMessage:'Failed to connect to database...',
            onSuccessMessage:'Succesfully connected to database.'
        })

        this.configureCallback = this.connect;
    }

    private async connect(): Promise<void> {
        this._connector =  new DataSource({
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

    public async destroy()
    {
        this.connector.destroy();

        Database._singleton = undefined;
    }
}