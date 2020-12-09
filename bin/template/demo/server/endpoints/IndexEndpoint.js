import { Endpoint } from '../../../../../index.js';

export default class IndexEndpoint extends Endpoint {
    static namespace = '/';
    static ['GET /'] (treq, tres) {
        tres.file('client/index.html', {compression: 'br'});
    }

    static ['GET /favicon.ico'] (req, res) {
        res.file('client/favicon.png', {compression: 'br'});
    }

    static ['POST /get-some-data/:id accessLevel:user'] (treq, tres) {}
}