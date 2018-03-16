// Required packages
import EventEmitter = require('events');
import parser = require('body-parser')
import { createServer, Server } from 'http';
import express = require('express');
import socketIo = require('socket.io');
// Required modules
import * as types from './types/index';
import win = require('./lib/logger');
import main = require('./index');




let app : express.Application = express();
let server : Server = createServer(app);
let io : SocketIO.Server = socketIo(server);


class packetManager {

	socket: types.objMap;
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


export function startServer(port: number = 5000) : EventEmitter{
	let emitterServer : EventEmitter = new EventEmitter();
	app.use(parser.json);

	server.listen(port, () => {
		console.log('Running server on port %s', port);
	});

	app.post('/pushConstraints', function (req: any, res:any) {
		let jsonRequest : types.msg = req.body;
		let data: types.jobConstr = jsonRequest.data;

		win.logger.log('INFO', `Json data receive ${req.body}`)
		emitterServer.emit('findByExpress', data);

		emitterServer.on('expressSucceed', (results) => {

		})

		res.send('Hello World!');
	});

	io.on('connection', (socket: any) => {
		let packet: packetManager = new packetManager(socket);

		console.log('Connected client on port %s.', port);
		socket.on('pushConstraints', (msg: types.msg) => {

			packet.data(msg.data)
			emitterServer.emit('findBySocket', packet);
		})
	})

	return emitterServer;
}

// packet for socket connection, data for express conenction
export function push(type: string, packet?: packetManager, data?: any){

	let msg = {	'type' : type != null ? 'Results' : 'other',
				'value' : type,
				'data' : packet ? packet.data() : data ? data : null
	}

	

}


