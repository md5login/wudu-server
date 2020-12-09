export default class IndexEndpoint {
    static ['GET /'] (req, res) {
        res.html(`
<!DOCTYPE html>
<html>
<head>
    <title>{{appName}}</title>    
</head>
    <body>Welcome to {{appName}}</body>        
</html>
        `);
    }
}