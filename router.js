var express = require('express');
var router = express.Router();
var User = require('./models/user');
var Messages = require('./models/messages');
var async = require('async');
var mongoose = require('mongoose');
var session = require('express-session');
var path = require('path');
var flag = false;


router.use(session({secret: "this is a secret"}));


var cookieParser = require('cookie-parser');

router.use(cookieParser());

// GET route for reading data
router.get('/', function (req, res, next) {
  return res.render(path.join(__dirname + '/views/landing.ejs'));
});


//POST route for updating data
router.post('/', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }

  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf) {

    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConf: req.body.passwordConf,
    }

    User.create(userData, function (error, user) {
      if (error) {
        return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect('/index');
      }
    });

  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        flag = true;
        return res.redirect('/index');
      }
    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
});

// GET route after registering
router.get('/index', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          if (flag) {
            return res.redirect('/index');
          } else {
            return next(err);
          }
        } else {
          User.find({}).exec(function(err, users) { 
            if (err) console.log(err);
            Messages.find({}).exec(function(err, messages) {
              if (err) console.log(err);
              return res.render("index.ejs", {
                current: user.username,
                users: users,
                messages: messages                
              });
            });
        });
      }
    }
  });    
});

router.post('/index', function (req, res, next) {
  var messageData = {
    content: req.body.msg,
    from: req.body.current,
    to: req.body.selected,
    datetime: Date.now(),
    read: false
  }

  Messages.create(messageData);
});

router.post('/index/init', function (req, res) {
  User.updateOne({username: req.body.current}, {usrId: req.body.id}, function(err, res) {
    if (err) console.log(err);
  });
});

router.post('/index/read', function (req, res, next) {
  Messages.updateMany({from: req.body.selected, to: req.body.current, read: 0}, {$set: {read: 1}}, function (err, result) {
    if (err) console.log(error);
    return next();
  });
});

router.post('/index/selection', function (req, res, next) {
  Messages.find({$or:[{from: req.body.current, to: req.body.selected}, {from: req.body.selected, to: req.body.current}]}).exec(function(err, messages) {
    if (err) console.log(err);
    return res.send({selectionMessages: messages});
  });
});


// GET for logout logout
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});


module.exports = router;