"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const EventEmitter = require("events");
const parser = require("body-parser");
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
const win = require("./lib/logger");
let app = express();
let server = http_1.createServer(app);
let io = socketIo(server);
class packetManager {
    constructor(_socket) {
        this.socket = _socket;
        this._data = {};
    }
    // if content : setter, if not : getter
    data(content) {
        if (!content) {
            return this._data;
        }
        this._data = content;
    }
}
function startServer(port = 5000) {
    let emitterServer = new EventEmitter();
    app.use(parser.json);
    server.listen(port, () => {
        console.log('Running server on port %s', port);
    });
    app.post('/pushConstraints', function (req, res) {
        let jsonRequest = req.body;
        let data = jsonRequest.data;
        win.logger.log('INFO', `Json data receive ${req.body}`);
        emitterServer.emit('findByExpress', data);
        emitterServer.on('expressSucceed', (results) => {
        });
        res.send('Hello World!');
    });
    io.on('connection', (socket) => {
        let packet = new packetManager(socket);
        console.log('Connected client on port %s.', port);
        socket.on('pushConstraints', (msg) => {
            packet.data(msg.data);
            emitterServer.emit('findBySocket', packet);
        });
    });
    return emitterServer;
}
exports.startServer = startServer;
// packet for socket connection, data for express conenction
function push(type, packet, data) {
    let msg = { 'type': type != null ? 'Results' : 'other',
        'value': type,
        'data': packet ? packet.data() : data ? data : null
    };
}
exports.push = push;
