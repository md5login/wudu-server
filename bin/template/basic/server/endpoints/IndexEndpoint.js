export default class IndexEndpoint {
    static ['GET /'] (req, res) {
        res.file('./client/index.html', {ifModifiedSince: req.headers['if-modified-since']});
    }

    static ['GET /favicon.ico'] (req, res) {
        res.file('./client/favicon.png');
    }
}