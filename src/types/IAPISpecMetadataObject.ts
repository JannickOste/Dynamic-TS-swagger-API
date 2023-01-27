import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";

export type IAPISpecMetadataObject = {
    route:string;
    data:OpenAPIV3.PathItemObject
    component?:OpenAPIV3.ComponentsObject;
}
