import {Server, ServerInitParams} from './Server';
import {RouteHandler} from './Router';

export default class App {
    new(): App;
    router: RouteHandler;
    readonly server: Server;

    runServer(initParams: ServerInitParams): Server;
}