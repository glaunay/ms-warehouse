/*
	Client of the warehouse.
	Manage the socket connection from another micro-service request
*/
// Required packages
import EventEmitter = require('events');
import io = require('socket.io-client')
// Required modules
import * as types from './types/index';
import win = require('./lib/logger');

/*
* function push that send a message inside the socket connection to the warehouse server
* @constraints : constraints send to the warehouse for checking.
* #socket : socket client connection on adress.
* #msg : message passed inside the socket connection, using the messageBuilder fonction
*/
export function push(constraints: types.jobConstr){
	let emitter : EventEmitter = new EventEmitter();
	let socket = io.connect("http://localhost:3125");
	let msg = messageBuilder(constraints, 'pushConstraints');

	socket.on('connect', function() {
		socket.emit('pushConstraints', msg)
	})
	.on('resultsConstraints', (messageResults: types.msg) =>{
		win.logger.log('DEBUG', `Message receive from server \n ${JSON.stringify(messageResults)}`)
		if (messageResults.type === 'find'){
			// ??? What is the response????
		}
		if (messageResults.type === 'notFind'){

		}
		if (messageResults.type === 'error'){

		}
	})
}

/*
* function messageBuilder create a message from constraints and event type
* @constraints : constraints we want to be checked
* @event : event type 
*/
function messageBuilder(constraints: types.jobConstr , event?: string){
	let message = {	'type' : 'Request',
				'value' : event,
				'data' : constraints
	}
	win.logger.log('DEBUG',`Message value before sending: \n ${JSON.stringify(message)}`)
	return message;

}