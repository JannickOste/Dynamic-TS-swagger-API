import "reflect-metadata"

export const RouteDecoratorLabel = "APIRoute"

export function Route(route: string, description?: string) {
    return (target: any, propName: string) => {
        Reflect.defineMetadata(RouteDecoratorLabel, {
            route: route.replace('[controller]', target.constructor.name.replace('Controller','').toLowerCase()).replace("[target]", propName),
            description: description
        }, target, propName);
    }
}
