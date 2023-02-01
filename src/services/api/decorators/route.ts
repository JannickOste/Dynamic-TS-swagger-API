import "reflect-metadata"

export const RouteDecoratorLabel = "APIRoute"

export function Route(route: string, description?: string) {
    return Reflect.metadata(RouteDecoratorLabel, {
        route: route,
        description: description
    })
}
