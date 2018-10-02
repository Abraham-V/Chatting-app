var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var router = express.Router();

app.get('/index', function(req, res){
    res.sendFile(__dirname + '/landing.ejs');
});

io.on('connection', function(socket){
    console.log('connected');
    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
    });
  });


module.exports = router;