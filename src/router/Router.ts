import path from 'path';
import FileServer, {ServeFileOptions} from '../server/FileServer.ts';
import querystring from 'querystring';
import {IncomingMessage, ServerResponse} from 'http';
import WuduRequest from '../server/WuduRequest.ts';
import WuduResponse from '../server/WuduResponse.ts';

const routes = new Map();
const customPipes = new Map<string, RoutePipe>();
const globalPipes = new Set<GlobalRoutePipe>();

function processEndpointUrl (url: string): RegExp {
    return new RegExp('^' + url
        .replace(/\\/g, '/') // replace windows path
        .replace(/\/:(\w+)/g, (full, match) => `\/(?<${match}>[^?#\/]+)`)
        .replace(/\/:\?(\w+)/g, (full, match) => `\/(?<${match}>[^?#\/]+)?`)
        .replace(/\//g, '\\/'));
}

abstract class Endpoint {
    static namespace = '';
}

function getFullNamespace (endpoint: typeof Endpoint) {
    let ns = [endpoint.namespace || ''];
    let proto = Object.getPrototypeOf(endpoint);
    while (proto.namespace) {
        ns.unshift(proto.namespace);
        endpoint = proto;
        proto = Object.getPrototypeOf(endpoint);
    }
    return path.join(...new Set(ns));
}

function createApi (fnName: string, ns: string): RouterApiObject {
    if (ns === '.') ns = '';
    let [method, url, ...pipesStr] = fnName.split(' ');
    url = path.join(ns, url).replace(/\\/g, '/'); // join and replace Windows path separator '\' to '/'
    url = url.replace(/\/$/, ''); // remove trailing slash
    if (!url.startsWith('/')) url = '/' + url; // add leading slash if not exists
    method = method.toUpperCase();
    const pipes = pipesStr.map(pipe => {
        let [handler, arg] = pipe.split(':');
        if (!customPipes.has(handler)) throw new Error(`pipe ${handler} is not defined`);
        return {handler, arg};
    });
    let processedUrl = processEndpointUrl(url);
    return {method: method as RouteMethod, url: processedUrl, pipes, fnName, urlLength: processedUrl.toString().length};
}

export type RouterApiObject = {
    method: RouteMethod;
    url: RegExp;
    pipes: {handler: string, arg: string}[];
    fnName: string;
    urlLength: number;
};

export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'DELETE' | 'TRACE' | 'CONNECT' | 'HEAD';
export type RouteApiObject = {
    static?: boolean;
    handler?: Function;
    fnName?: string;
    urlLength?: number;
    fileOptions?: ServeFileOptions;
};
export type RouteHandler = (req: IncomingMessage, res: ServerResponse) => any;
export type RoutePipe = (req: WuduRequest, res: WuduResponse, arg: string) => Promise<boolean> | boolean;
export type GlobalRoutePipe = (req: WuduRequest, res: WuduResponse) => Promise<boolean> | boolean;
export default class Router {
    /**
     * @param {Partial<IncomingMessage>} req
     * @param {ServerResponse} res
     * @return {Promise<void>}
     */
    static async handler (req: WuduRequest, res: WuduResponse): Promise<void> {
        let parsedUrl = Router.#getParsedUrl(req);
        let method = req.method!.toUpperCase();
        req.remoteAddress = req.socket!.remoteAddress!.split(':').pop();
        if (!routes.has(method)) {
            res.end('');
            return;
        }
        let bestMatch = '';
        let bestApi;
        let groups = {};
        let gpipes = await Promise.all([...globalPipes].map((gpipe: GlobalRoutePipe) => gpipe(req, res)));
        if (gpipes.some((gp: boolean) => !gp)) {
            if (!res.writableEnded) {
                res.writeHead(403);
                res.end(null);
            }
            return;
        }
        for (let [route, apiObject] of routes.get(method).entries()) {
            let match = parsedUrl.pathname.match(route);
            if (match) {
                if (apiObject.static) return Router.handleStatic(req, res, apiObject);
                if (apiObject.urlLength > bestMatch) {
                    bestMatch = apiObject.urlLength;
                    groups = match.groups || {};
                    bestApi = apiObject;
                }
            }
        }
        if (bestMatch) {
            req.query = {};
            if (parsedUrl.search) req.query = querystring.parse(parsedUrl.search.substring(1));
            if (groups) {
                req.params = {...groups};
            }
            for (let pipe of bestApi.pipes) {
                if (!(await customPipes.get(pipe.handler)!(req, res, pipe.arg))) {
                    !res.writableEnded && res.end();
                    return;
                }
            }
            return bestApi.handler[bestApi.fnName](req, res);
        }
        res.end();
    }

    /**
     *
     * @param {IncomingMessage} req
     * @param {ServerResponse} res
     * @param {RouteApiObject} [opts]
     * @return {Promise<void>|void}
     */
    static handleStatic (req: IncomingMessage, res: ServerResponse, opts: RouteApiObject = {}): Promise<void> | void {
        if (!opts.fileOptions) opts.fileOptions = {};
        if (!opts.fileOptions?.compression) {
            let acceptEncodings = (req.headers['accept-encoding'] || '').split(', ');
            opts.fileOptions.compression = 'none';
            if (acceptEncodings.includes('br')) {
                opts.fileOptions.compression = 'br';
            } else if (acceptEncodings.includes('gzip')) {
                opts.fileOptions.compression = 'gzip';
            }
        }
        let reqUrl = Router.#getParsedUrl(req).pathname;
        return FileServer.serveFile(reqUrl, res, opts.fileOptions, req);
    }

    static #getParsedUrl (req: IncomingMessage) {
        // @ts-ignore
        let protocol = typeof req.socket.getPeerCertificate === 'function' ? 'https' : 'http';
        return new URL(req.url!, `${protocol}://${req.headers.host}`);
    }

    /**
     * Pipes are functions that get invoked prior to the route handler itself. If a pipe returns false, the request flow is stopped and 403 response is sent immediately.
     * @param {string} name - name of the pipe to be used in routing definition.
     * @param handler
     */
    static addPipe (name: string, handler: RoutePipe) {
        customPipes.set(name, handler);
    }

    /**
     * @param {GlobalRoutePipe} handler -  A global routing pipe function controls the flow of any incoming request. If it returns false, response 403 is sent immediately.
     */
    static addGlobalPipe (handler: GlobalRoutePipe) {
        globalPipes.add(handler);
    }

    /**
     * See docs for endpoint definition [here]{@link https://github.com/md5login/wudu-server/blob/master/docs/DOCS.md#defining-an-endpoint}
     */
    static addEndpoints (...endpoints: [typeof Endpoint]) {
        endpoints.forEach(ep => {
            let api = Object.getOwnPropertyNames(ep)
                .filter(name => /^(GET|POST|PUT|PATCH|OPTIONS|DELETE|TRACE|CONNECT|HEAD) .+/.test(name))
                .map(url => createApi(url, getFullNamespace(ep)));
            api.forEach(route => {
                if (!routes.has(route.method)) routes.set(route.method, new Map());
                let methodRoutes = routes.get(route.method);
                methodRoutes.set(route.url, {...route, handler: ep});
            });
        });
    }

    /**
     * Add paths to be treated as static. Any request to a subpath of the given path will be served with a file server.
     * Static paths have higher priority than other endpoints. Thus, when a static path is matched, no further route matching occurs.
     * By default, uses compression accepted by the browser: br or gzip
     * @param {string[]} paths
     * @param {ServeFileOptions=} opts
     */
    static serveStatic (paths: string[] = [], opts: ServeFileOptions = {}) {
        if (!routes.has('GET')) routes.set('GET', new Map());
        paths.forEach((p: string | RegExp) => {
            let route;
            if (p instanceof RegExp) {
                route = p;
            } else {
                route = new RegExp(path.normalize(p)
                    .replace(/\\/g, '/')
                    .replace(/\//g, '\\/'));
            }
            let apiObject = {static: true, handler: Router, fnName: 'handleStatic', fileOptions: opts};
            routes.get('GET').set(route, apiObject);
        });
    }
}