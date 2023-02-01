import "reflect-metadata";

export default class ReflectUtils 
{
    public static GetDecoratorFromFunc = (obj:object, funcName: string, decoratorName:string) =>
    {
        if(typeof obj !== "object")
            throw new Error("obj must be of type 'object'")
        else if(typeof funcName !== "string")
            throw new Error("funcName must be of type 'string'");
        else if(typeof decoratorName !== "string")
            throw new Error("decoratorName must be of type 'string'")

        return Reflect.getMetadata(decoratorName, obj, funcName);
    } 

}