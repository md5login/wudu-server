import http from 'http';
import https from 'https';
import Request from "./Request.js";
import Response from "./Response.js";

export default class Server {
    static HTTP = 1;
    static HTTPS = 2;
    static HTTP2 = 3;
    static WEBSOCKET = 4;
    #server;
    #listener = (req, res) => res.end();

    constructor (initParams = {}) {
        if (initParams.listener) this.#listener = initParams.listener;
        switch (initParams.protocol) {
            case Server.HTTPS:
                this.#server = https.createServer({
                    IncomingMessage: Request,
                    ServerResponse: Response,
                    ...initParams.options
                }, (...a) => this.#listener(...a));
                break;
            case Server.HTTP2:
                break;
            case Server.WEBSOCKET:
                break;
            case Server.HTTP:
            default:
                this.#server = http.createServer({
                    IncomingMessage: Request,
                    ServerResponse: Response,
                    ...initParams.options
                }, (...a) => this.#listener(...a));
                this.#server.listen(initParams.port || 3000);
        }
    }
}