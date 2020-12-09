import Server from "../server/Server.js";

export default class App {
    #router;
    #server;

    set router (value) {
        this.#router = value;
    }

    get server () {
        return this.#server;
    }

    runServer (initParams) {
        this.#server = new Server({listener: this.#router, ...initParams});
        return this.#server;
    }
}