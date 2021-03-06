import fs from 'fs';
import zlib from "zlib";
import path from 'path';
import MimeTypes from "./MimeTypes.js";

/**
 * @typedef {Object} FileReadOptions
 * @property {BufferEncoding} [encoding]
 * @property {OpenMode} [flag]
 */

/**
 * @typedef {Object} ServeFileOptions
 * @property {string} [ifModifiedSince] - used to respond with 304 for not modified files
 * @property {('br'|'gzip'|'none')} [compression] - what type of compression to apply before serving
 * @property {string} [root] - root path to search the file path in
 * @property {object} [headers] - headers to be sent
 * @property {boolean} [enableTravers] - whether to enable serving path with '../'. default false
 * @property {FileReadOptions} [readOptions]
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
     * @return {Promise<void>}
     */
    static async serveFile (filePath, response, options = {}) {
        if (!options.enableTravers && filePath.includes('../')) {
            response.writeHead(403);
            response.end(null);
            return;
        }
        filePath = path.join(options.root || '', filePath);
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
        let file = await fs.promises.readFile(filePath, options.readOptions);
        let mime = FileServer.getMimeTypeByName(filePath);
        let headers = {
            'Content-Type': mime,
            'Last-Modified': new Date(stat.mtime).toUTCString(),
            ...(options.headers || {})
        };
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
        response.writeHead(200, headers);
        response.end(file);
    }
    static getMimeTypeByName (filename) {
        let ext = path.extname(filename).replace('.', '');
        return MimeTypes[ext] || 'application/octet-stream';
    }
}