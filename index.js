const http = require('http')
const WebSocket = require('ws');
const webcamFrames = require('./motion-detection-webcam');

// Http Server
var httpServer = http.createServer(function (request, response) {
    if (request.url == '/' && request.method === 'GET') {
        return require('fs').createReadStream('./index.html').pipe(response)
    }
    return response.end('Not found')
}).listen(8080)

// Websocket Server
var socketServer = new WebSocket.Server({ server: httpServer, path: '/ws', perMessageDeflate: false });
socketServer.connectionCount = 0;
socketServer.on('connection', function (socket, upgradeReq) {
    socketServer.connectionCount++;
    console.log(
        'New WebSocket Connection: ',
        (upgradeReq || socket.upgradeReq).socket.remoteAddress,
        (upgradeReq || socket.upgradeReq).headers['user-agent'],
        '(' + socketServer.connectionCount + ' total)'
    );
    socket.on('close', function (code, message) {
        socketServer.connectionCount--;
        console.log(
            'Disconnected WebSocket (' + socketServer.connectionCount + ' total)'
        );
    });
});
socketServer.broadcast = function (data) {
    socketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

webcamFrames(frame => socketServer.broadcast(frame))
