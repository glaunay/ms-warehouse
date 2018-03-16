let io = require('socket.io-client');

let socket = io.connect("http://localhost:5000", {reconnect: true});


let msg = {	'type' : 'event',
				'value' : 'event',
				'data' : {"script": null, "coreScript": "7b8459fdb1eee409262251c429c48814",
  "inputs": {
    "file1.inp": "7726e41aaafd85054aa6c9d4747dec7b"
  }}
	}

socket.on('connect', function() {
		socket.emit('pushConstraints', msg)
	})