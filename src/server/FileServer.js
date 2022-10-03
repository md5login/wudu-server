import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import MimeTypes from './MimeTypes.js';

const localCache = new Map();

/**
 * @typedef {Object} FileReadOptions
 * @property {BufferEncoding} [encoding]
 * @property {OpenMode} [flag]
 */

/**
 * @typedef {Object} ETag
 * @property {Function=} validator
 * @property {Function=} generator
 */

/**
 * @typedef {Object} ServeFileOptions
 * @property {string} [ifModifiedSince] - used to respond with 304 for not modified files
 * @property {('br'|'gzip'|'none')} [compression] - what type of compression to apply before serving
 * @property {string} [root] - root path to search the file path in
 * @property {object} [headers] - headers to be sent
 * @property {boolean} [enableTravers] - whether to enable serving path with '../'. default false
 * @property {boolean} [localCache] - if true, created runtime files map and caches requested files
 * @property {FileReadOptions} [readOptions]
 * @property {ETag=} etag
 */

export default class FileServer {
    static bufferToBrotli (buff) {
        return new Promise((resolve, reject) => {
            zlib.brotliCompress(buff, (err, buff) => {
                if (err) return reject(err);
                resolve(buff);
            });
        });
    }

    static bufferToGzip (buff) {
        return new Promise((resolve, reject) => {
            zlib.gzip(buff, (err, buff) => {
                if (err) return reject(err);
                resolve(buff);
            });
        });
    }

    /**
     *
     * @param {string} filePath
     * @param {ServerResponse} response
     * @param {ServeFileOptions=} options
     * @param {IncomingMessage} req
     * @return {Promise<void>}
     */
    static async serveFile (filePath, response, options = {}, req) {
        if (!options.enableTravers && filePath.includes('../')) {
            response.writeHead(403);
            response.end(null);
            return;
        }
        filePath = path.join(options.root || '', filePath);

        let headers = {
            ...(options.headers || {})
        };

        if (options.etag) {
            if (req.headers['if-none-match']) {
                if (options.etag.validator?.(filePath, req.headers['if-none-match'])) {
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

        let stat = await fs.promises.stat(filePath).catch(e => {
        });
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
        let file = await fs.promises.readFile(filePath, options.readOptions);

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

    static getMimeTypeByName (filename) {
        let ext = path.extname(filename).replace('.', '');
        return MimeTypes[ext] || 'application/octet-stream';
    }
}