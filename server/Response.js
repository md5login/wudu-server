import http from 'http';
import FileServer from "./FileServer.js";
import { CookieWriter } from "../cookies/CookieManager.js";

export default class Response extends http.ServerResponse {
    #cookies;
    constructor (socket) {
        super(socket);
    }

    async file (path, options = {}) {
        return FileServer.serveFile(path, this, options);
    }

    json (obj, encoding = 'utf8') {
        this.writeHead(200, {'Content-Type': 'application/json'});
        this.end(JSON.stringify(obj), encoding);
    }

    text (str, encoding = 'utf8') {
        this.writeHead(200, {'Content-Type': 'text/plain'});
        this.end(str, encoding);
    }

    html (str, encoding = 'utf8') {
        this.writeHead(200, {'Content-Type': 'text/html'});
        this.end(str, encoding);
    }

    get cookies () {
        if (!this.#cookies) this.#cookies = new CookieWriter(this);
        return this.#cookies;
    }
}