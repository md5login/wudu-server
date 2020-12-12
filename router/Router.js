import path from 'path';
import url from 'url';
import FileServer from "../server/FileServer.js";

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
    let ns = [endpoint.namespace];
    while (endpoint.__proto__.namespace) {
        ns.unshift(endpoint.__proto__.namespace);
        endpoint = endpoint.__proto__;
    }
    return ns.join('/');
}

function createApi (fnName, ns) {
    let [method, url, ...pipes] = fnName.split(' ');
    url = path.normalize(`${ns}/${url}`);
    method = method.toUpperCase();
    pipes = pipes.map(pipe => {
        let [handler, arg] = pipe.split(':');
        if (!customPipes.has(handler)) throw new Error(`pipe ${handler} is not defined`);
        return {handler, arg};
    });
    let processedUrl = processEndpointUrl(url);
    return {method, url: processedUrl, pipes, fnName, urlLength: processedUrl.toString().length};
}

export default class Router {
    static async handler (req, res) {
        let parsedUrl = url.parse(req.url);
        let method = req.method.toUpperCase();
        let ip = req.socket.remoteAddress.split(':').pop();
        if (!routes.has(method)) return res.end('');
        let bestMatch = '';
        let bestApi;
        let groups = {};
        let gpipes = await Promise.all([...globalPipes].map(gpipe => gpipe(req, res)));
        if (gpipes.some(gp => !gp) && !res.writableEnded) {
            res.writeHead(403);
            res.end(null);
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
            req.query = {...parsedUrl.query};
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

    static handleStatic (req, res, apiObject) {
        let acceptEncodings = req.headers['accept-encoding'].split(', ');
        let compression = 'none';
        if (acceptEncodings.includes('br')) {
            compression = 'br';
        } else if (acceptEncodings.includes('gzip')) {
            compression = 'gzip';
        }
        let reqUrl = url.parse(req.url).pathname;
        if (!apiObject.options.enableTraverse && reqUrl.includes('../')) {
            res.writeHead(403);
            return res.send(null);
        }
        return FileServer.serveFile(reqUrl, res, {compression, ifModifiedSince: req.headers['if-modified-since'], ...apiObject.options});
    }

    static addPipe (name, handler = (req, res, arg) => {}) {
        customPipes.set(name, handler);
    }

    static addGlobalPipe (handler = (req, res) => {}) {
        globalPipes.add(handler);
    }

    static addEndpoints (...endpoints) {
        endpoints.forEach(ep => {
            let api = Object.getOwnPropertyNames(ep)
                .filter(name => /^(get|post|put|patch|options|delete|trace|connect|head) .+/i.test(name))
                .map(url => createApi(url, getFullNamespace(ep)));
            api.forEach(route => {
                if (!routes.has(route.method)) routes.set(route.method, new Map());
                let methodRoutes = routes.get(route.method);
                methodRoutes.set(route.url, {...route, handler: ep});
            });
        });
    }

    static serveStatic (paths = [], options = {}) {
        if (!routes.has('GET')) routes.set('GET', new Map());
        paths.forEach(p => {
            let route = new RegExp(path.normalize(p)
                .replace(/\\/g, '/')
                .replace(/\//g, '\\/'));
            let apiObject = {static: true, handler: Router, fnName: 'handleStatic', options};
            routes.get('GET').set(route, apiObject);
        });
    }
}