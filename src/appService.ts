export default abstract class AppService 
{
    onInitMessage?:string;
    onFailMessage?:string;
    onSuccessMessage?:string;


    constructor(options?: {
        onInitMessage?:string;
        onFailMessage?:string;
        onSuccessMessage?:string;
    })
    {
    }
} 