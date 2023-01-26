import swaggerAutogen from "swagger-autogen"
import * as dotenv from "dotenv";
import * as glob from "glob"

/**
 * @deprecated
 */
type ISwaggerDocumentDataInfoType = {title?:string;description?:string,version?:string}
/**
 * @deprecated
 */
type ISwaggerDocumentDataTagType = {name?:string,description?:string}

/**
 * @deprecated
 */
type SwaggerDocumentDataType = {
    info?: ISwaggerDocumentDataInfoType,
    host?:string;
    basePath?:string;
    schemes?:string[];
    consumes?:string[];
    procudes?:string[];
    tags?:ISwaggerDocumentDataTagType;
    securityDefinitions?:any;
    definitions?:any;
    components?:any;
}

/**
 * Generate swagger.json file (no longer in use, using decorator function instead of comments now)
 * 
 * @deprecated
 */
class SwaggerDocumentGenerator 
{
    public static readonly handlerPath:string = "./src/routes/"
    public static readonly handlerGlobString:string = "**/*Handler.ts"

    private readonly swaggerDocumentData:SwaggerDocumentDataType;

    constructor(swaggerData:SwaggerDocumentDataType)
    {
        this.swaggerDocumentData = swaggerData;
    }

    build(path:string): void {
        const handlerPaths = new glob.GlobSync(`${SwaggerDocumentGenerator.handlerPath}${SwaggerDocumentGenerator.handlerGlobString}`).found.map((v) => `${process.env.PWD}${v.slice(1)}`)

        swaggerAutogen(path, handlerPaths, this.swaggerDocumentData);
    }
}

if(__filename.replace(/.(js|ts)$/, "") !== process.argv[1])
    module.exports = {
        default: SwaggerDocumentGenerator
    }
else 
{
    dotenv.config();
    const { 
        SWAGGER_API_NAME, 
        SWAGGER_API_VERSION, 
        SERVER_PORT_HTTP, 
        SERVER_PORT_HTTPS,
        SWAGGER_API_DESCRIPTION,
        SWAGGER_DOC_PATH
    } = process.env;

    const generator = new SwaggerDocumentGenerator({
        info: {
            title: SWAGGER_API_NAME,
            version: SWAGGER_API_VERSION,
            description: SWAGGER_API_DESCRIPTION
        },
        host: "localhost:"+(SERVER_PORT_HTTP ? SERVER_PORT_HTTP : SERVER_PORT_HTTPS)
    });


    if(SWAGGER_DOC_PATH)
    {
        console.log(`[${SwaggerDocumentGenerator.name}]: Building swagger document...`);
        generator.build(SWAGGER_DOC_PATH);
    } else console.log(`[${SwaggerDocumentGenerator.name}]: Enviroment variable 'SWAGGER_DOC_PATH' is undefined, failed to generate document`);
}