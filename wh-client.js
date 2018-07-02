"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    Client of the warehouse.
    Manage the socket connection from another micro-service request
*/
// Required packages
const EventEmitter = require("events");
const pathExists = require("path-exists");
const config = require('./config.json');
const io = require("socket.io-client");
const path = require("path");
const logger_1 = require("./lib/logger");
let emetTest = new EventEmitter();
let portSocket = config.portSocket;
let addressWarehouse = config.warehouseAddress;
let urlSocket = `http://${addressWarehouse}:${portSocket}`;
// export interface jobFootprint {
//     workDir: string,
//     exportVar? : cType.stringMap,
//     scriptHash: string,
//     inputHash? : cType.stringMap
// }
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
        console.log('-----------------------------------------------------');
        console.log(JSON.stringify(messageResults));
        console.log('-----------------------------------------------------');
        // add condition for the existence of workDir?
        //if (obj1.hasOwnProperty('workDir')) console.log('toto')
        if (messageResults.value === 'found') {
            let workPath = messageResults.data[0].workDir;
            fStdout_fSterr_Check(workPath).on('checkOK', (nameOut, nameErr) => {
                emitterConstraints.emit('foundDocs', nameOut, nameErr, workPath);
            })
                .on('checkNotOK', () => {
                emitterConstraints.emit('notFoundDocs');
            });
        }
        ;
        if (messageResults.value === 'notFound')
            emitterConstraints.emit('notFoundDocs', messageResults);
        if (messageResults.value === 'errorConstraints')
            emitterConstraints.emit('errorDocs', messageResults);
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
        logger_1.logger.log('success', `Job footprint stored in Warehouse`);
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
