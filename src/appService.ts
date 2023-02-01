import Logger from "./utils/logger";
import mapper from "./utils/mapper";

type AppServiceOptions = { 
    onInitMessage?:string;
    onFailMessage?:string;
    onSuccessMessage?:string;
    serviceRequired?:true;
    startParams?:any[];
    configureParams?:any[];
    startCallback?: ((...params:any[]) => Promise<any>) | (() => Promise<any>)
    configureCallback?: ((...params:any[]) => Promise<any>) | (() => Promise<any>)
}

export default abstract class AppService 
{
    private options: AppServiceOptions = {};

    constructor(options?: AppServiceOptions)
    {        
        if(options)
            this.options = options;
    }

    // Messages
    public get onInitMessage():string|undefined {return this.options.onInitMessage; }
    public get onFailMessage():string|undefined {return this.options.onFailMessage; }
    public get onSuccessMessage():string|undefined {return this.options.onSuccessMessage; }

    // Init service
    private get _configureParams() {return this.options.configureParams}
    protected set configureParams(value: any[]) {this.options.configureParams = value;}

    private get _configureCallback() {return this.options.configureCallback}
    protected set configureCallback(value: (...params:any[]) => Promise<any>) {this.options.configureCallback = value;}

    // Start service
    private get _startParams(){return this.options.startParams}
    protected set startParams(value: any[]) {this.options.startParams = value;}

    private get _startCallback(){return this.options.startCallback}
    protected set startCallback(value: (...params:any[]) => Promise<any>)  {this.options.startCallback = value;}

    public startService = async() => {
        try
        {
            if(this.onInitMessage) Logger.log(this, this.onInitMessage);

            if(this._configureCallback !== undefined)
                await this._configureCallback(this._configureParams);
            
            if(this._startCallback)
                await this._startCallback(this._startParams);
            if(this.onSuccessMessage) Logger.log(this, this.onSuccessMessage);
        } catch(err)
        {
            if(this.onFailMessage)
                Logger.error(this, this.onFailMessage);

            console.log(err);
            if(process.env.DEBUG_MODE === "true")
                Logger.exception(this, (err as Error).message)
            
        }
    }

} 