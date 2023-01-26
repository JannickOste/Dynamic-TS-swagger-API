import chalk, { ChalkFunction } from 'chalk';

export default class Logger 
{
    private static logBase = (obj:any, message:string, color:ChalkFunction, secondary?:string) => {

        console.log(color(`[${obj.constructor.name}]${(secondary ? `[${secondary}]` : '')}: ${message}`));
    }
    
    public static log = (obj:any, message:string)  => Logger.logBase(obj, message, chalk.green);
    public static error = (obj:any, message:string)  => Logger.logBase(obj, message, chalk.red, "error");
    public static warning = (obj:any, message:string)  => Logger.logBase(obj, message, chalk.yellow, "error");

}