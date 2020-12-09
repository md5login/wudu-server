import http from 'http';
import fs from 'fs';
import FileServer from "./FileServer.js";

export default class Response extends http.ServerResponse {
    constructor (socket) {
        super(socket);
    }

    async file (path, options = {}) {
        let file = await fs.promises.readFile(path);
        return FileServer.serveFileHTTP(path, this, options);
    }

    json (obj, encoding = 'utf8') {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(obj), encoding);
    }

    text (str, encoding = 'utf8') {
        this.setHeader('Content-Type', 'text/plain');
        this.end(str, encoding);
    }

    html (str, encoding = 'utf8') {
        this.setHeader('Content-Type', 'text/html');
        this.end(str, encoding);
    }
}