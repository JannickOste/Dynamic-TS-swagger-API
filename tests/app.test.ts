import test from "node:test"
import { App } from "../src/app"


test("http server is accessible", async() => {
    const app = new App();
    app.startHTTP();

    
})