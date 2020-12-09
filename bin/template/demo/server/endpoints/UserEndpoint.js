import ApiEndpoint from "./ApiEndpoint.js";

export default class UserEndpoint extends ApiEndpoint {
    static namespace = '/user';
    static ['GET /userdata/:userId/:location/:position accessLevel:user'] (req, res) {
        res.json(req.params);
    }
}