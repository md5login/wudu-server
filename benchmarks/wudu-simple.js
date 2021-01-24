import { App, Router, Server } from 'wudu-server';

const app = new App();

app.router = Router.handler;
Router.addEndpoints(class {
    static ['GET /'] (req, res) {
        res.json({hello: 'world'});
    }
});

app.runServer({
    protocol: Server.HTTP,
    port: 3000
});