import { App, Router, Server } from 'wudu-server';
import IndexEndpoint from "./server/endpoints/IndexEndpoint.js";
import UserEndpoint from "./server/endpoints/UserEndpoint.js";

let myApp = new App("{{appName}}");

// attach a router to your app
myApp.router = Router.handler;

Router.addPipe('accessLevel', (req, res, arg) => {
    return true;
});

// serve static folders
Router.serveStatic(['/views', '/js'], {pathPrefix: 'client'});

// add your endpoints
Router.addEndpoints(IndexEndpoint, UserEndpoint);

myApp.runServer({
    port: 3000,
    protocol: Server.HTTP,
    options: {}
});