var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ExerciseSchema = new Schema({
  userid: String,
  description: String,
  duration: Number,
  date: Date
});

var Exercise = mongoose.model('Exercise', ExerciseSchema);

module.exports = Exercise;