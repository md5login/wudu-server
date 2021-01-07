import http from 'http';
import BodyParser from "./BodyParser.js";
import { CookieReader } from "../cookies/CookieManager.js";

export default class Request extends http.IncomingMessage {
    #body;
    #cookies;
    static MAX_PAYLOAD_SIZE = 8388608; // 8MB
    constructor (socket) {
        super(socket);
    }

    body (size = Request.MAX_PAYLOAD_SIZE) {
        return new Promise((resolve, reject) => {
            if (this.#body !== undefined) return resolve(this.#body);
            let chunks = [];
            let maxLength = +this.headers['content-length'];
            if (maxLength > size) return reject('too large');
            let bufferSize = 0;
            let abort = false;
            this.on('data', data => {
                if (abort) return;
                chunks.push(data);
                bufferSize += data.length;
                if (bufferSize >= maxLength) {
                    this.#body = Buffer.concat(chunks);
                    resolve(this.#body);
                } else {
                    abort = true;
                    reject('too large');
                }
            })
                .on('end', () => {
                    if (abort) return;
                    this.#body = Buffer.concat(chunks);
                    resolve(this.#body);
                })
                .on('error', reject)
                .on('clientError', reject);
        });
    }

    async json (size = Request.MAX_PAYLOAD_SIZE) {
        return JSON.parse((await this.body(size)).toString());
    }

    multipart (size = Request.MAX_PAYLOAD_SIZE) {
        return BodyParser.getMultipart(this, size);
    }

    async map (sep = '&', del = '=', size = Request.MAX_PAYLOAD_SIZE) {
        let body = await this.body(size);
        let result = {};
        let keyValue = body.toString().split(sep);
        keyValue.forEach(kv => {
            let [key, value] = kv.split(del);
            result[decodeURIComponent(key)] = decodeURIComponent(value);
        });
        return result;
    }

    get cookies () {
        if (!this.#cookies) this.#cookies = new CookieReader(this.headers.cookie);
        return this.#cookies;
    }
}