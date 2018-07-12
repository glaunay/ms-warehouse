/*
	Client of the warehouse.
	Manage the socket connection from another micro-service request
*/
// Required packages
import EventEmitter = require('events');
import jsonfile = require('jsonfile');
import pathExists = require('path-exists');
const config = require('../data/config-client.json')
import io = require('socket.io-client');
import path = require('path');
// Required modules
import * as types from './types/index';
import { logger, setLogLevel } from './lib/logger';

let emetTest: EventEmitter = new EventEmitter();

let portSocket: number;
let addressWarehouse: string;
let urlSocket: string;

/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
export function pushConstraints (constraints : types.jobSerialConstraints, param: types.clientConfig = config) : EventEmitter {
	let emitterConstraints : EventEmitter = new EventEmitter();
	portSocket = param.portSocket;
	addressWarehouse = param.warehouseAddress;
	urlSocket = `http://${addressWarehouse}:${portSocket}`;
	
	handshake(param).then(() => {
		logger.log('info', `Connection with Warehouse server succeed, starting communication...\n`);
		let socket = io.connect(urlSocket);
		let msg = messageBuilder(constraints, 'pushConstraints');
		socket.on('connect', function() {
			socket.emit('pushConstraints', msg);
		})
		.on('resultsConstraints', (messageResults: types.msg) => {
			if (messageResults.value === 'found') {
				logger.log('info', `Job trace found in Warehouse`);
				logger.log('debug', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);
				let workPath = messageResults.data[0].workDir;
				fStdout_fSterr_Check(workPath).on('checkOK', (nameOut: string, nameErr: string) => {
					logger.log('success', `Found ${messageResults.data.length} jobs traces`)
					emitterConstraints.emit('foundDocs', nameOut, nameErr, workPath);
				})
				.on('checkNotOK', () => {
					emitterConstraints.emit('notFoundDocs')
				})
			};

			if (messageResults.value === 'notFound') {
				logger.log('info', `Job trace not found in Warehouse`);
				logger.log('debug', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);
				emitterConstraints.emit('notFoundDocs', messageResults);
			}
			if (messageResults.value === 'errorConstraints') emitterConstraints.emit('errorDocs', messageResults);
		})
	})
	.catch(() => {
        logger.log('warn', `Connection with Warehouse server cannot be establish, disconnecting socket...\n`);
        emitterConstraints.emit('cantConnect');
    })

	return emitterConstraints;
}

// rename jobCompleted -> storeDone
export function storeJob (jobCompleted : any) : EventEmitter {

	// if jobCompleted is jobFootPrint
	let emitterStore : EventEmitter = new EventEmitter();
	let socketStoreJob = io.connect(urlSocket);
	let msg = messageBuilder(jobCompleted, 'storeJob', true);

	socketStoreJob.on('connect', function() {
		socketStoreJob.emit('storeJob', msg);
	})
	.on('addingResponse', (messageRes: types.msg) => {
		logger.log('info', `Job footprint stored in Warehouse`)
		//logger.log('info', `Message receive from server (add job request) \n ${JSON.stringify(messageRes)}`);
		logger.log('debug', `Message returned: \n ${JSON.stringify(messageRes)}`);
		
		if (messageRes.value === 'success') emitterStore.emit('addSuccess', messageRes);
		if (messageRes.value === 'errorAddjob') emitterStore.emit('addError', messageRes);
	})
	return emitterStore;
}



export function indexationRequest (pathArray : string[]) : EventEmitter {
	let emitterIndexation : EventEmitter = new EventEmitter();
	let socketIndexation = io.connect(urlSocket);
	let msg = messageBuilder(pathArray, 'indexation', false, true)

	socketIndexation.on('connect', function() {
		socketIndexation.emit('indexation', msg);
	})
	.on('indexationResponse', (messageIndex: types.msg) => {
		if (messageIndex.value === 'indexSuccess') emitterIndexation.emit('indexOK');
		if (messageIndex.value === 'indexFailed') emitterIndexation.emit('indexError');
	})

	return emitterIndexation;
}


/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type 
*/
function messageBuilder (data : types.jobSerialConstraints | types.jobSerialInterface , event : string, store : boolean = false, index : boolean = false) {
	let message = {	'type' : store ? 'store' : index ? 'indexation' :  'request',
				'value' : event,
				'data' : data
	}
	logger.log('debug',`Message value before sending: \n ${JSON.stringify(message)}`)
	return message;

}

// function fStdout_fSterr_Check require a workDir. This function will first extract the repositery of a job with a split.addJob.
// And then construct two file path (output file et error file)
// Next we use the path-exists package which allows us to check if those two file path exist in the file system.
// If both are found in the file system we emit the event 'checkOK', and we can returned them to the jobmanager micro-service.
// The path-exists package use the fs access method to return a boolean, with promises in asynchronous way.
// path.basename extract th end of a path, use there to extract the name of the repository that contain output file and error file.
function fStdout_fSterr_Check (workDir: string) : EventEmitter {
	let emitterCheck : EventEmitter = new EventEmitter();
	let splitWorkDir: string[] = workDir.split('/');

	let nameOut: string = path.basename(workDir) + ".out";
	let nameErr: string = path.basename(workDir) + ".err";
	let pathOut: string = workDir + "/" + nameOut;
	let pathErr: string = workDir + "/" + nameErr;

	pathExists(pathOut).then(existsOut => {
		if (existsOut) {
			pathExists(pathErr).then(existsErr => {
				if (existsErr) {
					emitterCheck.emit('checkOK', nameOut, nameErr);
				}
				else emitterCheck.emit('checkNotOK');
    		})
    		.catch(err => {
    			emitterCheck.emit('checkNotOK');
    		})
		}
		else emitterCheck.emit('checkNotOK');
    	
	})
	.catch(err => {
		emitterCheck.emit('checkNotOK');
	});

	return emitterCheck;
}

// Function handshake that test if the connection with the Warehouse micro-service is available
export function handshake (param: types.clientConfig): Promise<any> {

	return new Promise ((resolve, reject) => {

		if (types.isClientConfig(param)){
			logger.log('info', `Client config paramaters perfectly loaded`);
			logger.log('debug', `Config file content: \n ${JSON.stringify(param)}`)
			
			let socket = io.connect(urlSocket);
			
			socket.on('connect', function() {
				resolve();
			})
			.on('connect_error', function() {
				reject();
				socket.disconnect() 
			})
		}
		else {
			logger.log('error', `Config file not in good format \n ${JSON.stringify(config)}`);
			reject();
	}
	})
}





