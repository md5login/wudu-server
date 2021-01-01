[[_TOC_]]

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

## Run
```shell
node index.js
```

# Documentation

## App
```javascript
const myApp = new App('APP_NAME');
```

### Setting a router
```javascript
// set wudu router or provide your own
// custom router should have a signature of fn (req, res) {}
myApp.router = Router.handler;
```

### Starting a server
```javascript
myApp.runServer(params);
```
See what `params` is under the **Server** section

## Server
A class to start a NodeJS server
```javascript
const server = new Server(params);
```

### params
```javascript
const params = {
    protocol: {Server.HTTP|Server.HTTPS},
    port: Number|3000,
    listener: function (req, res) {},
    options: ServerOptions
};
```

Default `params.options`:
```javascript
let options = {
    IncomingMessage: Request,
    ServerResponse: Response,
    ...params.options
}
```
These options are passed to the corresponding server initializer based on the selected protocol.

## Request
```javascript
class Request extends http.IncomingMessage
```
There are just a few additions to the native `http.IncomingMessage`:
```javascript
const someRequestHandler = async (req, res) => {
    // get payload as Buffer
    const payloadBuffer = await req.body();
    // get pyaload as JSON
    const payloadObject = await req.json();
    // get payload as multipart
    const multipartData = await req.multipart();
}
```

`request.multipart` returns an array of parsed multipart payload items:
```javascript
const multiData = await request.multipart();
// each item relates to a payload block inside payload boundaries
for (let dataItem of multiData) {
    console.log(dataItem.isFile); // a boolean
    console.log(dataItem.filename); // name of the file
    console.log(dataItem.paramName); // parameter name in payload
    console.log(dataItem.headers); // headers object of payload item
    console.log(dataItem.value); // Buffer containing the data passed in payload item
    console.log(data.contentType); // shortcut to headers['content-type']. default: text/plain
}
```

## Response

```javascript
class Response extends http.ServerResponse
```

Additions to the native `http.ServerResponse`:
```javascript
const someRequestHandler = async (req, res) => {
    // respond with string (text/plain)
    res.text('Hello, world!');
    // respond with object (application/javascript)
    res.json({success: 1, data: 'OK'});
    // respond with html (text/html)
    res.html('<div>Hello, world!</div>');
    // respond with file (corresponding mime type is sent automatically
    res.file(pathToFile, options);
}
```

Each of the methods above end the response.

The methods `.json()`, `.html()` and `.text()` accept encoding as second parameter. Default is 'utf8'.

The `.file()` method accepts `options` parameter:
```javascript
let options = {
    // if present, 304 will be returned for file that didn't change since the given date
    // 200 otherwise
    isModifiedSince: Date.toUTCString(),
    // whether to compress the response or not
    compression: 'none|gzip|br'
};
```


## Router

A singleton that allows to add routing to your server.

### Router.handler
Is a static method that handles client requests. 
It can be set on your wudu app or directly as listener in server params:
```javascript
import {App, Server, Router} from 'wudu-server';

const myApp = new App('My Wudu App');

myApp.router = Router.handler; // set app router
// or
myApp.runServer({
    port: 80,
    protocol: Server.HTTP,
    listener: Router.handler
});
// or
const myCustomServer = new Server({
    port: 80,
    protocol: Server.HTTP,
    listener: Router.handler
});
```

### Router.serveStatic
Allows adding static paths to be served automatically.
#### Syntax
```javascript
// default serveStatic options:
let options = {
    ifModifiedSince: '', // corresponds to browser's If-Modified-Since header
    compression: 'none|gzip|br', // by default corresponds to browser's Accept-Encoding header
    enableTraverse: false, // whether to allow '../' in requests,
    root: '' // root dir to serve static files from
};
Router.serveStatic([path1, path2, ...], options);
```
>**Important!** serveStatic has higher priority than custom request handling. Once there is a match for a static path, the response will be sent with corresponding payload. 

```javascript
// [GET] /views/index.html will be served from relative '/views'
Router.serveStatic(['/views', '/js', '/assets']);

// prefixed paths
// [GET] /views/index.html will be server from relative 'client/views'
Router.serveStatic(['/views', '/js', '/assets'], {
    root: 'client'
});
```

### Router.addEndpoints
Add custom endpoint classes to handle requests.
#### Syntax
```javascript
Router.addEndpoints(EndpointClass1, EndpointClass2, ...);
```
#### Example
```javascript
class IndexEndpoint {
    // serve GET request to '/'
    static ['GET /'] (req, res) {
        res.text('Hello, world!');
    }
    
    // serve GET request to '/favicon.ico'
    static ['GET /favicon.ico'] (req, res) {
        res.file('/client/favicon.png');
    }
    
    // serve POST request to /unix-time
    static ['POST /unix-time'] (req, res) {
        res.json({time: Date.now()});
    }
}

Router.addEndpoints(IndexEndpoint);
```

