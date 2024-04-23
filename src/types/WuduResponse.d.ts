import * as http from 'http';
import {CookieWriter} from './CookieWriter';
import {ServeFileOptions} from './FileServer';

export default class WuduResponse extends http.ServerResponse {
    constructor(req: http.IncomingMessage);

    file(path: string, options?: ServeFileOptions): Promise<void>;
    json(obj: Object, encoding?: BufferEncoding): void;
    text(str: string, encoding?: BufferEncoding): void;
    html(str: string, encoding?: BufferEncoding): void;
    get cookies(): CookieWriter;
}