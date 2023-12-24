// userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model('User', userSchema, 'time-tracking-login'); // Der dritte Parameter ist der Name der Collection in MongoDB

module.exports = User;
