import path from 'path';
import FileServer from "../server/FileServer.js";
import querystring from 'querystring';

const routes = new Map();
const customPipes = new Map();
const globalPipes = new Set();

function processEndpointUrl (url) {
    url = new RegExp('^' + url
        .replace(/\\/g, '/') // replace windows path
        .replace(/\/:(\w+)/g, (full, match) => `\/(?<${match}>[^?#\/]+)`)
        .replace(/\//g, '\\/'));
    return url
}

function getFullNamespace (endpoint) {
    let ns = [endpoint.namespace || ''];
    while (endpoint.__proto__.namespace) {
        ns.unshift(endpoint.__proto__.namespace);
        endpoint = endpoint.__proto__;
    }
    return path.join(...new Set(ns));
}

function createApi (fnName, ns) {
    if (ns === '.') ns = '';
    let [method, url, ...pipes] = fnName.split(' ');
    url = path.join(ns, url).replace(/\\/g, '/'); // join and replace Windows path separator '\' to '/'
    url = url.replace(/\/$/, ''); // remove trailing slash
    if (!url.startsWith('/')) url = '/' + url; // add leading slash if not exists
    method = method.toUpperCase();
    pipes = pipes.map(pipe => {
        let [handler, arg] = pipe.split(':');
        if (!customPipes.has(handler)) throw new Error(`pipe ${handler} is not defined`);
        return {handler, arg};
    });
    let processedUrl = processEndpointUrl(url);
    return {method, url: processedUrl, pipes, fnName, urlLength: processedUrl.toString().length};
}

/**
 * @typedef {Object} RouteApiObject
 * @property {boolean} [static]
 * @property {Function} [handler]
 * @property {string} [fnName]
 * @property {number} [urlLength]
 * @property {ServeFileOptions} fileOptions
 */

/**
 * @callback RouteHandler
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @return
 */

/**
 * @callback RoutePipe
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {string} arg
 * @return boolean
 */

/**
 * @callback GlobalRoutePipe
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @return boolean
 */


export default class Router {
    /**
     * @param {Partial<IncomingMessage>} req
     * @param {ServerResponse} res
     * @return {Promise<void>}
     */
    static async handler (req, res) {
        let parsedUrl = Router.#getParsedUrl(req);
        let method = req.method.toUpperCase();
        req.remoteAddress = req.socket.remoteAddress.split(':').pop();
        if (!routes.has(method)) return res.end('');
        let bestMatch = '';
        let bestApi;
        let groups = {};
        let gpipes = await Promise.all([...globalPipes].map(gpipe => gpipe(req, res)));
        if (gpipes.some(gp => !gp)) {
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
            if (parsedUrl.search) req.query = querystring.parse(parsedUrl.search.substr(1));
            if (groups) {
                req.params = {...groups};
            }
            for (let pipe of bestApi.pipes) {
                if (!(await customPipes.get(pipe.handler)(req, res, pipe.arg))) {
                    return !res.writableEnded && res.end();
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
     * @param {RouteApiObject=} opts
     * @return {Promise<void>|void}
     */
    static handleStatic (req, res, opts = {}) {
        let acceptEncodings = (req.headers['accept-encoding'] || '').split(', ');
        let compression = 'none';
        if (acceptEncodings.includes('br')) {
            compression = 'br';
        } else if (acceptEncodings.includes('gzip')) {
            compression = 'gzip';
        }
        let reqUrl = Router.#getParsedUrl(req).pathname;
        return FileServer.serveFile(reqUrl, res, {compression, ifModifiedSince: req.headers['if-modified-since'], ...opts.fileOptions});
    }

    static #getParsedUrl (req) {
        let protocol = typeof req.socket.getPeerCertificate === 'function' ? 'https' : 'http';
        return new URL(req.url, `${protocol}://${req.headers.host}`);
    }

    /**
     * Pipes are functions that get invoked prior to the route handler itself. If a pipe returns false, the request flow is stopped and 403 response is sent immediately.
     * @param {string} name - name of the pipe to be used in routing definition.
     * @param {RoutePipe} handler
     */
    static addPipe (name, handler) {
        customPipes.set(name, handler);
    }

    /**
     * @param {GlobalRoutePipe} handler -  A global routing pipe function controls the flow of any incoming request. If it returns false, response 403 is sent immediately.
     */
    static addGlobalPipe (handler) {
        globalPipes.add(handler);
    }

    /**
     * See docs for endpoint definition [here]{@link https://github.com/md5login/wudu-server/blob/master/docs/DOCS.md#defining-an-endpoint}
     */
    static addEndpoints (...endpoints) {
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
    static serveStatic (paths = [], opts = {}) {
        if (!routes.has('GET')) routes.set('GET', new Map());
        paths.forEach(p => {
            let route = new RegExp(path.normalize(p)
                .replace(/\\/g, '/')
                .replace(/\//g, '\\/'));
            let apiObject = {static: true, handler: Router, fnName: 'handleStatic', fileOptions: opts};
            routes.get('GET').set(route, apiObject);
        });
    }
}