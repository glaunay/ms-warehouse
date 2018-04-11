"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    Client of the warehouse.
    Manage the socket connection from another micro-service request
*/
// Required packages
const EventEmitter = require("events");
//import fs = require('fs');
const jsonfile = require("jsonfile");
const io = require("socket.io-client");
const logger_1 = require("./lib/logger");
let portSocket;
let file = '../config.json';
let config = jsonfile.readFileSync(file);
portSocket = config.portSocket;
let urlSocket = `http://localhost:${portSocket}`;
/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
function pushConstraints(constraints) {
    let emitterConstraints = new EventEmitter();
    let socket = io.connect(urlSocket);
    //let socketConstraints = io.connect(main.urlSocket);
    let msg = messageBuilder(constraints, 'pushConstraints');
    socket.on('connect', function () {
        socket.emit('pushConstraints', msg);
    })
        .on('resultsConstraints', (messageResults) => {
        logger_1.logger.log('info', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);
        if (messageResults.type === 'find')
            emitterConstraints.emit('findDocs', messageResults);
        if (messageResults.type === 'notFind')
            emitterConstraints.emit('notFindDocs', messageResults);
        if (messageResults.type === 'errorConstraints')
            emitterConstraints.emit('errorDocs', messageResults);
    });
    return emitterConstraints;
}
exports.pushConstraints = pushConstraints;
function storeJob(jobCompleted) {
    let emitterStore = new EventEmitter();
    let socketStoreJob = io.connect(urlSocket);
    let msg = messageBuilder(jobCompleted, 'storeJob', true);
    socketStoreJob.on('connect', function () {
        socketStoreJob.emit('storeJob', msg);
    })
        .on('addingResponse', (messageRes) => {
        logger_1.logger.log('info', `Message receive from server (add job request) \n ${JSON.stringify(messageRes)}`);
        if (messageRes.type === 'success')
            emitterStore.emit('addSuccess', messageRes);
        if (messageRes.type === 'errorAddjob')
            emitterStore.emit('addError', messageRes);
    });
}
exports.storeJob = storeJob;
/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type
*/
function messageBuilder(data, event, store = false) {
    let message = { 'type': store ? 'Store' : 'request',
        'value': event,
        'data': data
    };
    logger_1.logger.log('debug', `Message value before sending: \n ${JSON.stringify(message)}`);
    return message;
}
