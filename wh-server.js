"use strict";
/*
    Server of the warehouse.
    This server can accept two differents types of connections:
        - express with routes,
        - socket.io
*/
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const EventEmitter = require("events");
const parser = require("body-parser");
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
const win = require("./lib/logger");
const main = require("./index");
// Initiate express and socket types
let app = express();
let server = http_1.createServer(app);
let io = socketIo(server);
/* PacketManager class.
* This class will construct an object that contain socket information and data that pass inside the connection
* #this.socket : contains all sockets informations.
* #this._data : data receive from the socket client
*/
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
/*
* function startServerExpress that manage express connections to the warehouse.
* @port : express connection listening on this port, default is 3124.
* #msgExpress : message that will be returned once the request is done. Data contains the request result.
* #req.body : correspond to the json passed by the url from the client to this server.
* #res.send : correspond to the response from the server to the request of the client
*/
exports.startServerExpress = function (port = 3124) {
    app.use(parser.json());
    app.use(parser.urlencoded({ extended: true }));
    // route /pushConstraints that request constraints check in couchDB database
    app.post('/pushConstraints', function (req, res) {
        let msgExpress = {
            'type': 'Request',
            'value': 'express',
            'data': {}
        };
        win.logger.log('INFO', `Json data receive ${req.body}`);
        // calling constraintsCall func from index.ts with req.body content and express string
        main.constraintsCall(req.body, 'express').on('expressSucceed', (results) => {
            msgExpress.data = results;
            res.send(msgExpress);
        })
            .on('expressNoResults', (noResults) => {
            msgExpress.data = noResults;
            res.send(msgExpress);
        })
            .on('expressfailed', (error) => {
            msgExpress.data = error;
            res.send(msgExpress);
        });
    });
    // Listening express on port
    app.listen(port, () => {
        win.logger.log('INFO', `Running server on port ${port} for Express connections`);
    });
};
/*
* function startServerSocket that manage socket connections to the warehouse.
* @port : socket connection listening on this port, default is 3125.
* #packet : packetManager object, store socket and data informations.
*/
exports.startServerSocket = function (port = 3125) {
    let emitterSocket = new EventEmitter();
    io.listen(port);
    win.logger.log('INFO', `Running server on port ${port} for Socket connections`);
    // on socket connection
    io.on('connection', (socket) => {
        let packet = new packetManager(socket);
        win.logger.log('DEBUG', `Client connected on port ${port}`);
        socket.on('pushConstraints', (msg) => {
            packet.data(msg.data);
            emitterSocket.emit('findBySocket', packet);
        });
    });
    return emitterSocket;
};
/* function push that return a message inside the socket connection to the client.
* @type : define the type of the event that occured inside the warehouse microservice
* @packet : accept the packet as second argument and retriev only the data
*/
function push(type, packet) {
    let msg = { 'type': type != null ? 'Results' : 'other',
        'value': type,
        'data': packet.data()
    };
    // emit unique event once the constraints request is done from the couchDB
    if (type === 'find' || 'notFind' || 'error')
        packet.socket.emit('resultsConstraints', msg);
}
exports.push = push;
