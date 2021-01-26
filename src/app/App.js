import Server from "../server/Server.js";

export default class App {
    /**
     * @type {RouteHandler}
     */
    #router = (req, res) => {};
    #server;

    /**
     *
     * @param {RouteHandler} router
     */
    set router (router) {
        this.#router = router;
    }

    /**
     * @return {Server}
     */
    get server () {
        return this.#server;
    }

    /**
     *
     * @param {ServerInitParams} initParams
     * @return {Server}
     */
    runServer (initParams) {
        this.#server = new Server({listener: this.#router, ...initParams});
        return this.#server;
    }
}