"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
/*
    Client of the warehouse.
    Manage the socket connection from another micro-service request
*/
// Required packages
const EventEmitter = require("events");
const pathExists = require("path-exists");
const config = require('../data/config-client.json');
const io = require("socket.io-client");
const path = require("path");
// Required modules
const types = __importStar(require("./types/index"));
const logger_1 = require("./lib/logger");
let emetTest = new EventEmitter();
let portSocket;
let addressWarehouse;
let urlSocket;
/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
function pushConstraints(constraints, param = config) {
    let emitterConstraints = new EventEmitter();
    let socket = io.connect(urlSocket);
    let msg = messageBuilder(constraints, 'pushConstraints');
    handshake(param).then((bool) => {
        logger_1.logger.log('info', `Connection with Warehouse server succeed, starting communication...\n`);
        socket.on('connect', function () {
            socket.emit('pushConstraints', msg);
        })
            .on('resultsConstraints', (messageResults) => {
            // add condition for the existence of workDir?
            //if (obj1.hasOwnProperty('workDir')) console.log('toto')
            if (messageResults.value === 'found') {
                logger_1.logger.log('info', `Job trace found in Warehouse`);
                logger_1.logger.log('debug', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);
                let workPath = messageResults.data[0].workDir;
                fStdout_fSterr_Check(workPath).on('checkOK', (nameOut, nameErr) => {
                    logger_1.logger.log('success', `Found ${messageResults.data.length} jobs traces`);
                    emitterConstraints.emit('foundDocs', nameOut, nameErr, workPath);
                })
                    .on('checkNotOK', () => {
                    emitterConstraints.emit('notFoundDocs');
                });
            }
            ;
            if (messageResults.value === 'notFound') {
                logger_1.logger.log('info', `Job trace not found in Warehouse`);
                logger_1.logger.log('debug', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);
                emitterConstraints.emit('notFoundDocs', messageResults);
            }
            if (messageResults.value === 'errorConstraints')
                emitterConstraints.emit('errorDocs', messageResults);
        });
    })
        .catch((bool) => {
        logger_1.logger.log('warning', `Connection with Warehouse server cannot be establish, disconnecting socket...\n`);
        emitterConstraints.emit('cantConnect');
    });
    return emitterConstraints;
}
exports.pushConstraints = pushConstraints;
// rename jobCompleted -> storeDone
function storeJob(jobCompleted) {
    // if jobCompleted is jobFootPrint
    let emitterStore = new EventEmitter();
    let socketStoreJob = io.connect(urlSocket);
    let msg = messageBuilder(jobCompleted, 'storeJob', true);
    socketStoreJob.on('connect', function () {
        socketStoreJob.emit('storeJob', msg);
    })
        .on('addingResponse', (messageRes) => {
        logger_1.logger.log('info', `Job footprint stored in Warehouse`);
        //logger.log('info', `Message receive from server (add job request) \n ${JSON.stringify(messageRes)}`);
        logger_1.logger.log('debug', `Message returned: \n ${JSON.stringify(messageRes)}`);
        if (messageRes.value === 'success')
            emitterStore.emit('addSuccess', messageRes);
        if (messageRes.value === 'errorAddjob')
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
        if (messageIndex.value === 'indexSuccess')
            emitterIndexation.emit('indexOK');
        if (messageIndex.value === 'indexFailed')
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
// function fStdout_fSterr_Check require a workDir. This function will first extract the repositery of a job with a split.addJob.
// And then construct two file path (output file et error file)
// Next we use the path-exists package which allows us to check if those two file path exist in the file system.
// If both are found in the file system we emit the event 'checkOK', and we can returned them to the jobmanager micro-service.
// The path-exists package use the fs access method to return a boolean, with promises in asynchronous way.
// path.basename extract th end of a path, use there to extract the name of the repository that contain output file and error file.
function fStdout_fSterr_Check(workDir) {
    let emitterCheck = new EventEmitter();
    let splitWorkDir = workDir.split('/');
    //let extractRepo: string = splitWorkDir[splitWorkDir.length - 1]
    let nameOut = path.basename(workDir) + ".out";
    let nameErr = path.basename(workDir) + ".err";
    let pathOut = workDir + "/" + nameOut;
    let pathErr = workDir + "/" + nameErr;
    pathExists(pathOut).then(existsOut => {
        if (existsOut) {
            pathExists(pathErr).then(existsErr => {
                if (existsErr) {
                    emitterCheck.emit('checkOK', nameOut, nameErr);
                }
                else
                    emitterCheck.emit('checkNotOK');
            })
                .catch(err => {
                emitterCheck.emit('checkNotOK');
            });
        }
        else
            emitterCheck.emit('checkNotOK');
    })
        .catch(err => {
        emitterCheck.emit('checkNotOK');
    });
    return emitterCheck;
}
// Function handshake that test if the connection with the Warehouse micro-service is available
function handshake(param) {
    return new Promise((resolve, reject) => {
        let connectBool = false;
        if (types.isClientConfig(param)) {
            logger_1.logger.log('info', `Client config paramaters perfectly loaded`);
            logger_1.logger.log('debug', `Config file content: \n ${JSON.stringify(param)}`);
            portSocket = param.portSocket;
            addressWarehouse = param.warehouseAddress;
            urlSocket = `http://${addressWarehouse}:${portSocket}`;
            let socket = io.connect(urlSocket);
            socket.on('connect', function () {
                connectBool = true;
                resolve(connectBool);
            })
                .on('connect_error', function () {
                reject(connectBool);
                socket.disconnect();
            });
        }
        else {
            logger_1.logger.log('error', `Config file not in good format \n ${JSON.stringify(config)}`);
            reject(connectBool);
        }
    });
}
exports.handshake = handshake;
