"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    Client of the warehouse.
    Manage the socket connection from another micro-service request
*/
// Required packages
const EventEmitter = require("events");
const config = require('./config.json');
const io = require("socket.io-client");
const logger_1 = require("./lib/logger");
let portSocket = config.portSocket;
let addressWarehouse = config.warehouseAddress;
let urlSocket = `http://${addressWarehouse}:${portSocket}`;
//let urlSocket: string = `http://${addressDB}:${portSocket}`
/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
function pushConstraints(constraints) {
    let emitterConstraints = new EventEmitter();
    let socket = io.connect(urlSocket);
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
    return emitterStore;
}
exports.storeJob = storeJob;
function indexationRequest(pathArray) {
    let emitterIndexation = new EventEmitter();
    let socketIndexation = io.connect(urlSocket);
    let msg = messageBuilder(pathArray, 'indexation', false, true);
    socketIndexation.on('connect', function () {
        socketIndexation.emit('indexation', msg);
    })
        .on('indexationResponse', (messageIndex) => {
        if (messageIndex.type === 'indexSuccess')
            emitterIndexation.emit('indexOK');
        if (messageIndex.type === 'indexFailed')
            emitterIndexation.emit('indexError');
    });
    return emitterIndexation;
}
exports.indexationRequest = indexationRequest;
/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type
*/
function messageBuilder(data, event, store = false, index = false) {
    let message = { 'type': store ? 'store' : index ? 'indexation' : 'request',
        'value': event,
        'data': data
    };
    logger_1.logger.log('debug', `Message value before sending: \n ${JSON.stringify(message)}`);
    return message;
}
