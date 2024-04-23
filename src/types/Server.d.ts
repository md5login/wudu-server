import * as http from 'http';
import * as https from 'https';
import {RouteHandler} from './Router';

interface ServerInitParams {
    listener?: RouteHandler;
    protocol: number;
    options: http.ServerOptions | https.ServerOptions;  // replace with suitable options type for your case
    port?: number;
    redirectToHttps?: boolean;
    redirectPort?: number;
    cpus?: number;
    keepAliveTimeout?: number;
}

export class Server {
    static HTTP: number;
    static HTTPS: number;

    constructor (initParams?: ServerInitParams);
}