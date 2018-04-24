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
const logger_1 = require("./lib/logger");
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
exports.startServerExpress = function (port) {
    app.use(parser.json({ limit: 1024102420, type: 'application/json' }));
    app.use(parser.urlencoded({ limit: 1024102420, extended: true, parameterLimit: 50000, type: 'application/x-www-form-urlencoded' }));
    // route /pushConstraints that request constraints check in couchDB database
    app.post('/pushConstraints', function (req, res) {
        let msgExpress = {
            'type': 'request',
            'value': 'express',
            'data': {}
        };
        logger_1.logger.log('debug', `Json data receive from '/pushConstraints' \n ${JSON.stringify(req.body)}`);
        // calling constraintsCall func from index.ts with req.body content and express string
        main.constraintsCall(req.body, 'express').on('expressSucceed', (results) => {
            // multiple assignation to message properties
            [msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'find', results];
            res.send(msgExpress);
        })
            .on('expressNoResults', (noResults) => {
            [msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'notfind', noResults];
            res.send(msgExpress);
        })
            .on('expressFailed', (error) => {
            [msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'error', error];
            res.send(msgExpress);
        });
    });
    // route /storeJob that request adding a complete job in the couchDB database
    app.post('/storeJob', function (req, res) {
        let msgExpress = {
            'type': 'request',
            'value': 'express',
            'data': {}
        };
        // let bulkArray = arraySplit(req.body);
        // console.log(bulkArray[500].length)
        logger_1.logger.log('debug', `Json data receive from '/storeJob' \n ${JSON.stringify(req.body)}`);
        //console.log(req.body.length);
        main.storeJob(req.body).on('storeDone', () => {
            [msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
            res.send(msgExpress);
        })
            .on('storeError', (docsAddFailed) => {
            [msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', docsAddFailed];
            res.send(msgExpress);
        })
            .on('curlError', (err) => {
            [msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
            res.send(msgExpress);
        });
        // 	bulkArray.forEach(function(elem){
        // 	 main.storeJob(req.body).on('storeDone', () => {
        // 		[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
        // 		res.send(msgExpress);
        // 	})
        // 	.on('storeError', (docsAddFailed) => {
        // 		[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', docsAddFailed];
        // 		res.send(msgExpress);
        // 	})
        // 	.on('curlError', (err) => {
        // 		[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
        // 		res.send(msgExpress);
        // 	})
        // })
        // })
        // main.storeJob(req.body).on('storeDone', () => {
        // 	[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
        // 	res.send(msgExpress);
        // })
        // .on('storeError', (docsAddFailed) => {
        // 	[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', docsAddFailed];
        // 	res.send(msgExpress);
        // })
        // .on('curlError', (err) => {
        // 	[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
        // 	res.send(msgExpress);
        // })
    });
    // Listening express on port
    app.listen(port, () => {
        logger_1.logger.log('info', `Running server on port ${port} for HTTP connections`);
    });
};
/*
* function startServerSocket that manage socket connections to the warehouse.
* @port : socket connection listening on this port, default is 3125.
* #packet : packetManager object, store socket and data informations.
*/
exports.startServerSocket = function (port) {
    let emitterSocket = new EventEmitter();
    io.listen(port);
    logger_1.logger.log('info', `Running server on port ${port} for Socket connections`);
    // on socket connection
    io.on('connection', (socket) => {
        let packet = new packetManager(socket);
        logger_1.logger.log('debug', `Client connected on port ${port}`);
        socket.on('pushConstraints', (msgConst) => {
            packet.data(msgConst.data);
            emitterSocket.emit('findBySocket', packet);
        })
            .on('storeJob', (msgStore) => {
            packet.data(msgStore.data);
            emitterSocket.emit('jobToStore', packet);
        })
            .on('indexation', (msgIndex) => {
            packet.data(msgIndex.data);
            emitterSocket.emit('indexRequest', packet);
        });
    });
    return emitterSocket;
};
/* function push that return a message inside the socket connection to the client.
* @type : define the type of the event that occured inside the warehouse microservice
* @packet : accept the packet as second argument and retriev only the data
*/
function push(type, packet) {
    let msg = { 'type': type != null ? 'results' : 'other',
        'value': type,
        'data': packet.data()
    };
    // emit unique event once the constraints request is done from the couchDB. returning results to client
    if (type === 'find' || type === 'notFind' || type === 'errorConstraints')
        packet.socket.emit('resultsConstraints', msg);
    if (type === 'success' || type === 'errorAddJob' || type === 'curlError')
        packet.socket.emit('addingResponse', msg);
    if (type === 'indexSuccess' || type === 'indexFailed')
        packet.socket.emit('indexationResponse', msg);
}
exports.push = push;
// function arraySplit(arrayToSplit: types.jobSerialInterface[]): types.jobSerialInterface[][]{
// 	let array: types.jobSerialInterface[][] = splitArray(arrayToSplit, 200);
// 	// console.log(array[0])
// 	// console.log(array[0].length)
// 	return array;
// }
