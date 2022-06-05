import http from 'http';
import https from 'https';
import Request from "./Request.js";
import Response from "./Response.js";
import cluster from "cluster";
import os from "os";

let server;
let listener = (req, res) => res.end();
let workers = [];


/**
 * @param {number} cpus
 */
const forkProcesses = cpus => {
    let numCores = cpus > 0 ? cpus : os.cpus().length / 2;

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
const runServer = initParams => {
    if (initParams.listener) listener = initParams.listener;
    let port;
    switch (initParams.protocol) {
        case Server.HTTPS:
            server = https.createServer({
                IncomingMessage: Request,
                ServerResponse: Response,
                ...initParams.options
            }, listener);
            port = 443;
            break;
        case Server.HTTP:
        default:
            server = http.createServer({
                IncomingMessage: Request,
                ServerResponse: Response,
                ...initParams.options
            }, listener);
            port = 3000;
    }
    if (initParams.redirectToHttps && initParams.protocol === Server.HTTPS) {
        http.createServer(function (req, res) {
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        }).listen(80);
    }
    server.keepAliveTimeout = initParams.keepAliveTimeout || 5000;
    port = initParams.port || port;
    server.listen(port);
};

/**
 * @typedef {Object} ServerInitParams
 * @property {RouteHandler} [listener]
 * @property {ServerOptions} [options]
 * @property {number} [cpus] - the amount of CPUs to run the server on. By default (0) runs on all available CPUs.
 * @property {number} [keepAliveTimeout] - [see docs]{@link https://nodejs.org/api/http.html#http_server_keepalivetimeout}
 * @property {number} [protocol] - 1 for HTTP, 2 for HTTPS, default 1
 * @property {number} [port] - default 3000
 */

export default class Server {
    static HTTP = 1;
    static HTTPS = 2;

    /**
     * @param {ServerInitParams} initParams
     */
    constructor (initParams = {}) {
        if (cluster.isPrimary && initParams.fork) {
            forkProcesses(initParams.cpus);
        } else {
            runServer(initParams);
        }
    }
}