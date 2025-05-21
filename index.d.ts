import {IncomingMessage, ServerResponse, ServerOptions} from 'http';
import * as net from 'net';
import * as https from 'https';
import * as fs from 'fs';

declare module 'wudu-server' {
    class App {
        new(): App;
        router: RouteHandler;
        readonly server: Server;

        runServer(initParams: ServerInitParams): Server;
    }

    class WuduRequest extends IncomingMessage {
        static MAX_PAYLOAD_SIZE: number;
        constructor(socket: net.Socket);
        body(size?: number): Promise<Buffer>;
        json(size?: number): Promise<object>;
        multipart(size?: number): Promise<Array<MultipartItem>>;
        /** @deprecated */
        // @ts-ignore
        map(sep?: string, del?: string, size?: number): Promise<object>;
        toMap(sep?: string, del?: string, size?: number): Promise<object>;
        get cookies(): CookieReader;
    }

    class WuduResponse extends ServerResponse {
        constructor(req: IncomingMessage);

        file(path: string, options?: ServeFileOptions): Promise<void>;
        json(obj: Object, encoding?: BufferEncoding): void;
        text(str: string, encoding?: BufferEncoding): void;
        html(str: string, encoding?: BufferEncoding): void;
        get cookies(): CookieWriter;
    }

    interface ServerInitParams {
        listener?: RouteHandler;
        protocol: number;
        options: ServerOptions | https.ServerOptions;  // replace with suitable options type for your case
        port?: number;
        redirectToHttps?: boolean;
        redirectPort?: number;
        cpus?: number;
        keepAliveTimeout?: number;
        hostname?: string;
    }

    class Server {
        static HTTP: number;
        static HTTPS: number;

        constructor (initParams?: ServerInitParams);
    }

    interface RouteApiObject {
        static?: boolean;
        handler?: Function;
        fnName?: string;
        urlLength?: number;
        fileOptions: ServeFileOptions;
    }

    type RouteHandler = (req: IncomingMessage, res: ServerResponse) => any;
    type RoutePipe = (req: IncomingMessage, res: ServerResponse, arg: string) => boolean;
    type GlobalRoutePipe = (req: IncomingMessage, res: ServerResponse) => boolean;

    class Router {
        static handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
        static handleStatic(req: IncomingMessage, res: ServerResponse, opts?: RouteApiObject): Promise<void>;
        static addPipe(name: string, handler: RoutePipe): void;
        static addGlobalPipe(handler: GlobalRoutePipe): void;
        static addEndpoints(...endpoints: any[]): void;
        static serveStatic(paths?: string[], opts?: any): void;
    }

    class CookieReader {
        constructor(cookieHeader: string);

        /**
         * Retrieve all parsed cookies
         * @return {object} - an object containing all the parsed cookies
         */
        getAll(): object;

        /**
         * Retrieve the value of a specific cookie
         * @param {string} name - cookie name
         * @param {string} prefix - if given, searches for the cookie ${prefix}-${name}. Otherwise, searches for any match by the following order: name, __Secure-name, __Host-name
         * @return {string | undefined} - the value of the cookie or undefined if not found
         */
        get(name: string, prefix?: string): string | undefined;
    }
    class CookieWriter {
        constructor(response: ServerResponse);

        /**
         * Create a cookie with specific options
         * @param {string} name - cookie name
         * @param {string} value - cookie value
         * @param {CookieOptions} opts - cookie options
         */
        create(name: string, value: string, opts?: CookieOptions): string;

        /**
         * Add a cookie to the response
         * @param {string} name - cookie name
         * @param {string} value - cookie value
         * @param {CookieOptions} opts - cookie options
         */
        add(name: string, value: string, opts?: CookieOptions): void;

        /**
         * Expire a specific cookie
         * @param {string} name - cookie name
         * @param {CookieOptions} options - cookie options
         */
        expire(name: string, options?: CookieOptions): void;
    }

    type CookieOptions = {
        session?: boolean;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'Lax' | 'Strict' | 'None';
        domain?: string;
        path?: string;
        expires?: string;
        prefix?: string;
        maxAge?: number;
    };

    class BodyParser {
        /**
         * Retrieves multipart data from a request.
         * @param request The http incoming request.
         * @param size The maximum size of the expected payload.
         * @return A promise that resolves with a list of MultipartItem.
         */
        static getMultipart(request: IncomingMessage, size: number): Promise<MultipartItem[]>;
    }

    /**
     * Multipart item.
     */
    type MultipartItem = {
        isFile: boolean;
        filename: string;
        paramName: string;
        value: Buffer;
        headers: Record<string, string>;
        contentType: string;
    }

    interface FileReadOptions {
        encoding?: BufferEncoding;
        flag?: fs.OpenMode;
    }

    interface ETag {
        validator?: Function;
        generator?: Function;
    }

    interface ServeFileOptions {
        ifModifiedSince?: string;
        compression?: 'br' | 'gzip' | 'none';
        root?: string;
        headers?: object;
        enableTravers?: boolean;
        localCache?: boolean;
        readOptions?: FileReadOptions;
        etag?: ETag;
    }

    class FileServer {
        static bufferToBrotli(buff: Buffer): Promise<Buffer>;
        static bufferToGzip(buff: Buffer): Promise<Buffer>;
        static serveFile(filePath: string, response: ServerResponse, options?: ServeFileOptions, req?: IncomingMessage): Promise<void>;
        static getMimeTypeByName(filename: string): string;
    }
}