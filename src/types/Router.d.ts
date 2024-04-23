import { IncomingMessage, ServerResponse } from "http";
import { ServeFileOptions } from "./FileServer";

export interface RouteApiObject {
  static?: boolean;
  handler?: Function; 
  fnName?: string;
  urlLength?: number;
  fileOptions: ServeFileOptions;
}

export type RouteHandler = (req: IncomingMessage, res: ServerResponse) => any;
export type RoutePipe = (req: IncomingMessage, res: ServerResponse, arg: string) => boolean;
export type GlobalRoutePipe = (req: IncomingMessage, res: ServerResponse) => boolean;

export declare class Router { 
    static handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
    static handleStatic(req: IncomingMessage, res: ServerResponse, opts?: RouteApiObject): Promise<void>;
    static addPipe(name: string, handler: RoutePipe): void; 
    static addGlobalPipe(handler: GlobalRoutePipe): void;
    static addEndpoints(...endpoints: any[]): void;
    static serveStatic(paths?: string[], opts?: any): void;
}