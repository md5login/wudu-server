import http from 'http';
import https from 'https';
import Request from "./Request.js";
import Response from "./Response.js";
import cluster from "cluster";
import os from "os";

let server;
let listener = (req, res) => res.end();
let workers = [];

const forkProcesses = cpus => {
    let numCores = cpus || os.cpus().length;

    for (let i = 0; i < numCores; ++i) {
        workers.push(cluster.fork());
    }

    cluster.on('exit', () => {
        cluster.fork();
        workers.push(cluster.fork());
    });
};
const runServer = initParams => {
    if (initParams.listener) listener = initParams.listener;
    let port;
    switch (initParams.protocol) {
        case Server.HTTPS:
            server = https.createServer({
                IncomingMessage: Request,
                ServerResponse: Response,
                ...initParams.options
            }, (...a) => listener(...a));
            port = 443;
            break;
        case Server.HTTP:
        default:
            server = http.createServer({
                IncomingMessage: Request,
                ServerResponse: Response,
                ...initParams.options
            }, (...a) => listener(...a));
            port = 3000;
    }
    server.keepAliveTimeout = initParams.keepAliveTimeout || 5000;
    server.listen(port);
};

export default class Server {
    static HTTP = 1;
    static HTTPS = 2;

    constructor (initParams = {}) {
        if (cluster.isMaster) {
            forkProcesses(initParams.cpus);
        } else {
            runServer(initParams);
        }
    }
}