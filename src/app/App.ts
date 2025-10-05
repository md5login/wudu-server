import Server, {ServerInitParams} from '../server/Server.ts';
import {RouteHandler} from '../router/Router.ts';
import WuduRequest from '../server/WuduRequest.ts';
import WuduResponse from '../server/WuduResponse.ts';

export default class App {
    // @ts-ignore
    #router: RouteHandler = (req: WuduRequest, res: WuduResponse) => {};
    #server?: Server;

    set router (router: RouteHandler) {
        this.#router = router;
    }

    get server (): Server | undefined {
        return this.#server;
    }

    runServer (initParams: ServerInitParams): Server {
        this.#server = new Server({listener: this.#router, ...initParams});
        return this.#server;
    }
}