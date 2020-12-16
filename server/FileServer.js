import fs from 'fs';
import zlib from "zlib";
import path from 'path';
import MimeTypes from "./MimeTypes.js";

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
    static streamFile (filePath, stream, options = {}) {
        // if (stream.closed || stream.destroyed) return;
        // try {
        //     stream.on('error', e => {});
        //     stream.respond(headers);
        //     if (buffer) {
        //         stream.write(buffer, err => {
        //             if (err) throw err;
        //             stream.end();
        //         });
        //     } else {
        //         stream.end();
        //     }
        // } catch (e) {}

    }
    static async serveFile (filePath, response, options = {}) {
        filePath = path.join(options.root || '', filePath);
        let stat = await fs.promises.stat(filePath);
        if (options.ifModifiedSince && stat) {
            if (options.ifModifiedSince === new Date(stat.mtime).toUTCString()) {
                response.writeHead(304, {});
                response.end(null);
                return;
            }
        }
        let file = await fs.promises.readFile(filePath);
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