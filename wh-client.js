"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    Client of the warehouse.
    Manage the socket connection from another micro-service request
*/
// Required packages
const EventEmitter = require("events");
const io = require("socket.io-client");
const win = require("./lib/logger");
/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
function push(constraints) {
    let emitter = new EventEmitter();
    let socket = io.connect("http://localhost:3125");
    let msg = messageBuilder(constraints, 'pushConstraints');
    socket.on('connect', function () {
        socket.emit('pushConstraints', msg);
    })
        .on('resultsConstraints', (messageResults) => {
        win.logger.log('DEBUG', `Message receive from server \n ${JSON.stringify(messageResults)}`);
        if (messageResults.type === 'find') {
            // ??? What is the response????
        }
        if (messageResults.type === 'notFind') {
        }
        if (messageResults.type === 'error') {
        }
    });
}
exports.push = push;
/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type
*/
function messageBuilder(constraints, event) {
    let message = { 'type': 'Request',
        'value': event,
        'data': constraints
    };
    win.logger.log('DEBUG', `Message value before sending: \n ${JSON.stringify(message)}`);
    return message;
}
