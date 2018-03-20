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
import win = require('./lib/logger');
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
	app.use(parser.json());
	app.use(parser.urlencoded({ extended: true }));

	// route /pushConstraints that request constraints check in couchDB database
	app.post('/pushConstraints', function (req: any, res:any) {

		let msgExpress: types.msg = {
			'type' : 'Request',
			'value' : 'express',
			'data' : {}
		}

		win.logger.log('DEBUG', `Json data receive from '/pushConstraints' \n ${JSON.stringify(req.body)}`)
		
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
		.on('expressfailed', (error) => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'error', error]
			res.send(msgExpress);
		})
	})
	
	// route /storeJob that request adding a complete job in the couchDB database
	app.post('/storeJob', function (req: any, res: any) {
		let msgExpress: types.msg = {
			'type' : 'Request',
			'value' : 'express',
			'data' : {}
		}

		win.logger.log('DEBUG', `Json data receive from '/storeJob' \n ${JSON.stringify(req.body)}`);

		main.storeJob(req.body).on('storeDone', () => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', {}];
			res.send(msgExpress);
		})
		.on('storeError', (err) => {
			[msgExpress.type, msgExpress.value, msgExpress.data] = ['results', 'success', err];
			res.send(msgExpress);
		})
	})
	// Listening express on port
	app.listen(port, () => {
		win.logger.log('INFO', `Running server on port ${port} for Express connections`)
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
	win.logger.log('INFO', `Running server on port ${port} for Socket connections`)
	// on socket connection
	io.on('connection', (socket: any) => {
		let packet: packetManager = new packetManager(socket);
		win.logger.log('DEBUG', `Client connected on port ${port}`);

		socket.on('pushConstraints', (msgConst: types.msg) => {
			packet.data(msgConst.data);
			emitterSocket.emit('findBySocket', packet);
		})
		.on('storeJob', (msgStore: types.msg) => {
			packet.data(msgStore.data);
			emitterSocket.emit('jobToStore', packet);
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
	if(type === 'success' || type ==='errorAddJob') packet.socket.emit('addingResponse', msg);
}



