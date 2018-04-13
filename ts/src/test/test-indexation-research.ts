/*
	Indexation test and research.
	Will check the existence of a job in the warehouse database created by the test-socket.ts file.
*/

// Required packages
import program = require('commander');
// Required modules
import client = require('../wh-client')
import * as types from '../types/index';
import {logger, setLogLevel} from '../lib/logger';

// Commander package part
program
  .option('-v, --verbosity <logLevel>', 'Set log level (debug, info, success, warning, error, critical)', setLogLevel)
  .option('-i, --index', 'Run indexation of cache directories')
  .option('-r, --research','Find constraints into the database')
  .option('-e, --express', 'Select Express connection')
  .parse(process.argv);


let dataToIndex: string[] = ["./test/cache_Dir_1", "./test/cache_Dir_2", "./test/cache_Dir_3"];

// if(program.index) {

// }

function indexation(pathArray: string[]): void {
	logger.log('info', 'Starting indexation test')
	client.indexationRequest(pathArray);
}

function research(constraints: types.jobSerialConstraints){
	
}

indexation(dataToIndex);