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

### HTTPS
Use can start an HTTPS server by replacing the corresponding code in  **index.js** by the following:
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
This class extends `http.IncomingMessage` with some additional functionality.
```javascript
class Request extends http.IncomingMessage
```

### .MAX_PAYLOAD_SIZE
Static property that limits payload size for requests with a payload. Default is 8388608 - 8MB.
>**Important!** Overriding this value will affect all requests.

### .cookies
An interface to read cookies. See `Request.cookies` section under **Cookie Management**.

### .body()
Get the payload body as a `Buffer` asynchronously.
#### Syntax
```js
await req.body(size = Request.MAX_PAYLOAD_SIZE);
```
#### Example
```js
class DataEndpoint {
    static async ['PUT /new-user'] (req, res) {
        let userData = await req.body();
        ...
    }
}
```
#### Exceptions
- Content-Length is larger than `size` (throws 'too large')
- Buffer grows larger than `size` (throws 'too large')

### .json()
Get the payload body and parse it into an object asynchronously.
#### Syntax
```js
await req.json(size = Request.MAX_PAYLOAD_SIZE);
```
#### Example
```js
class DataEndpoint {
    static async ['PUT /new-data'] (req, res) {
        let userObj = await req.json();
        ...
    }
}
```
#### Exceptions
- Content-Length is larger than `size` (throws 'too large')
- Buffer grows larger than `size` (throws 'too large')

### .map()
Get the payload body and parse it into an object by given separator and delimiter asynchronously. Defaults are: `sep = '&'`, `del = '='`, `size = Request.MAX_PAYLOAD_SIZE`
#### Syntax
```js
await req.map(sep = '&', del = '=', size = Request.MAX_PAYLOAD_SIZE);
```
#### Example
```js
class DataEndpoint {
    static async ['POST /data'] (req, res) {
        // given that the payload is 'foo=bar&answer=42'
        let userObj = await req.map();
        userObj === {
            foo: 'bar',
            answer: '42'
        };
        ...
    }
}
```
#### Exceptions
- Content-Length is larger than `size` (throws 'too large')
- Buffer grows larger than `size` (throws 'too large')

### .multipart()
Gets the payload body and tries to parse into an array of multipart objects asynchronously.
#### Syntax
```js
await req.multipart(size = Request.MAX_PAYLOAD_SIZE);
```
#### Example
```js
class UploadEndpoint {
    static async ['PUT /upload'] (req, res) {
        let userObj = await req.multipart();
        userObj === [{
            isFile: true || false,
            filename: 'string', // name of a file
            paramName: 'string', // parameter name in payload
            headers: {}, // map of the headers in payload item
            values: Buffer, // the payload buffer
            contentType: 'string' // shortcut to headers['content-type']
        }, ...];
    }
}
```
#### Exceptions
- The Content-Type header is not multipart/form-data; (throws 'wrong content type')
- Content-Length is larger than `size` (throws 'too large')
- Buffer grows larger than `size` (throws 'too large')

## Response
This class extends `http.ServerResponse` with some additional functionality.

### .cookies
An interface to write cookies. See `Response.cookies` section under **Cookie Management**.

### .file()
Respond with a file, while corresponding MIME type is sent automatically.
#### Syntax
```js
res.file(pathToFile, options = {});
```

#### Example
```js
class MainEndpoint {
    static ['GET /favicon.ico'] (req, res) {
        let options = {
            // if present, 304 will be returned for file that didn't change since the given date
            // 200 otherwise
            isModifiedSince: Date.toUTCString(),
            // whether to compress the response or not
            compression: 'none|gzip|br'
        };
        res.file('./favicon.png', options);
    }
}
```
### .html(), .text()
Respond with a string, having the content type set automatically. Default encoding is UTF-8.
#### Syntax
```js
res.html(str, encoding = 'utf8');
res.text(str, encoding = 'utf8');
```

#### Example
```js
class MainEndpoint {
    static ['GET /'] (req, res) {
        res.html('<html></html>'); // responds with Content-Type: text/html
    }
    static ['GET /greet'] (req, res) {
        res.text('Hello, friend!'); // responds with Content-Type: text/plain
    }
}
```

### .json()
Respond with a stringified object. Default encoding is UTF-8.
#### Syntax
```js
res.json(obj, encoding = 'utf8');
```
#### Example
```js
class MainEndpoint {
    static ['GET /data'] (req, res) {
        res.json({foo: 'bar', answer: 42}); // responds with Content-Type: application/json
    }
}
```

>**Important!** Each of the methods above end the response by calling `res.end()` with according arguments.

## Router

A singleton that allows to add routing to your server.

### .handler()
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

### .serveStatic()
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

