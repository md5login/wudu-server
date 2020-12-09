import {App, Router, Server} from 'wudu-server';
import IndexEndpoint from "./server/endpoints/IndexEndpoint.js";

let app = new App('{{appName}}');

app.router = Router.handler;

Router.addEndpoints(IndexEndpoint);

app.runServer({
    protocol: Server.HTTP,
    port: {{port}}
});