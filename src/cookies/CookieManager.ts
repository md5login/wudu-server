import type {ServerResponse} from 'http';

type CookieOptions = {
    /**
     * If true, zeros "maxAge" and "expires"
     */
    session?: boolean;
    httpOnly?: boolean;
    secure?: boolean;
    /**
     * Default: "Lax"
     */
    sameSite?: 'Lax' | 'Strict' | 'None';
    domain?: string;
    path?: string;
    expires?: string;
    /**
     * A prefix to add before the cookie name. E.g. the prefix "-x" with the name "domain" will return cookie name "-x-domain"
     */
    prefix?: string;
    maxAge?: number;
}

export class CookieReader {
    #cookies: Record<string, string> = {};

    /**
     * @param {string} cookieHeader
     */
    constructor (cookieHeader?: string) {
        if (!cookieHeader) return;
        let cookies = cookieHeader.trim().split(';');
        for (let cookie of cookies) {
            let [name, value] = cookie.split('=');
            this.#cookies[decodeURIComponent(name.trim())] = decodeURIComponent(value.trim());
        }
    }

    /**
     *
     * @return {object} - an object containing all the parsed cookies
     */
    getAll (): Record<string, string> {
        return {...this.#cookies};
    }

    /**
     * @param {string} name
     * @param {string} [prefix] - if given, searches for the cookie ${prefix}-${name}. Otherwise, searches for any match by the following order: name, __Secure-name, __Host-name
     * @return {string|undefined}
     */
    get (name: string, prefix?: string): string | undefined {
        if (!prefix) return this.#cookies[`${name}`] || this.#cookies[`__Secure-${name}`] || this.#cookies[`__Host-${name}`];
        if (prefix === 'none') return this.#cookies[name];
        return this.#cookies[`${prefix}-${name}`];
    }
}

export class CookieWriter {
    #response;

    constructor (response: ServerResponse) {
        this.#response = response;
    }

    create (name: string, value: string, opts: CookieOptions = {}): string {
        opts = {...opts};
        if (opts.prefix) {
            switch (opts.prefix) {
                case '__Host':
                    name = `__Host-${name}`;
                    opts.domain = '';
                    opts.path = '/';
                    opts.secure = true;
                    break;
                case '__Secure':
                    name = `__Secure-${name}`;
                    opts.secure = true;
                    break;
                default:
                    name = `${opts.prefix}-${name}`;
            }
        }
        if (!opts.sameSite) opts.sameSite = 'Lax';
        if (opts.session) {
            opts.maxAge = 0;
            opts.expires = '';
        }
        if (opts.sameSite === 'None') {
            opts.secure = true;
        }
        let cookie = [];
        cookie.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
        if (opts.secure) cookie.push('Secure');
        if (opts.expires) cookie.push(`Expires=${opts.expires}`);
        if (opts.maxAge) cookie.push(`Max-Age=${opts.maxAge}`);
        if (opts.path) cookie.push(`Path=${opts.path}`);
        if (opts.domain) cookie.push(`Domain=${opts.domain}`);
        if (opts.httpOnly) cookie.push(`HttpOnly`);
        if (opts.sameSite) cookie.push(`SameSite=${opts.sameSite}`);
        return cookie.join('; ');
    }

    add (name: string, value: string, opts: CookieOptions = {}) {
        let cookie = this.create(name, value, opts);
        const header = this.#response.getHeader('Set-Cookie');
        let existing: string[] = [];
        if (header) {
            existing = Array.isArray(header) ? header : [header + ''];
        }
        existing.push(cookie);
        this.#response.setHeader('Set-Cookie', existing);
    }

    /**
     * @param {string} name - the name of the cookie to expire
     * @param {CookieOptions} [options] - the "expires" option will be overridden inside this method
     */
    expire (name: string, options: CookieOptions = {}) {
        this.add(name, '', {...options, expires: 'Thu, 01 Jan 1970 00:00:00 GMT'});
    }
}