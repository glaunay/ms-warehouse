/*
	Express client test.
	Will be connectec directly to the server by giving some constraints through the url.
*/

// Required packages
import program = require('commander');
import request = require('request');
// Required modules
import * as types from '../types/index';
import { logger, setLogLevel } from '../lib/logger';

program
  .option("-a, --address <address>", "Warehouse address")
  .option("-p, --port <port>", "Warehouse socket port")
  .option("-v, --verbosity <logLevel>", "Set log level (debug, info, success, warning, error, critical)", setLogLevel)
  .parse(process.argv);

logger.log('info',"\t\t***** Starting Express connections tests *****\n");

let paramBuild: types.clientConfig = {
	"warehouseAddress": program.address ? program.address : "localhost",
	"portSocket": program.port ? Number.isInteger(Number(program.port)) ? Number(program.port) : 7687 : 7687
}

let urlExpress : string = `http://${paramBuild.warehouseAddress}:${paramBuild.portSocket}`

// constraints for testing
let constraints : types.jobSerialConstraints = {
	"script": null, "scriptHash": "e50328c5-dc7f-445d-a5ef-449f4c4b9425",
	"inputHash": {
		"file1.inp": "5e2599cd-a22d-4c79-b5cb-4a6fd6291349"
	},
}

let jobID_Test : types.jobSerialInterface = {
	"workDir": "/My/Path/To/Work/Directory",
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
function createJobByExpress (constraints : types.jobSerialConstraints) : void {
	request({
		url: `${urlExpress}/pushConstraints`,
		method: 'POST',
		body: constraints,
		json: true
	}, function (error : any, response : any, body : any) {
		logger.log('info', `Message receive from server (check constraints)\n ${JSON.stringify(body)}`)
	});
}

/*
* function onJobComp that simulate a completed job that we want to store into the couchDB database
* @data : data to store
*/
function onJobComp (data : types.jobSerialInterface) : void {
	request({
		url: `${urlExpress}/storeJob`,
		method: 'POST',
		body: jobID_Test,
		json: true
	}, function(error: any, response:any, body:any){
		logger.log('info', `Message receive from server (add job request) \n ${JSON.stringify(body)}`)
	});
}


createJobByExpress(constraints);
onJobComp(jobID_Test);