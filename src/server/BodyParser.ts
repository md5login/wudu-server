import {IncomingMessage} from 'http';

const DOUBLE_CRLF = Buffer.from([13, 10, 13, 10]);

const findAll = function (buffer: Buffer, match: Buffer, offset = -1): number[] {
    if (!match.length) return [];
    match = Buffer.from(match);
    let result = [];
    let index = offset;
    while (true) {
        index = buffer.indexOf(match, index + 1);
        if (!~index) break;
        result.push(index);
    }

    return result;
}

export type MultipartItem = {
    isFile: boolean;
    filename?: string;
    paramName: string;
    value: Buffer;
    headers: Record<string, string>;
    contentType: string;
}

export default class BodyParser {
    static #extractHeaders (headersBuffer: Buffer): Record<string, string> {
        let result: any = {};
        let str = headersBuffer.toString();
        let headers = str.split(/\r\n/);
        headers.forEach(header => {
            let [name, value] = header.split(': ');
            result[name.toLowerCase()] = value;
        });
        return result;
    }

    static #processPayloadChunk (payload: Buffer): MultipartItem {
        let result: MultipartItem = {
            isFile: false,
            paramName: '',
            value: Buffer.alloc(0),
            headers: {},
            contentType: 'text/plain'
        };
        let headersEnd = payload.indexOf(DOUBLE_CRLF);
        result.headers = this.#extractHeaders(payload.subarray(0, headersEnd));
        result.value = payload.subarray(headersEnd + DOUBLE_CRLF.length, payload.length - 2);
        if (result.headers['content-disposition']) {
            let cd = result.headers['content-disposition'];
            result.paramName = cd.replace(/^.* name="(.+?)".*$/, '$1');
            let fileName = cd.replace(/^.* filename="(.+?)"$/, '$1');
            if (fileName !== cd) {
                result.isFile = true;
                result.filename = fileName;
            }
            else {
                result.isFile = false;
            }
        }
        result.contentType = result.headers['content-type'] || 'text/plain';
        return result;
    }

    static #extractPayloadChunks (request: IncomingMessage, maxSize: number): Promise<Buffer[]> {
        return new Promise((resolve, reject) => {
            if (!request.headers['content-type']!.startsWith('multipart/form-data;')) return reject('wrong content type')
            let boundary = Buffer.from(`--${request.headers['content-type']!.split('boundary=')[1]}`);
            let contentLength = +request.headers['content-length']!;
            if (contentLength > maxSize) return reject('too large');
            let cursor: number;
            let size = 0;
            let indices: number[] = [];
            let abort = false;
            // we use allocUnsafe for performance reasons
            // only filled parts will be pushed to result
            // so security concern is not an issue here
            let payload = Buffer.allocUnsafe(contentLength);
            request
                .on('data', chunk => {
                    if (abort) return;
                    // add chunk data to payload
                    chunk.copy(payload, size);
                    size += chunk.length;
                    if (size > maxSize) {
                        abort = true;
                        return reject('too large')
                    }
                    // if chunk is too small to contain boundary - return
                    if (cursor + boundary.length > size) return;
                    // find all indices of boundary in the payload starting at cursor offset
                    indices.push(...findAll(payload.subarray(0, size), boundary, cursor));
                    // update cursor
                    cursor = Math.max(size - (boundary.length - 1), indices[indices.length - 1] + boundary.length);
                })
                .on('end', () => {
                    if (abort) return;
                    let result = [];
                    // push only the relevant payload without boundaries
                    for (let i = 0; i < indices.length - 1;) {
                        result.push(payload.subarray(indices[i] + boundary.length + 2, indices[++i]));
                    }
                    resolve(result);
                })
                .on('error', () => {});
        });
    }

    /**
     * @param {http.IncomingMessage} request
     * @param {number} size - the maximum size of expected payload in bytes. Throws exception when exceeding.
     * @return {Promise<MultipartItem[]>}
     */
    static async getMultipart (request: IncomingMessage, size: number): Promise<MultipartItem[]> {
        let payloadChunks = await this.#extractPayloadChunks(request, size);
        if (!payloadChunks || !payloadChunks.length) return [];
        return payloadChunks.map(p => this.#processPayloadChunk(p));
    }
}