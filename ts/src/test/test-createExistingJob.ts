/*
	Socket client test.
	Will check the existence of a job in the warehouse database created by the test-socket.ts file.
*/

// Required packages
import program = require('commander');
// Required modules
import client = require('../wh-client')
import * as types from '../types/index';
import win = require('../lib/logger');

// Commander package part
program
  .option('-v, --verbose <level>', 'Specified the verbose level (debug, info, success, warning, error, critical)') 
  .parse(process.argv);

if (program.verbose){
	let upper: string = program.verbose.toUpperCase();		// change loglevel string into upper case (to match logger specifications)
	if (win.levels.hasOwnProperty(upper)){
		win.logger.level = upper;
	}
	else {
		win.logger.log('WARNING', `No key ${upper} found in logger.levels. Using the default INFO level`);
	}
} 

// constraints for existing job (created by test-socket.ts file)
let constraints: types.jobConstr = {
	"coreScript" : "61d743a3-6371-4830-b1ca-15db6fbbb02c",
	"inputs" : {
		"file1.inp" : "aaf4d3b5-e5a3-44a3-8bc5-bde61fad671a",
		"file2.inp" : "b01ba442-be19-4c45-b6a6-345e0ffb6230"
	}
}

/*
* function createJobByExpress that will check if job already exist inside the coiuchDB database before creating it.
* @constraints : constraints we want to check
*/
function createJobBySocket(constraints: types.jobConstr){
	client.pushConstraints(constraints);
}


createJobBySocket(constraints);
