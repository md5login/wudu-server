export class CookieReader {
    #cookies = {};

    constructor (cookieHeader) {
        if (!cookieHeader) return;
        let cookies = cookieHeader.trim().split(';');
        for (let cookie of cookies) {
            let [name, value] = cookie.split('=');
            this.#cookies[decodeURIComponent(name.trim())] = decodeURIComponent(value.trim());
        }
    }

    getAll () {
        return {...this.#cookies};
    }

    get (name, prefix = '') {
        if (!prefix) return this.#cookies[`${name}`] || this.#cookies[`__Secure-${name}`] || this.#cookies[`__Host-${name}`];
        if (prefix === 'none') return this.#cookies[name];
        return this.#cookies[`${prefix}-${name}`];
    }
}

export class CookieWriter {
    #response;

    constructor (response) {
        this.#response = response;
    }

    create (name, value, conf) {
        conf = {...conf};
        if (conf.prefix) {
            switch (conf.prefix) {
                case 'host':
                    name = `__Host-${name}`;
                    conf.domain = '';
                    conf.path = '/';
                    conf.secure = true;
                    break;
                case 'secure':
                    name = `__Secure-${name}`;
                    conf.secure = true;
                    break;
                default:
                    name = `${conf.prefix}-${name}`;
            }
        }
        if (!conf.sameSite) conf.sameSite = 'Lax';
        if (conf.session) {
            conf.maxAge = 0;
            conf.expires = 0;
        }
        if (conf.sameSite === 'None') {
            conf.secure = true;
        }
        let cookie = [];
        cookie.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
        if (conf.secure) cookie.push('Secure');
        if (conf.expires) cookie.push(`Expires=${conf.expires}`);
        if (conf.maxAge) cookie.push(`Max-Age=${conf.maxAge}`);
        if (conf.path) cookie.push(`Path=${conf.path}`);
        if (conf.domain) cookie.push(`Domain=${conf.domain}`);
        if (conf.httpOnly) cookie.push(`HttpOnly`);
        if (conf.sameSite) cookie.push(`SameSite=${conf.sameSite}`);
        return cookie.join('; ');
    }

    add (name, value, conf = {}) {
        let cookie = this.create(name, value, conf);
        let existing = this.#response.getHeader('Set-Cookie');
        if (typeof existing === 'string') existing = [existing];
        else if (!existing) existing = [];
        existing.push(cookie);
        this.#response.setHeader('Set-Cookie', existing);
    }

    expire (cookieName, prefix = '') {
        this.add(cookieName, '', {prefix, expires: 'Thu, 01 Jan 1970 00:00:00 GMT'});
    }
}