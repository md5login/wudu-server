import http from 'http';
import https from 'https';
import WuduRequest from "./WuduRequest.js";
import WuduResponse from "./WuduResponse.js";
import cluster from "cluster";
import os from "os";

let server;
let listener = (req, res) => res.end();
let workers = [];


/**
 * @param {number} cpus
 */
const forkProcesses = cpus => {
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
const runServer = initParams => {
    if (initParams.listener) listener = initParams.listener;
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
        http.createServer(function (req, res) {
            res.writeHead(301, { "Location": `https://${req.headers['host'].replace(`:${redirectPort}`, `:${port}`)}${req.url}`});
            res.end();
        }).listen(80, hostname);
    }
    server.keepAliveTimeout = initParams.keepAliveTimeout || 5000;
    server.listen(port, hostname);
};

/**
 * @typedef {Object} ServerInitParams
 * @property {RouteHandler} [listener]
 * @property {ServerOptions} [options]
 * @property {number} [cpus] - the amount of CPUs to run the server on. Default (0) - runs a single instance. -1 uses all available CPUs.
 * @property {number} [keepAliveTimeout] - [see docs]{@link https://nodejs.org/api/http.html#http_server_keepalivetimeout}
 * @property {number} [protocol] - 1 for HTTP, 2 for HTTPS, default 1
 * @property {number} [port] - default 3000
 * @property {string} [hostname] - default 127.0.0.1
 * @property {boolean} [redirectToHttps] - whether to run an HTTP server with redirection to HTTPS (runs on port :80)
 * @property {number} [redirectPort] - the http port to redirect from. Default 80
 */

export default class Server {
    static HTTP = 1;
    static HTTPS = 2;

    /**
     * @param {ServerInitParams} initParams
     */
    constructor (initParams = {}) {
        if (cluster.isPrimary && initParams.cpus) {
            forkProcesses(initParams.cpus);
        } else {
            runServer(initParams);
        }
    }
}