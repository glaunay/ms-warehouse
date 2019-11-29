/*
	Socket client test.
	Will be connected to the warehouse client to create the socket connection.
	Then, the client will send the constraints to the server through the socket connection.
*/

import program = require ("commander");
import client = require('../wh-client');
import * as types from '../types/index';
import { logger, setLogLevel } from '../lib/logger';
client.setLogger(logger);

program
  .option("-a, --address <address>", "Warehouse address")
  .option("-p, --port <port>", "Warehouse socket port")
  .option("-v, --verbosity <logLevel>", "Set log level (debug, info, success, warning, error, critical)", setLogLevel)
  .parse(process.argv);

logger.log('info',"\t\t***** Starting Socket connections tests *****\n");


let paramBuild: types.clientConfig = {
	"warehouseAddress": program.address ? program.address : "localhost",
	"portSocket": program.port ? Number.isInteger(Number(program.port)) ? Number(program.port) : 7688 : 7688
}

// constraints for testing
let constraints : types.jobSerialConstraints = {
	"script": null, "scriptHash": "7b8459fdb1eee409262251c429c48814",
	"inputHash": {
		"file1.inp": "7726e41aaafd85054aa6c9d4747dec7b",
		"file2.inp" : "b01ba442-be19-4c45-b6a6-345e0ffb6230"
	}
}

let jobID_Test : types.jobSerialInterface = {
	"workDir": "/My/Path/To/Work/Directory",
	"script":"/Socket/Connection/Script.sh",
	"exportVar": {
		"hexFlags":" -nocuda -ncpu 16 ",
		"hexScript":"/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
	},
	"modules": ["naccess","hex"],
	"tagTask":"hex",
	"scriptHash" : "7b8459fdb1eee409262251c429c48814",
	"inputHash" : {
		"file1.inp" : "7726e41aaafd85054aa6c9d4747dec7b",
		"file2.inp" : "b01ba442-be19-4c45-b6a6-345e0ffb6230"
	}
}


/*
* function createJobByExpress that will check if job already exist inside the coiuchDB database before creating it.
* @constraints : constraints we want to check
*/
function createJobBySocket (constraints : types.jobSerialConstraints) : void {
	logger.log('info', `Checking job trace in Warehouse from constraints...`);
	logger.log('debug', `Constraints:\n ${JSON.stringify(constraints)}`);
	client.pushConstraints(constraints);
}

/*
* function onJobComp that simulate a completed job that we want to store into the couchDB database
* @data : data to store
* NOT IMPLEMENTED YET
*/
function onJobComp (data : types.jobSerialInterface) : void {
	client.storeJob(jobID_Test)
}

client.handshake(paramBuild).then((bool)=>{
	logger.log('info', `Connection with Warehouse server succeed, starting tests...\n`)
	createJobBySocket(constraints);
	onJobComp(jobID_Test);
})
.catch((bool)=> {
	logger.log('warning', `Connection with Warehouse server cannot be establish, disconnecting socket...\n`)
})


