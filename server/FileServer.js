import fs from 'fs';
import zlib from "zlib";
import path from 'path';

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
    static respond (stream, headers, buffer) {
        if (stream.closed || stream.destroyed) return;
        try {
            stream.on('error', e => {});
            stream.respond(headers);
            if (buffer) {
                stream.write(buffer, err => {
                    if (err) throw err;
                    stream.end();
                });
            } else {
                stream.end();
            }
        } catch (e) {}
    }
    static async serveFileHTTP (filePath, response, options = {}) {
        let file = await fs.promises.readFile(path.join(options.pathPrefix || '', filePath));
        let mime = FileServer.getMimeTypeByName(filePath);
        let headers = {
            'content-type': mime
        };
        switch (options.compression) {
            case 'none':
                break;
            case 'br':
                file = await FileServer.bufferToBrotli(file);
                headers['content-encoding'] = options.compression;
                break;
            case 'gzip':
                file = await FileServer.bufferToGzip(file);
                headers['content-encoding'] = options.compression;
                break;
        }
        response.writeHead(200, headers);
        response.end(file);
    }
    static async serveFileHttp2 (path, request) {}
    static getMimeTypeByName (filename) {
        let ext = filename.split('.').pop().toLowerCase();
        let mimes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            tiff: 'image/tiff',
            webp: 'image/webp',
            css: 'text/css',
            html: 'text/html',
            mp3: 'audio/mp3',
            mp4: 'video/mp4',
            js: 'application/javascript',
            json: 'application/json',
            ttf: 'application/octet-stream',
            svg: 'image/svg+xml',
            woff: 'application/octet-stream',
            woff2: 'application/octet-stream'
        };
        return mimes[ext];
    }
}