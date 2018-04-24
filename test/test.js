"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
// import program = require('commander');
const jsonfile = require("jsonfile");
const EventEmitter = require("events");
// // Required modules
// import client = require('../wh-client');
const index = require("../index");
const logger_1 = require("../lib/logger");
// Commander package part
// program
//   .option('-v, --verbosity <logLevel>', 'Set log level (debug, info, success, warning, error, critical)', setLogLevel)
//   .option('-i, --index', 'Run indexation of cache directories')
//   .option('-r, --research','Find constraints into the database')
//   .option('-e, --express', 'Select Express connection')
//   .parse(process.argv);
// Load dumping file to database
function startTests() {
    let emitter = new EventEmitter();
    let file = jsonfile.readFileSync('./data.json');
    index.storeJob(file.docs).on('storeDone', () => {
        emitter.emit('loadDumping');
    })
        .on('storeError', (err) => {
        logger_1.logger.log('error', `Load dumping from ./data.json failed \n ${err}`);
    });
    return emitter;
}
exports.startTests = startTests;
