/*
	Server of the warehouse.
	This server can accept two differents types of connections:
		- express with routes,
		- socket.io
*/

// Required packages
import EventEmitter = require('events');
import parser = require('body-parser');
import { createServer, Server } from 'http';
import express = require('express');
import socketIo = require('socket.io');

// Required modules
import * as types from './types/index';
import {logger, setLogLevel} from './lib/logger';
import main = require('./index');

// Initiate express and socket types
let app : express.Application = express();
let server : Server = createServer(app);
let io : SocketIO.Server = socketIo(server);

/* PacketManager class.
* This class will construct an object that contain socket information and data that pass inside the connection
* #this.socket : contains all sockets informations.
* #this._data : data receive from the socket client
*/
class packetManager {

	socket: any;
	_data: types.objMap;	
	constructor(_socket: types.objMap){
		this.socket = _socket;
		this._data = {};
	}
	// if content : setter, if not : getter
	data(content?: types.objMap) {
		if (!content){
			return this._data;
		}
		this._data = content;
	}
}

/*
* function startServerExpress that manage express connections to the warehouse.
* @port : express connection listening on this port, default is 3124.
* #msgExpress : message that will be returned once the request is done. Data contains the request result.
* #req.body : correspond to the json passed by the url from the client to this server.
* #res.send : correspond to the response from the server to the request of the client
*/
export let startServerExpress = function(port: number) : void{
	app.use(parser.json({limit:1024102420, type:'application/json'}));
	app.use(parser.urlencoded({limit: 1024102420, extended: true, parameterLimit:50000, type:'application/x-www-form-urlencoded'}));

	// route /pushConstraints that request constraints check in couchDB database
	app.post('/pushConstraints', function (req: any, res:any) {

		let msgExpress: types.msg = {
			'type' : 'request',
			'value' : 'express',
			'data' : {}
		}

		logger.log('debug', `Json data receive from '/pushConstraints' \n ${JSON.stringify(req.body)}`)
		
		// calling constraintsCall func from index.ts with req.body content and express string
		main.constraintsCall(req.body, 'express').on('expressSucceed', (results) => {
			// multiple assignation to message properties
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'find', results]
			res.send(msgExpress);
		})
		.on('expressNoResults', (noResults) => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'notfind', noResults]
			res.send(msgExpress);
		})
		.on('expressFailed', (error) => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'error', error]
			res.send(msgExpress);
		})
	})
	
	// route /storeJob that request adding a complete job in the couchDB database
	app.post('/storeJob', function (req: any, res: any) {
		let msgExpress: types.msg = {
			'type' : 'request',
			'value' : 'express',
			'data' : {}
		}
		// let bulkArray = arraySplit(req.body);
		// console.log(bulkArray[500].length)
		logger.log('debug', `Json data receive from '/storeJob' \n ${JSON.stringify(req.body)}`);
		//console.log(req.body.length);

		main.storeJob(req.body).on('storeDone', () => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
			res.send(msgExpress);
		})
		.on('storeError', (docsAddFailed) => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', docsAddFailed];
			res.send(msgExpress);
		})
		.on('curlError', (err) => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
			res.send(msgExpress);
		})
			
		
	
	// 	bulkArray.forEach(function(elem){
	// 	 main.storeJob(req.body).on('storeDone', () => {
	// 		[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
	// 		res.send(msgExpress);
	// 	})
	// 	.on('storeError', (docsAddFailed) => {
	// 		[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', docsAddFailed];
	// 		res.send(msgExpress);
	// 	})
	// 	.on('curlError', (err) => {
	// 		[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
	// 		res.send(msgExpress);
	// 	})
	// })
		// })
		// main.storeJob(req.body).on('storeDone', () => {
		// 	[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
		// 	res.send(msgExpress);
		// })
		// .on('storeError', (docsAddFailed) => {
		// 	[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', docsAddFailed];
		// 	res.send(msgExpress);
		// })
		// .on('curlError', (err) => {
		// 	[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
		// 	res.send(msgExpress);
		// })
		
	})
	// Listening express on port
	app.listen(port, () => {
		logger.log('info', `Running server on port ${port} for HTTP connections`)
	});
}

/*
* function startServerSocket that manage socket connections to the warehouse.
* @port : socket connection listening on this port, default is 3125.
* #packet : packetManager object, store socket and data informations.
*/
export let startServerSocket = function(port: number) : EventEmitter{
	let emitterSocket : EventEmitter = new EventEmitter();
	io.listen(port);
	logger.log('info', `Running server on port ${port} for Socket connections`)
	// on socket connection
	io.on('connection', (socket: any) => {
		let packet: packetManager = new packetManager(socket);
		logger.log('debug', `Client connected on port ${port}`);

		socket.on('pushConstraints', (msgConst: types.msg) => {
			packet.data(msgConst.data);
			emitterSocket.emit('findBySocket', packet);
		})
		.on('storeJob', (msgStore: types.msg) => {
			packet.data(msgStore.data);
			emitterSocket.emit('jobToStore', packet);
		})
		.on('indexation', (msgIndex: types.msg) => {
			packet.data(msgIndex.data);
			emitterSocket.emit('indexRequest', packet);
		})
	})
	return emitterSocket
}

/* function push that return a message inside the socket connection to the client. 
* @type : define the type of the event that occured inside the warehouse microservice
* @packet : accept the packet as second argument and retriev only the data
*/
export function push(type: string, packet: packetManager){

	let msg = {	'type' : type != null ? 'results' : 'other',
				'value' : type,
				'data' : packet.data()
	}
	// emit unique event once the constraints request is done from the couchDB. returning results to client
	if(type === 'find' || type === 'notFind' || type === 'errorConstraints') packet.socket.emit('resultsConstraints', msg);
	if(type === 'success' || type === 'errorAddJob' || type === 'curlError') packet.socket.emit('addingResponse', msg);
	if(type === 'indexSuccess' || type === 'indexFailed') packet.socket.emit('indexationResponse', msg);
}

// function arraySplit(arrayToSplit: types.jobSerialInterface[]): types.jobSerialInterface[][]{
// 	let array: types.jobSerialInterface[][] = splitArray(arrayToSplit, 200);
// 	// console.log(array[0])
// 	// console.log(array[0].length)
// 	return array;
// }