To define a namespace for you routing, add `static namespace = 'MY_NAMESPACE';` to your endpoint class:
```javascript
class UserEndpoint {
    static namespace = '/user';
    // serve POST request to '/user/name'
    static ['POST /name'] (req, res) {
        res.json({name: 'Johny'});
    }
}
```

Namespaces can be inherited:
```javascript
class ApiEndpoint {
    static namespace = '/api';
}

class UserEndpoint extends ApiEndpoint {
    static namespace = '/user';
    // serve POST request to '/api/user/name'
    static ['POST /name'] (req, res) {
        res.json({name: 'Johny'});
    }
}
```

Namespaces must be unique:
```js
class ApiEndpoint {
    static namesapce = '/api';
}

class UserEndpoint extends ApiEndpoint {
    static namespace = '/api'; // not unique - omitted
    // serve GET request to '/api/user'
    static ['GET /user'] (req, res) {}
}
```

### Endpoint Methods Naming Convention
```javascript
class Endpoint {
    static async ['METHOD PATHNAME [PIPE_1[:ARGUMENT][ PIPE_2[:ARGUMENT] [...]]]'] (req, res) {}
}
```

### PATHNAME Parameters
Parts of the pathname can be treated as parameters:

```javascript
class IndexEndpoint {    
    // serve POST request to /unix-time/London/RFC3339
    static ['POST /unix-time/:location/:rfc'] (req, res) {
        res.json({
            time: getTimeByLocation(req.params.location, req.params.rfc)
        });
    }
}
```

### Supporting Async Methods
```javascript
class IndexEndpoint {    
    // serve POST request to /unix-time
    static async ['POST /unix-time/:location'] (req, res) {
        let time = await getTimeByLocation(req.params.location);
        res.json({time});
    }
}
```

### Query Params
```javascript
class IndexEndpoint {
    // serve POST request to /unix-time?location=London&rfc=RFC3339
    static async ['POST /unix-time'] (req, res) {
        let time = await getTimeByLocation(req.query.location, req.query.rfc);
        res.json({time});
    }
}
```

## Routing Pipes

A pipe is a function similar to regular request handler with little difference.
#### Pipe Signature
```javascript
function pipe (req, res, arg) {}
```

>**In order to continue the request flow, pipe function must return true. Otherwise, the request is aborted.**

Let's see an example:
```javascript
const allowAccess = async (req, res, accessLevel) => {
    let userData = await getUserData(req.headers['cookie']);
    if (userData.accessLevel !== accessLevel) {
        res.writeHead(403); // set response status
        res.end('GO AWAY'); // end response
        return false;
    }
    return true;
}

Router.addPipe('allowAccess', allowAccess);

class UserDataEndpoint {
    // POST /user-secret-data -> allowAccess(user) -> this method
    static ['POST /user-secret-data allowAccess:user'] (req, res) {
        ...
    }
}
```

### Chaining Pipes
```javascript
const hasUserCookie = (req, res) => {
    return req.headers['cookie'].includes('my-cookie');
};

const allowAccess = async (req, res, accessLevel) => {
    // do access check
    if (!accessGranted) {
        res.writeHead(403);
        res.end('GO AWAY');
        return false;
    }
    return true;
}

Router.addPipe('allowAccess', allowAccess);
Router.addPipe('hasUserCookie', hasUserCookie);

class UserDataEndpoint {
    // POST /user-secret-data -> hasUserCookie -> allowAccess(user) -> this method
    static ['POST /user-secret-data hasUserCookie allowAccess:user'] (req, res) {
        ...
    }
}
```

## Global Pipes
Global pipe functions are used to make decision before any other request handling. 
They have the highest priority in the request flow and apply to all requests.
**Global pipes execution is not ordered.**

```javascript
const blockPosts = (req, res) => {
    if (req.method === 'POST') {
        res.writeHead(403);
        res.end('Nope');
        return false;
    }
    return true;
};

Router.addGlobalPipe(blockPosts);
```


# TODOs

Can't wait
 - Support for HTTP2 protocol
 - Basic cookie management
 - Server-side html rendering support

Can wait
 - Support for WEBSOCKET protocol
 - Cache-Control and ETag support

Nice to have
 - Dependencies scanner for HTTP2
 - App restart on file changes