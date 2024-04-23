import * as fs from 'fs';
import {IncomingMessage, ServerResponse} from 'http';

export interface FileReadOptions {
    encoding?: BufferEncoding;
    flag?: fs.OpenMode;
}

export interface ETag {
    validator?: Function;
    generator?: Function;
}

export interface ServeFileOptions {
    ifModifiedSince?: string;
    compression?: 'br' | 'gzip' | 'none';
    root?: string;
    headers?: object;
    enableTravers?: boolean;
    localCache?: boolean;
    readOptions?: FileReadOptions;
    etag?: ETag;
}

declare class FileServer {
    static bufferToBrotli(buff: Buffer): Promise<Buffer>;
    static bufferToGzip(buff: Buffer): Promise<Buffer>;
    static serveFile(filePath: string, response: ServerResponse, options?: ServeFileOptions, req?: IncomingMessage): Promise<void>;
    static getMimeTypeByName(filename: string): string;
}

export default FileServer;