// Required packages
import jsonfile = require('jsonfile');
import EventEmitter = require('events');
// // Required modules
import client = require('../wh-client');
import * as index from "../index";
import * as types from '../types/index';
import {spawn} from 'child_process';
import {logger, setLogLevel} from '../lib/logger';


let dataToIndex: string[] = ["./test/cache_Dir_1", "./test/cache_Dir_2", "./test/cache_Dir_3"];

// Imitate a job content that will be insert in database
let dataToAdd: types.jobSerialInterface = {
		"script": "/My/Path/To/My/Script/script.sh",
		"exportVar": { 
			"hexFlags": " -nocuda -ncpu 16 ",
			"hexScript": "/software/mobi/hex/8.1.1/exe/hex8.1.1.x64"
		},
		"modules": [ "naccess", "hex"],
		"tagTask": "hex",
		"scriptHash": "4286ddd9-3fde-4fa4-b542-57980fbaabbe",
		"inputHash": { 
			"file1.inp": "42386c2d-fd44-459c-a94f-d4af29485b4f",
			"file2.inp": "9e63443d-fc8f-49aa-9dc6-a7f8b15f0ceb" 
		}
	}

let dataConstraints: types.jobSerialConstraints = {
	"script": "/My/Path/To/My/Script/script.sh",
	"inputHash": { 
			"file1.inp": "42386c2d-fd44-459c-a94f-d4af29485b4f",
			"file2.inp": "9e63443d-fc8f-49aa-9dc6-a7f8b15f0ceb" 
		}
}


// Load dumping file to database
export function startTests() {
	let emitter: EventEmitter = new EventEmitter();
	logger.log('info', `Starting warehouse microservice tests:\n`)
	logger.log('info', '***********   LOAD DUMP FILE TEST   ***********')
	loadDumpIndexation().on('loadDone',()=> {
		logger.log('info', '***********   CHECK CONSTRAINTS TEST   ***********');
		checkConstraints(dataConstraints).on('checkFail',() => {
			logger.log('info', '***********   ADDING JOB TEST   ***********');
			addJob(dataToAdd).on('addDone', () => {
				logger.log('info', '***********   DATABASE DUMP TEST   ***********')
				dumpDatabase().on('dumpOK', () => {
					emitter.emit('allTestsDone');
				})
			});
		});
	})

	return emitter;
}


// Start indexation
function loadDumpIndexation(): EventEmitter {
	let emitterDumpLoad: EventEmitter = new EventEmitter();
	logger.log('info', `Reading data.json file content...`)

	let file = jsonfile.readFileSync('./test/data.json');

	logger.log('success', '----> OK');
	logger.log('info', `Start loading dump file to database...`)
	index.storeJob(file).on('storeDone', () => {
		logger.log('success', `----> OK \n\n`);
		logger.log('info', '***********     INDEXATION TEST     ***********')
		logger.log('info', `Searching for jobID.json files in... \n ./test/cache_Dir_1  ./test/cache_Dir_2  ./test/cache_Dir_3`)
		index.indexation(dataToIndex).on('indexDone', () => {
			logger.log('success', '----> OK \n\n');
			emitterDumpLoad.emit('loadDone');
		})		
	})
	.on('storeError', (err:any) => {
		logger.log('error', `Load dumping from ./data.json failed \n ${err}`);
	})
	return emitterDumpLoad;
}

// Checking if job exist in database using constraints
function checkConstraints(constraints: types.jobSerialConstraints): EventEmitter{

	let emitterConst : EventEmitter = new EventEmitter();

	logger.log('info',`Looking for constraints in database... \n ${JSON.stringify(dataConstraints)}`)
	index.constraintsCall(constraints, 'test').on('testSucceed', (docsArray: types.objMap[])=> {
		logger.log('info', `${JSON.stringify(docsArray)}`)
		logger.log('success', '----> OK\n\n');
		emitterConst.emit('checkSuccess');
	})
	.on('testNoResults', (docsArray: types.objMap[]) => {
		logger.log('error', '----> NOT OK (As expected)\n\n');
		emitterConst.emit('checkFail')
	})

	return emitterConst;
}

// Add a job into database
function addJob(job: types.jobSerialInterface): EventEmitter{
	let emitterAdd : EventEmitter = new EventEmitter();
	console.log('Dans la fonction addJob')
	logger.log('info', `Inserting jobID to database... \n ${JSON.stringify(dataToAdd)}`);
	index.storeJob(job).on('storeDone', () => {
		logger.log('success', '----> OK\n\n');
		logger.log('info', '***********  CHECK CONSTRAINTS TEST 2  ***********');
		checkConstraints(dataConstraints).on('checkSuccess', () => {
			emitterAdd.emit('addDone');
		})
	});

	return emitterAdd;
}

// Dump database into json file
function dumpDatabase(): EventEmitter{
	let emitterDump: EventEmitter = new EventEmitter();
	let test: boolean = true;

	logger.log('info', `Starting database dumping...`);
	index.dumpingDatabase(test).on('dumpDone', () => {
		logger.log('success', '----> OK\n\n');
		emitterDump.emit('dumpOK');
	})
	return emitterDump;
}


export function cleanDB(addressDB: string, portDB: number, nameDB: string, accountDB: string, passwordDB: string, proxyBool: boolean): EventEmitter{
	let emitterDelete: EventEmitter = new EventEmitter();
	let id: string = "";
	let rev: string = "";


	let dataConstraintsTest: types.jobSerialConstraints = {
		"script": "/My/Path/To/My/Script/script.sh"
	}

	index.constraintsToQuery(dataConstraintsTest).on('docsFound', (data) => {
		let docs: types.jobSerialInterface[] = data.docs;
		for (let [index,elem] of docs.entries()){
			id = elem._id;
			rev = elem._rev;

			deleteDoc(id, rev, addressDB, portDB, nameDB, accountDB, passwordDB, proxyBool);

			if (index === docs.length - 1){
				emitterDelete.emit('deleteDone');
			}
		}
	})

	return emitterDelete;
}

// Remove a single document into database
function deleteDoc(id: string, rev: string, addressDB: string, portDB: number, nameDB: string, accountDB: string, passwordDB: string, proxyBool: boolean ){
	let chunkRes = '';
	let chunkError = '';
	let curl: any;

	if (proxyBool){
		curl = spawn('curl', ['--noproxy',`${addressDB}`, '-X', 'DELETE', `http://${accountDB}:${passwordDB}@${addressDB}:${portDB}/${nameDB}/${id}?rev=${rev}`]);
	}
	else {
		curl = spawn('curl', ['-X', 'DELETE', `http://${accountDB}:${passwordDB}@${addressDB}:${portDB}/${nameDB}/${id}?rev=${rev}`]);
	}
	

	curl.stdout.on('data', (data: any) => {
		chunkRes += data.toString('utf8');
	})

	curl.stderr.on('data', (data: any) => {
		chunkError += data.toString('utf8');
	})

	curl.on('close', (code: any) => {
		logger.log('debug', `Deleting ${id} of ${nameDB} database`);
	})

}

