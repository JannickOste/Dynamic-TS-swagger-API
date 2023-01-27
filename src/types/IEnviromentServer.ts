export type IEnviromentServer = {
    env_port_label:string;

    throwOnNull?:true;
    credentials?:any;
    
    listener?:((port:number)=>any)
    listenerWithArgs?:((data:any, port:number)=>any)
}