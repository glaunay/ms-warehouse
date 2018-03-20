/*
	Client of the warehouse.
	Manage the socket connection from another micro-service request
*/
// Required packages
//import EventEmitter = require('events');
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
export function pushConstraints(constraints: types.jobConstr){
	//let emitterConstraints : EventEmitter = new EventEmitter();
	let socket = io.connect(urlSocket);
	//let socketConstraints = io.connect(main.urlSocket);
	let msg = messageBuilder(constraints, 'pushConstraints');

	socket.on('connect', function() {
		socket.emit('pushConstraints', msg);
	})
	.on('resultsConstraints', (messageResults: types.msg) => {
		win.logger.log('INFO', `Message receive from server (check constraints) \n ${JSON.stringify(messageResults)}`);
		if (messageResults.type === 'find'){
			// ??? What is the response????
		}
		if (messageResults.type === 'notFind'){

		}
		if (messageResults.type === 'error'){

		}
	})

}

export function storeJob(jobCompleted: types.jobID){
	let socketStoreJob = io.connect(urlSocket);
	let msg = messageBuilder(jobCompleted, 'storeJob', true);

	socketStoreJob.on('connect', function() {
		socketStoreJob.emit('storeJob', msg);
	})
	.on('addingResponse', (messageRes: types.msg) => {
		win.logger.log('INFO', `Message receive from server (add job request) \n ${JSON.stringify(messageRes)}`);
		if (messageRes.type === 'success'){

		}
		if (messageRes.type === 'errorAddjob'){

		}
	})
}

/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type 
*/
function messageBuilder(data: types.jobConstr | types.jobID , event: string, store: boolean = false){
	let message = {	'type' : store ? 'Store' : 'Request',
				'value' : event,
				'data' : data
	}
	win.logger.log('DEBUG',`Message value before sending: \n ${JSON.stringify(message)}`)
	return message;

}