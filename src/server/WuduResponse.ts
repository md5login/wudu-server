import {IncomingMessage, ServerResponse} from 'http';
import FileServer, {ETag, FileReadOptions} from './FileServer.ts';
import { CookieWriter } from "../cookies/CookieManager.ts";

type ServeFileOptions = {
    ifModifiedSince?: string;
    compression?: 'br' | 'gzip' | 'none';
    root?: string;
    headers?: object;
    enableTravers?: boolean;
    localCache?: boolean;
    readOptions?: FileReadOptions;
    etag?: ETag;
}

export default class WuduResponse extends ServerResponse {
    #cookies?: CookieWriter;

    constructor (req: IncomingMessage) {
        super(req);
    }

    /**
     * Respond with a file
     */
    async file (path: string, options: ServeFileOptions = {}): Promise<void> {
        return FileServer.serveFile(path, this, options);
    }

    /**
     * Respond with a JSON
     */
    json (obj: {}, encoding: BufferEncoding = 'utf8') {
        let str = JSON.stringify(obj);
        let length = Buffer.byteLength(str, encoding);
        this.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': length});
        this.end(str, encoding);
    }

    /**
     * Respond with string
     */
    text (str: string, encoding: BufferEncoding = 'utf8') {
        let length = Buffer.byteLength(str, encoding);
        this.writeHead(200, {'Content-Type': 'text/plain', 'Content-Length': length});
        this.end(str, encoding);
    }

    /**
     * Respond with an HTML
     */
    html (str: string, encoding: BufferEncoding = 'utf8') {
        let length = Buffer.byteLength(str, encoding);
        this.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': length});
        this.end(str, encoding);
    }

    get cookies (): CookieWriter {
        if (!this.#cookies) this.#cookies = new CookieWriter(this);
        return this.#cookies;
    }
}