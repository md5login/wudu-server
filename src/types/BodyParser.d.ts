import * as http from "http";

declare class BodyParser {
    /**
     * Retrieves multipart data from a request.
     * @param request The http incoming request.
     * @param size The maximum size of the expected payload.
     * @return A promise that resolves with a list of MultipartItem.
     */
    static getMultipart(request: http.IncomingMessage, size: number): Promise<MultipartItem[]>;
}

/**
 * Multipart item.
 */
declare type MultipartItem = {
    isFile: boolean;
    filename: string;
    paramName: string;
    value: Buffer;
    headers: Record<string, string>;
    contentType: string;
}