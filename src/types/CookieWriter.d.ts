import * as http from 'http';

export declare class CookieWriter {
    constructor(response: http.ServerResponse);

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

// CookieOptions Type Definition
export declare type CookieOptions = {
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