import * as http from 'http';
import net from 'net';
import { CookieReader } from "../cookies/CookieManager.js";
import {MultipartItem} from './BodyParser';

declare class WuduRequest extends http.IncomingMessage {
	static MAX_PAYLOAD_SIZE: number;
	constructor(socket: net.Socket);
	body(size?: number): Promise<Buffer>;
	json(size?: number): Promise<object>;
	multipart(size?: number): Promise<Array<MultipartItem>>;
	map(sep?: string, del?: string, size?: number): Promise<object>;
	toMap(sep?: string, del?: string, size?: number): Promise<object>;
	get cookies(): CookieReader;
}
export = WuduRequest;