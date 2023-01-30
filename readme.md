# Dynamic-TS-swagger-API
 ![](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)
 ![](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
 ![](https://img.shields.io/badge/typeorm-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
 ![](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
 ![](https://img.shields.io/static/v1?label=Project%20status:&message=base%20works&color=yellow&style=for-the-badge)

This project is a deployable Docker API built with TypeScript that offers easy extensibility by adding schemas, view models, and controllers using Swagger UI. It features automated documentation generation and route loading based on function decorators. It includes both HTTP and HTTPS functionality and supports all request types. The base server is an Express server, and it uses TypeORM for the database connection with a custom 'Database' class using a singleton pattern. The Docker container also includes its own MariaDB server.

## Quick start 
0. <b>Configure:</b>
- Create an .env file based upon the .env.template containing your API & database data.

1. <b>Create a schema: </b>
- Go into /src/schemas and create a @sinclair/typebox type schema. 

- <b>Example:</b>
```
export const DialogueSchema = Type.Strict(
    Type.Object({
        id:Type.Optional(Type.Number()),
        title:Type.String(),
        linesCSV:Type.String()
    }, 
    {
        additionalProperties: false
    })
)
```

2. <b>Create a database entity: </b>
- Go into /src/entities and create an entity based on a static type descriptor of the schema you just created. 
- <b>Example:</b>
```
@Entity()
export default class Dialogue implements Static<typeof DialogueSchema>
{
    @PrimaryGeneratedColumn()
    id!:number;

    @Column({unique:true, nullable: false})
    title!:string;

    @Column({unique:true, nullable:false})
    linesCSV!:string;
}

```

3. <b> Create a route controller: </b>
- Go into /src/controllers and create route controller that extends the RouteBase class, All controller functionality should be specified as arrow functions and require a HTTPMethod, Route & Responses decorator 
- <b>Example:</b>
```

export default class DialogueController extends RouteBase
{
    private static readonly repo:Repository<Dialogue> = Database.Singleton.connector.getRepository(Dialogue);

    /**
     * Example: GET(without parameters)
     */
    @HTTPMethod("get")
    @Route("/dialogues/", "Get all dialogue entity objects")
    @Responses([
        {
            statusCode: 200,
            description: "All dialogue entity object",
            schema: Type.Array(DialogueSchema) as OpenAPIV3.SchemaObject
        }
    ])
    private getAllDialogues = async(req: Request, res:Response):IExpressRouteHandlerType =>
    {
        const dialogues = await DialogueController.repo.find();

        return res.status(200).json(dialogues)
    }
}
```

4. <b>Run or deploy! </b>
- Start locally : run start:develop
- Or compose: docker-compose up 
