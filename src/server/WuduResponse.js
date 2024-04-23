import http from 'http';
import FileServer from "./FileServer.js";
import { CookieWriter } from "../cookies/CookieManager.js";

export default class WuduResponse extends http.ServerResponse {
    #cookies;

    /**
     * @param {Request} req
     */
    constructor (req) {
        super(req);
    }

    /**
     * Respond with a file
     * @param {string} path
     * @param {ServeFileOptions=} options
     * @return {Promise<void>}
     */
    async file (path, options = {}) {
        return FileServer.serveFile(path, this, options);
    }

    /**
     * Respond with a JSON
     * @param {Object} obj
     * @param {BufferEncoding} encoding
     */
    json (obj, encoding = 'utf8') {
        let str = JSON.stringify(obj);
        let length = Buffer.byteLength(str, encoding);
        this.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': length});
        this.end(str, encoding);
    }

    /**
     * Respond with string
     * @param {string} str
     * @param {BufferEncoding} encoding
     */
    text (str, encoding = 'utf8') {
        let length = Buffer.byteLength(str, encoding);
        this.writeHead(200, {'Content-Type': 'text/plain', 'Content-Length': length});
        this.end(str, encoding);
    }

    /**
     * Respond with an HTML
     * @param {string} str
     * @param {BufferEncoding} encoding
     */
    html (str, encoding = 'utf8') {
        let length = Buffer.byteLength(str, encoding);
        this.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': length});
        this.end(str, encoding);
    }

    /**
     * @return {CookieWriter}
     */
    get cookies () {
        if (!this.#cookies) this.#cookies = new CookieWriter(this);
        return this.#cookies;
    }
}