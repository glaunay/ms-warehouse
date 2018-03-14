"use strict";
// import express = require('express');
// import server = require('http');
// import io = require('socket.io');
// let app : any= express()
// server.createServer(app)
// io.listen(server)
var app = require('express')(), server = require('http').createServer(app), io = require('socket.io').listen(server);
app.start = app.listen = function () {
    return server.listen.apply(server, arguments);
};
app.start(5000);
app.get('/', function (req, res) {
    res.send('Hello World!');
});
io.on('connection', function (socket) {
    console.log('Client connected');
});
