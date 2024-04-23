export declare class CookieReader {
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