import http from 'http';
import BodyParser from "./BodyParser.js";

export default class Request extends http.IncomingMessage {
    #body;
    #query;
    constructor (socket) {
        super(socket);
    }

    body () {
        return new Promise((resolve, reject) => {
            if (this.#body !== undefined) return resolve(this.#body);
            let chunks = [];
            let maxLength = +this.headers['content-length'];
            let size = 0;
            this.on('data', data => {
                chunks.push(data);
                size += data.length;
                if (size >= maxLength) {
                    this.#body = Buffer.concat(chunks);
                    resolve(this.#body);
                }
            })
                .on('end', () => {
                    this.#body = Buffer.concat(chunks);
                    resolve(this.#body);
                })
                .on('error', reject)
                .on('clientError', reject);
        });
    }

    async json () {
        return JSON.parse(await this.body().toString());
    }

    multipart (maxPayloadSize) {
        return BodyParser.getMultipart(this, maxPayloadSize);
    }
}