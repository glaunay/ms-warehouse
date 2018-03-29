/*
	Client of the warehouse.
	Manage the socket connection from another micro-service request
*/
// Required packages
import EventEmitter = require('events');
import io = require('socket.io-client');
// Required modules
import * as types from './types/index';
import win = require('./lib/logger');

let urlSocket: string = "http://localhost:7688";

/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
export function pushConstraints(constraints: types.jobSerialConstraints) : EventEmitter {
	let emitterConstraints : EventEmitter = new EventEmitter();
	let socket = io.connect(urlSocket);
	//let socketConstraints = io.connect(main.urlSocket);
	let msg = messageBuilder(constraints, 'pushConstraints');

	socket.on('connect', function() {
		socket.emit('pushConstraints', msg);
	})
	.on('resultsConstraints', (messageResults: types.msg) => {
		win.logger.log('INFO', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);

		if (messageResults.type === 'find') emitterConstraints.emit('findDocs', messageResults);
		if (messageResults.type === 'notFind') emitterConstraints.emit('notFindDocs', messageResults);
		if (messageResults.type === 'errorConstraints') emitterConstraints.emit('errorDocs', messageResults);
	})
	return emitterConstraints;
}

export function storeJob(jobCompleted: types.jobSerialInterface){
	let emitterStore : EventEmitter = new EventEmitter();
	let socketStoreJob = io.connect(urlSocket);
	let msg = messageBuilder(jobCompleted, 'storeJob', true);

	socketStoreJob.on('connect', function() {
		socketStoreJob.emit('storeJob', msg);
	})
	.on('addingResponse', (messageRes: types.msg) => {
		win.logger.log('INFO', `Message receive from server (add job request) \n ${JSON.stringify(messageRes)}`);
		
		if (messageRes.type === 'success') emitterStore.emit('addSuccess', messageRes);
		if (messageRes.type === 'errorAddjob') emitterStore.emit('addError', messageRes);
	})
}

/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type 
*/
function messageBuilder(data: types.jobSerialConstraints | types.jobSerialInterface , event: string, store: boolean = false){
	let message = {	'type' : store ? 'Store' : 'request',
				'value' : event,
				'data' : data
	}
	win.logger.log('DEBUG',`Message value before sending: \n ${JSON.stringify(message)}`)
	return message;

}