### .addEndpoints()
Add custom endpoint classes to handle requests.
#### Syntax
```javascript
Router.addEndpoints(EndpointClass1[, EndpointClass2[, ...]]);
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
## Namespacing
### General
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
### Inheritance
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
### Constraints
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

## Defining an Endpoint

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

## Cookie Management
Both `Request` and `Response` instances have the `.cookies` property which is an interface to manage cookies.

`Request.cookies` is an interface to read the request's cookies, while `Response.cookies` is an interface to write cookies.
These interfaces are created only on explicit access, so you don't have to worry about performance: unless you explicitly access `req.cookies` no cookies are parsed.

### Example
```js
class UserEndpoint {
    static ['GET /session'] (req, res) {
        if (req.cookies.get('user')) {
            ...
        }
    }
    static ['POST /login'] (req, res) {
        ...
        res.cookies.add('user', userData, {prefix: 'host'});
    }
}
```

## Request.cookies
An interface to read cookies. Parses cookies on explicit access (one time only). All parsed cookies have their names and values URI-decoded.

### Request.cookies.get()
Gets a cookie by its name and prefix (optional, default `''`). If the prefix is empty, looks for a cookie by the following order: `cookieName || '__Secure-' + cookieName || '__Host-' + cookieName`.
If prefix is not `'none'`, nor an empty string, will look for the exact match of `prefix + '-' + cookieName`.
To strictly match the plain name, use `prefix = 'none'`. For any case previously described, if cookie is not found, `undefined` is returned.
#### Syntax
```js
req.cookies.get(cookieName, prefix = '');
```

#### Example
Suppose we have the next cookies set:
```shell
__Host-data=something_very_important; Path=/; Secure
user=user_data
__Secure-user=secured_user_data; Secure;
-x-app-test=test123
```
```js
// will return 'user_data'
req.cookies.get('user'); 

// will return 'something_very_important'
req.cookies.get('data');

// will return undefined
req.cookies.get('data', 'none');

// will return 'test123'
req.cookies.get('app-test', '-x') === req.cookies.get('-x-app-test', 'none');
```

### Request.cookies.getAll()
Returns an object containing all the cookies in the request
#### Syntax
```js
req.cookies.getAll();
```
#### Example
Suppose we have the cookies from the previous example.
```js
req.cookies.getAll() === {
    '__Host-data': 'something_very_important',
    '__Secure-user': 'secured_user_data',
    'user': 'user_data',
    '-x-app-test': 'test123'
}
```

## Response.cookies
An interface to write cookies

### Cookie Configuration
To better understand the cookie configuration object, please read about [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie), [SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite).
```js
let configuration = {
    httpOnly: true || false, // HttpOnly flag; default false
    secure: true || false, // Secure flag; default false
    maxAge: Number(), // Max-Age; default 0
    expires: Date.toUTCString(), // Expires; default ''
    path: 'string', // Path; default ''
    domain: 'string', // Domain; default ''
    sameSite: 'Lax|Strict|None', // default 'Lax'
    prefix: 'host|secure|any', // default ''
    session: true || false // if true, maxAge and expires are omitted
};
```

While all the configuration properties are straightforward, the `prefix` property should draw some special attention:
```js
// this will add '-x-' to the cookie name
configuration.prefix = '-x';

// this will create a '__Host-' prefix with all the required properties redefined automatically:
// for better understanding, read https://tools.ietf.org/html/draft-west-cookie-prefixes-05
configuration.prefix = 'host';

// this will create a '__Secure-' prefix accordingly:
configuration.prefix = 'secure';
```


### Request.cookies.create()
Creates a new cookie string from given arguments
#### Syntax
```js
res.cookies.create(cookieName, value, configuration = {});
```
#### Example
```js
let c1 = res.cookies.create('user', 'user_data', {prefix: '-x'});
c1 === '-x-user=user_data';

let c2 = res.cookies.create('user', 'secured_user_data', {predix: 'secure'});
c2 === '__Secure-user=secured-user-data; Secure';

let c3 = res.cookies.create('user', 'data', {
    domain: 'example.com',
    secure: true,
    path: '/user',
    expires: 'Thu, 10 Jan 2021 00:00:00 GMT',
    sameSite: 'Strict'
});
c3 === 'user=data; Secure; Expires=Thu, 10 Jan 2021 00:00:00 GMT; Path=/user; Domain=example.com; SameSite=Strict'
```

### Request.cookies.add()
Creates a new cookie, taking the same arguments as `cookies.create()` and adds it to the response cookies stack. All the added cookies will be written on `res.end()`. Multiple cookies can be added to a single response.

#### Syntax
```js
res.cookies.add(cookieName, value, configuration = {});
```

#### Example
```js
// creates and stores the cookie '__Host-user=secured_data; Secure; Path=/':
res.cookies.add('user', 'secured_data', {prefix: 'host'});
// creates and stores the cookie 'user=data; HttpOnly':
res.cookies.add('user', 'data', {httpOnly: true});
// previously added cookies are written to the response head here:
res.end();
```

### Request.cookies.expire()
Creates an 'expired' cookie, making the client delete it. If given, the `prefix` parameters must follow cookie configuration rules for `prefix` property. As with `cookies.add()`, the expired cookie is added to cookies stack and written on `res.end()`.

#### Syntax
```js
res.cookies.expire(cookieName, prefix = '');
```

#### Example
```js
// adds '-x-user=; Expires=Thu, 01 Jan 1970 00:00:00 GMT' cookie to cookie stack:
res.cookies.expire('user', '-x');
// adds '__Host-user=; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT' cookie to cookie stack:
res.cookies.expire('user', 'host');
// previously added cookies are written to the response head here:
res.end();
```

# TODOs

Can't wait
- Server-side html rendering support

Can wait
- Support for WEBSOCKET protocol
- Cache-Control and ETag support