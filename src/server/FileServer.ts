import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import MimeTypes from './MimeTypes.ts';
import {IncomingMessage, ServerResponse} from 'http';
import {OutgoingHttpHeaders} from 'node:http';

const localCache = new Map();

export type FileReadOptions = {
    encoding?: BufferEncoding;
    flag?: fs.OpenMode;
}

export type ETag = {
    validator?: Function;
    generator?: Function;
}

export type ServeFileOptions = {
    ifModifiedSince?: string; // used to respond with 304 for not modified files
    compression?: 'br' | 'gzip' | 'none'; // what type of compression to apply before serving
    root?: string; // root path to search the file path in
    headers?: object; // headers to be sent
    enableTravers?: boolean; // whether to enable serving path with '../'. default false
    localCache?: boolean; // if true, created runtime files map and caches requested files
    readOptions?: FileReadOptions; // options to be passed to fs.readFile
    etag?: ETag; // etag generator and validator
}

export default class FileServer {
    /**
     * Compresses a buffer using Brotli
     */
    static bufferToBrotli (buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.brotliCompress(buffer, (err, buff) => {
                if (err) return reject(err);
                resolve(buff);
            });
        });
    }

    /**
     * Compresses a buffer using GZip
     */
    static bufferToGzip (buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.gzip(buffer, (err, buff) => {
                if (err) return reject(err);
                resolve(buff);
            });
        });
    }

    /**
     *
     * @param {string} filePath
     * @param {ServerResponse} response
     * @param {ServeFileOptions} [options]
     * @param {IncomingMessage} [req]
     * @return {Promise<void>}
     */
    static async serveFile (filePath: string, response: ServerResponse, options: ServeFileOptions = {}, req?: IncomingMessage) {
        if (!options.enableTravers && filePath.includes('../')) {
            response.writeHead(403);
            response.end(null);
            return;
        }
        filePath = path.join(options.root || '', filePath);

        let headers: OutgoingHttpHeaders = {
            ...(options.headers || {})
        };

        if (options.etag) {
            if (req!.headers['if-none-match']) {
                if (options.etag.validator?.(filePath, req!.headers['if-none-match'])) {
                    response.writeHead(304);
                    response.end(null);
                    return;
                }
            }
            headers.etag = options.etag.generator?.(filePath);
        }

        if (options.localCache) {
            if (localCache.has(filePath)) {
                const {headers, file} = localCache.get(filePath);
                response.writeHead(200, headers);
                response.end(file);
                return;
            }
        }

        let stat = await fs.promises.stat(filePath).catch(e => {});
        if (!stat) {
            response.writeHead(404);
            response.end(null);
            return;
        }

        if (options.ifModifiedSince && stat) {
            if (options.ifModifiedSince === new Date(stat.mtime).toUTCString()) {
                response.writeHead(304);
                response.end(null);
                return;
            }
        }
        let file = await fs.promises.readFile(filePath, options.readOptions) as Buffer;

        headers['Content-Type'] = FileServer.getMimeTypeByName(filePath);
        headers['Last-Modified'] = new Date(stat.mtime).toUTCString();

        switch (options.compression) {
            case 'none':
                break;
            case 'br':
                file = await FileServer.bufferToBrotli(file);
                headers['Content-Encoding'] = options.compression;
                break;
            case 'gzip':
                file = await FileServer.bufferToGzip(file);
                headers['Content-Encoding'] = options.compression;
                break;
        }
        headers['Content-Length'] = file.length;
        if (options.localCache) {
            localCache.set(filePath, {headers, file});
        }
        response.writeHead(200, headers);
        response.end(file);
    }

    static getMimeTypeByName (filename: string) {
        let ext = path.extname(filename).substring(1).toLowerCase();
        return MimeTypes[ext] || 'application/octet-stream';
    }
}