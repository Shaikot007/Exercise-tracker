require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const shortId = require('shortid');
const moment = require('moment');
const User = require("./models/User");
const Exercise = require("./models/Exercises");

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/projects' || process.env.MLAB_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log("DB Connected"));

mongoose.connection.on("error", err => {
  console.log(`DB connection error: ${err.message}`);
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user", async function (req, res) {
  const user = req.body.username;
  const id = shortId.generate();

  const foundUser = await User.findOne({ "username": user });

  if (foundUser === null) {
    const userSave = new User({
      username: user,
      _id: id
    });

    const createAndSave = await userSave.save();

    res.json({ "username": createAndSave.username, "_id": createAndSave._id });
  }
  else {
    res.json("Username has already taken");
  }
});

app.post("/api/exercise/add", async function (req, res) {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = new Date(req.body.date);

  if (moment(date).isValid() === false) {
    return res.json("Invalid date");
  }

  if (Math.sign(duration) !== 1) {
    return res.json("Invalid duration time");
  }

  const foundUserId = await User.findOne({ "_id": userId });

  if (foundUserId !== null) {
    const exerciseSave = new Exercise({
      userid: userId,
      description: description,
      duration: duration,
      date: date
    });

    const createExercisesAndSave = await exerciseSave.save();

    res.json({
      "username": foundUserId.username,
      "_id": createExercisesAndSave.userid,
      "description": createExercisesAndSave.description,
      "duration": createExercisesAndSave.duration,
      "date": moment(createExercisesAndSave.date).format('dddd MMMM Do YYYY')
    });
  }
  else {
    res.json("Unknown user id");
  }
});

app.get("/api/exercise/log", async function (req, res) {
  const user_id = req.query.userId;
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const limit = parseInt(req.query.limit);

  if (moment(from).isValid() === false || moment(to).isValid() === false) {
    return res.json("Invalid date");
  }

  if (from > to) {
    return res.json("TypeError: Invalid date [&from]");
  }

  if (Math.sign(limit) !== 1) {
    return res.json("Invalid limit value");
  }

  const user = await User.findOne({ _id: user_id });

  const excerices = await Exercise.find({ userid: user_id }).where("date").gte(from).lte(to).limit(limit).exec();

  if (user !== null) {
    res.json({
      "_id": excerices[0].userid,
      "username": user.username,
      "from": moment(from).format('dddd MMMM Do YYYY'),
      "to": moment(to).format('dddd MMMM Do YYYY'),
      "count": excerices.length,
      "log": excerices.map(log => ({
        "description": log.description,
        "duration": log.duration,
        "date": moment(log.date).format('dddd MMMM Do YYYY')
      }))
    });
  }
  else {
    res.json("Unknown user id");
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
