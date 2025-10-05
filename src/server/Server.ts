import http, {IncomingMessage, ServerResponse} from 'http';
import https from 'https';
import WuduRequest from "./WuduRequest.ts";
import WuduResponse from "./WuduResponse.ts";
import cluster from "cluster";
import os from "os";
import {RouteHandler} from '../router/Router.ts';

let server;
// @ts-ignore
let listener: RouteHandler = (req: WuduRequest, res: WuduResponse): void => {res.end()};
let workers = [];

const forkProcesses = (cpus: number) => {
    let numCores = cpus === -1 ? os.availableParallelism() : cpus;

    for (let i = 0; i < numCores; ++i) {
        workers.push(cluster.fork());
    }

    cluster.on('exit', () => {
        cluster.fork();
        workers.push(cluster.fork());
    });
};
/**
 *
 * @param {ServerInitParams} initParams
 */
const runServer = (initParams: ServerInitParams) => {
    if (initParams.listener) { // @ts-ignore
        listener = initParams.listener;
    }
    let port;
    switch (initParams.protocol) {
        case Server.HTTPS:
            server = https.createServer({
                IncomingMessage: WuduRequest,
                ServerResponse: WuduResponse,
                ...initParams.options
            }, listener);
            port = 443;
            break;
        case Server.HTTP:
        default:
            server = http.createServer({
                IncomingMessage: WuduRequest,
                ServerResponse: WuduResponse,
                ...initParams.options
            }, listener);
            port = 3000;
    }
    port = initParams.port || port;
    const hostname = initParams.hostname || '127.0.0.1';
    if (initParams.redirectToHttps && initParams.protocol === Server.HTTPS) {
        const redirectPort = initParams.redirectPort ?? 80;
        http.createServer(function (req: IncomingMessage, res: ServerResponse) {
            res.writeHead(301, { "Location": `https://${req.headers['host']!.replace(`:${redirectPort}`, `:${port}`)}${req.url}`});
            res.end();
        }).listen(80, hostname);
    }
    server.keepAliveTimeout = initParams.keepAliveTimeout || 5000;
    server.listen(port, hostname);
};

export type ServerInitParams = {
    listener?: (req: WuduRequest, res: WuduResponse) => any; // request listener
    options?: http.ServerOptions | https.ServerOptions; // server options
    cpus?: number; // the amount of CPUs to run the server on. Default (0) - runs a single instance. -1 uses all available CPUs.
    keepAliveTimeout?: number; // [see docs]{@link https://nodejs.org/api/http.html#http_server_keepalivetimeout}
    protocol?: number; // 1 for HTTP, 2 for HTTPS, default 1
    port?: number; // default 3000
    hostname?: string; // default 127.0.0.1
    redirectToHttps?: boolean; // whether to run an HTTP server with redirection to HTTPS (runs on port :80)
    redirectPort?: number; // the http port to redirect from. Default 80
}

export default class Server {
    static HTTP = 1;
    static HTTPS = 2;

    /**
     * @param {ServerInitParams} initParams
     */
    constructor (initParams: ServerInitParams = {}) {
        if (cluster.isPrimary && initParams.cpus) {
            forkProcesses(initParams.cpus);
        } else {
            runServer(initParams);
        }
    }
}