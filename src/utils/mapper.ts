export default<T> (sourceObject:T, targetObject:any, mapUnknown=false) => {
    const newObject: any = sourceObject;

    for(let key of Object.getOwnPropertyNames(targetObject))
        newObject[key] = Object.getOwnPropertyDescriptor(targetObject, key)?.value;

    return newObject;
}