var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var User = require('./models/user');
var Messages = require('./models/messages');

var cookieParser = require('cookie-parser');

app.use(cookieParser());

//connect to MongoDB
mongoose.connect('mongodb://localhost/testForAuth');
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
});

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//use sessions for tracking logins
app.use(session({
  secret: 'this is a secret',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// serve static files from template
app.use(express.static(__dirname + '/views'));

// include routes
var routes = require('./router');
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

io.on('connection', function(socket){
  io.to(socket.id).emit('init', socket.id);
  socket.on('chat message', function(data){
    var dataMsg = {
      msg: data.msg,
      from: data.current
    }
    User.find({username: data.selected}).exec(function(err,user){
      if (err) console.log(err);
      io.to(user[0].usrId).emit('chat message', dataMsg);
    });
  });
});

//io.on('disconnect', function(){
//  app.use(function (req, res, next) {
//    req.body.userId = "";
//  });
//});


// listen on port 3000
http.listen(3000, function () {
  console.log('Listening on port 3000');
});
