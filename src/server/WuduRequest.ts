import {IncomingMessage} from 'http';
import BodyParser, {MultipartItem} from './BodyParser.ts';
import { CookieReader } from "../cookies/CookieManager.ts";
import {Socket} from 'node:net';
import {ParsedUrlQuery} from 'node:querystring';

export default class WuduRequest extends IncomingMessage {
    #body?: Buffer;
    #cookies?: CookieReader;
    remoteAddress?: string;
    query?: ParsedUrlQuery;
    params?: Record<string, string>;

    /**
     * @type {number} - global maximum size for body payload. Can be overridden by passing size param to body(), json(), multipart() and map()/toMap() methods.
     */
    static MAX_PAYLOAD_SIZE: number = 8388608; // 8M
    constructor (socket: Socket) {
        super(socket);
    }

    /**
     *
     * @param {number=} size - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<Buffer>}
     */
    body (size: number = WuduRequest.MAX_PAYLOAD_SIZE): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            if (this.#body !== undefined) return resolve(this.#body);
            let chunks: Buffer[] = [];
            let maxLength = +(this.headers['content-length'] || 0);
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
    async json (size: number = WuduRequest.MAX_PAYLOAD_SIZE): Promise<{}> {
        return JSON.parse((await this.body(size)).toString());
    }

    /**
     * @param  size - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<MultipartItem[]>}
     */
    multipart (size: number = WuduRequest.MAX_PAYLOAD_SIZE): Promise<MultipartItem[]> {
        return BodyParser.getMultipart(this, size);
    }


    /**
     * Creates a key-value map from string in body
     * @param {string} [sep] - the separator between key-value pairs.
     * @param {string} [del] - the delimiter between key and value.
     * @param {number} [size] - the maximum size of expected payload in bytes.
     * @throws will throw 'too large' if the payload size exceeds the given/default size.
     * @return {Promise<Record<string, string>>}
     */
    async toMap (sep: string = '&', del: string = '=', size: number = WuduRequest.MAX_PAYLOAD_SIZE): Promise<Record<string, string>> {
        let body = await this.body(size);
        let result: Record<string, string> = {};
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
    get cookies (): CookieReader {
        if (!this.#cookies) this.#cookies = new CookieReader(this.headers.cookie);
        return this.#cookies;
    }
}