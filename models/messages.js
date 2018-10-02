var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var MessagesSchema = new mongoose.Schema({
    content : {
      type: String
    },
    from: {
      type: String
    },
    to: {
      type: String
    },
    datetime: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Number,
      default: 0
    }
  });


var Messages = mongoose.model('Messages', MessagesSchema);

module.exports = Messages;