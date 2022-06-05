import http from 'http';
import BodyParser from "./BodyParser.js";
import { CookieReader } from "../cookies/CookieManager.js";

/**
 * @class
 */
export default class Request extends http.IncomingMessage {
    #body;
    #cookies;
    static MAX_PAYLOAD_SIZE = 8388608; // 8MB
    /**
     *
     * @param {Socket} socket
     */
    constructor (socket) {
        super(socket);
    }

    /**
     *
     * @param {number=} size - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<Buffer>}
     */
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
                if (bufferSize <= maxLength) {
                    this.#body = Buffer.concat(chunks);
                } else {
                    abort = true;
                    reject('too large');
                }
            })
                .on('end', () => {
                    if (abort) return;
                    this.#body = Buffer.concat(chunks);
                    console.log(maxLength, bufferSize);
                    resolve(this.#body);
                })
                .on('error', reject)
                .on('clientError', reject);
        });
    }

    /**
     *
     * @param {number=} size - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<(Object)>}
     */
    async json (size = Request.MAX_PAYLOAD_SIZE) {
        return JSON.parse((await this.body(size)).toString());
    }

    /**
     * @param  size - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<MultipartItem[]>}
     */
    multipart (size = Request.MAX_PAYLOAD_SIZE) {
        return BodyParser.getMultipart(this, size);
    }

    /**
     *
     * @param {string=} sep - the separator between key-value pairs.
     * @param {string=} del - the delimiter between key and value.
     * @param {number=} size - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<Object>}
     */
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

    /**
     * @return {CookieReader}
     */
    get cookies () {
        if (!this.#cookies) this.#cookies = new CookieReader(this.headers.cookie);
        return this.#cookies;
    }
}