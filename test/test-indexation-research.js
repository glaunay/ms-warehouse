"use strict";
/*
    Indexation test and research.
    Will check the existence of a job in the warehouse database created by the test-socket.ts file.
*/
Object.defineProperty(exports, "__esModule", { value: true });
// Required packages
const program = require("commander");
// Required modules
const client = require("../wh-client");
const logger_1 = require("../lib/logger");
// Commander package part
program
    .option('-v, --verbosity <logLevel>', 'Set log level (debug, info, success, warning, error, critical)', logger_1.setLogLevel)
    .option('-i, --index', 'Run indexation of cache directories')
    .option('-r, --research', 'Find constraints into the database')
    .option('-e, --express', 'Select Express connection')
    .parse(process.argv);
let dataToIndex = ["./test/cache_Dir_1", "./test/cache_Dir_2", "./test/cache_Dir_3"];
// if(program.index) {
// }
function indexation(pathArray) {
    logger_1.logger.log('info', 'Starting indexation test');
    client.indexationRequest(pathArray);
}
function research(constraints) {
}
indexation(dataToIndex);
