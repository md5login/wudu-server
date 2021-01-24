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
        let str = JSON.stringify(obj)
        this.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': str.length});
        this.end(str, encoding);
    }

    text (str, encoding = 'utf8') {
        this.writeHead(200, {'Content-Type': 'text/plain', 'Content-Length': str.length});
        this.end(str, encoding);
    }

    html (str, encoding = 'utf8') {
        this.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': str.length});
        this.end(str, encoding);
    }

    get cookies () {
        if (!this.#cookies) this.#cookies = new CookieWriter(this);
        return this.#cookies;
    }
}