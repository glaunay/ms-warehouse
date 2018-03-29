/*
	Express client test.
	Will be connectec directly to the server by giving some constraints through the url.
*/

// Required packages
import program = require('commander');
import request = require('request');
// Required modules
import * as types from '../types/index';
import win = require('../lib/logger');

let urlExpress: string = "http://localhost:7687";

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

// constraints for testing
let constraints: types.jobSerialConstraints = {
	"script": null, "scriptHash": "7b8459fdb1eee409262251c429c48814",
	"inputHash": {
		"file1.inp": "7726e41aaafd85054aa6c9d4747dec7b"
	},
}

let jobID_Test: types.jobSerialInterface = {
	"script":"/Users/vreymond/Stage/Projet/ms-warehouse/run_hex.sh",
	"exportVar": {
		"hexFlags":" -nocuda -ncpu 16 ",
		"hexScript":"/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
	},
	"modules": ["naccess","hex"],
	"tagTask":"hex",
	"scriptHash" : "e50328c5-dc7f-445d-a5ef-449f4c4b9425",
	"inputHash" : {
		"file1.inp" : "5e2599cd-a22d-4c79-b5cb-4a6fd6291349"
	}
}

/*
* function createJobByExpress that will check if job already exist inside the coiuchDB database before creating it.
* @constraints : constraints we want to check
*/
function createJobByExpress(constraints: types.jobSerialConstraints){
	request({
		url: `${urlExpress}/pushConstraints`,
		method: 'POST',
		body: constraints,
		json: true
	}, function(error: any, response:any, body:any){
		win.logger.log('INFO', `Message receive from server \n ${JSON.stringify(body)}`)
	});
}

/*
* function onJobComp that simulate a completed job that we want to store into the couchDB database
* @data : data to store
*/
function onJobComp(data: types.jobSerialInterface) {
	request({
		url: `${urlExpress}/storeJob`,
		method: 'POST',
		body: jobID_Test,
		json: true
	}, function(error: any, response:any, body:any){
		win.logger.log('INFO', `Message receive from server \n ${JSON.stringify(body)}`)
	});
}


createJobByExpress(constraints);
onJobComp(jobID_Test);