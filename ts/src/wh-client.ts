/*
	Client of the warehouse.
	Manage the socket connection from another micro-service request
*/
// Required packages
import EventEmitter = require('events');
import jsonfile = require('jsonfile');
const config = require('./config.json')
import io = require('socket.io-client');
// Required modules
import * as types from './types/index';
import {logger, setLogLevel} from './lib/logger';

let portSocket = config.portSocket
let addressDB = config.databaseAddress
let urlSocket: string = `http://${addressDB}:${portSocket}`

/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
export function pushConstraints(constraints: types.jobSerialConstraints): EventEmitter {
	let emitterConstraints : EventEmitter = new EventEmitter();
	let socket = io.connect(urlSocket);
	//let socketConstraints = io.connect(main.urlSocket);
	let msg = messageBuilder(constraints, 'pushConstraints');

	socket.on('connect', function() {
		socket.emit('pushConstraints', msg);
	})
	.on('resultsConstraints', (messageResults: types.msg) => {
		logger.log('info', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);

		if (messageResults.type === 'find') emitterConstraints.emit('findDocs', messageResults);
		if (messageResults.type === 'notFind') emitterConstraints.emit('notFindDocs', messageResults);
		if (messageResults.type === 'errorConstraints') emitterConstraints.emit('errorDocs', messageResults);
	})
	return emitterConstraints;
}

export function storeJob(jobCompleted: types.jobSerialInterface): EventEmitter{
	let emitterStore : EventEmitter = new EventEmitter();
	let socketStoreJob = io.connect(urlSocket);
	let msg = messageBuilder(jobCompleted, 'storeJob', true);

	socketStoreJob.on('connect', function() {
		socketStoreJob.emit('storeJob', msg);
	})
	.on('addingResponse', (messageRes: types.msg) => {
		logger.log('info', `Message receive from server (add job request) \n ${JSON.stringify(messageRes)}`);
		
		if (messageRes.type === 'success') emitterStore.emit('addSuccess', messageRes);
		if (messageRes.type === 'errorAddjob') emitterStore.emit('addError', messageRes);
	})
	return emitterStore;
}

export function indexationRequest(pathArray: string[]): EventEmitter{
	let emitterIndexation : EventEmitter = new EventEmitter();
	let socketIndexation = io.connect(urlSocket);
	let msg = messageBuilder(pathArray, 'indexation', false, true)

	socketIndexation.on('connect', function() {
		socketIndexation.emit('indexation', msg);
	})
	.on('indexationResponse', (messageIndex: types.msg) => {
		if (messageIndex.type === 'indexSuccess') emitterIndexation.emit('indexOK');
		if (messageIndex.type === 'indexFailed') emitterIndexation.emit('indexError');
	})

	return emitterIndexation;
}


/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type 
*/
function messageBuilder(data: types.jobSerialConstraints | types.jobSerialInterface , event: string, store: boolean = false, index: boolean = false){
	let message = {	'type' : store ? 'store' : index ? 'indexation' :  'request',
				'value' : event,
				'data' : data
	}
	logger.log('debug',`Message value before sending: \n ${JSON.stringify(message)}`)
	return message;

}