# Welcome to wudu-server

This is a lightweight backend framework for NodeJS.

Pros
- ES6
- Modular
- Convenient approach to backend logic and flow
- Impact on performance: close to none!
- Plug-n-play: no dependencies required
- No compilers, transpilers or processors - WYSIWYG

Cons
- Requires basic understanding of backend programming

# Prerequisites

- NodeJS >= 15.3.0
- NPM

# Installation

```shell
npm i wudu-server
```

# Create Simple Server

## Suggested project structure
    Project directory
     ├ client
     |  ┖ index.html
     ├ server
     |  ┖ endpoints
     |     ┖ IndexEndpoint.js
     ┕ index.js

## Code
**index.js**

```javascript
import {App, Router, Server} from 'wudu-server';
import IndexEndpoint from "./server/endpoints/IndexEndpoint.js";

// create new application
let app = new App();

// assign router to your app
app.router = Router.handler;

// add endpoint to your router
Router.addEndpoints(IndexEndpoint);

// run your app as a server
app.runServer({
    protocol: Server.HTTP,
    port: 80
});
```

**server/endpoints/IndexEndpoint.js**
```javascript
export default class IndexEndpoint {
    static ['GET /'] (req, res) {
        res.file('./client/index.html', {ifModifiedSince: req.headers['if-modified-since']});
    }
}
```

**client/index.html**
```html
<!DOCTYPE html>
<html>
<head></head>
<body>Hello, world!</body>
</html>
```

### HTTPS
You can start an HTTPS server by replacing the corresponding code in  **index.js** by the following:
```js
// run your app as a server
app.runServer({
    protocol: Server.HTTPS,
    port: 443,
    options: { // corresponds to native NodeJS https config
        key: fs.readFileSync('PATH_TO_KEY'),
        cert: fs.readFileSync('PATH_TO_CERT'),
        ...
    }
});
```

## Run
```shell
node index.js
```

## [CHANGELOG](https://github.com/md5login/wudu-server/-/blob/master/CHANGELOG.md)

## [DOCUMENTATION](https://github.com/md5login/wudu-server/-/blob/master/DOCS.md)

## Bugs and Issues
Feel free to open bugs, issues or suggest improvements [here](https://github.com/md5login/wudu-server/issues).