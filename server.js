// MEP
// Katawut Chuasiripattana

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var bcrypt = require('bcrypt');
const saltRounds = 10;

var jwt = require('jsonwebtoken');

var passport = require('passport');
var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// MongoDB
var mongoClient = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/MEP';
var db;
mongoClient.connect(url, function(err, database){
  if (err) console.log('Error, cannot connect to MongoDB');
  else {
    console.log('MongoDB connected');
  }
  db = database;
});

// set listening port
var port = 3000;

var app = express();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// View Engine
// use plain html and angular js
app.use(express.static('views'))
app.engine('html', require('ejs').renderFile);

app.get('/getExamDB', function(req, res){
  db.collection("MEP").findOne({ExamID : 'Onet-P06'}, function(err, docs) {
      console.log("Getting data from db");
      console.log(docs);
      console.log('Cookies: ', req.cookies)
      res.json(docs);
    })
});

app.get('/ONetM3', function(req, res){
  db.collection('MEP').findOne({"TestID" : "ONET-M3-Math-005"}, function(err, docs) {
    res.json(docs);
  })
});


/* To test check answer with the server \
   Onet-P06
 */
app.post('/submitAnswer', function(req, res) {

  db.collection("MEP").findOne({AnswerID : 'Onet-P06'}, function(err, docs) {
      if (docs.Answer[0].answer === req.body.answer) {
        res.json({result:'Correct ',
                  explanation: docs.Answer[0].explanation});
      }
      else res.json({result:'Wrong ',
                     explanation: docs.Answer[0].explanation});
  });

});

app.post('/view1', function(req, res) {
  console.log("Data posted from Post");
  console.log(req.body.desc);
  console.log(req.body.title);
  console.log(req.body.answer);
  res.send('Post request received from Express view1');
})

app.post('/signUp', function(req, res) {
  console.log('Sign up post reach the server')
  console.log(req.body.name);
  console.log(req.body.email);
  console.log(req.body.password);

  plainPassword = req.body.password;

  // use bcrypt to hash and store password
  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(plainPassword, salt);

  // connect to the DB
  db.collection('users').insert({userName: req.body.name,
                                 userEMail: req.body.email,
                                 userHashedPassword: hash});

  res.json('We received the submitted sign up.');
})

// JWT Strategy
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
opts.secretOrKey = 'secret';

var strategy = new JwtStrategy(opts, function(jwt_payload, next) {
   console.log('payload received', jwt_payload);

   //var query = {userEMail: jwt_payload.id};

   var query = {userName: jwt_payload.id};

   db.collection('users').findOne(query, function(err, result) {
     if (result) {
       next(null, result);
     } else {
       next(null, false);
     }
   });
});

passport.use(strategy);

// Use Passport with jwt strategy for Log In
app.post('/logIn', function(req, res) {
  console.log('Log in post reach the server')
  console.log(req.body.email);
  console.log(req.body.password);

  var query = {userEMail: req.body.email};
  var loginSuccess;

  // connect to the DB
  db.collection('users').findOne(query, function(err, result) {
    if (err) throw err;
    console.log(result);

    var hashedPassword = result.userHashedPassword;

    bcrypt.compare(req.body.password, hashedPassword, function(err, pass) {
    // pass == true
    console.log(pass);
      if (pass) {
      console.log('You are successfully logged in.');

      var payload = { id: result.userName };
      var token = jwt.sign(payload, opts.secretOrKey);

      res.json({user: result.userName,
                userID: result._id,
                token: token,
                message: 'login success'});
      } else {
      console.log('The password provided is incorrect.');
      res.json({message: 'login fail'});
      }
    });
  });
});

app.get('/jwtAuthorized', passport.authenticate('jwt', {session: false}), function(req, res) {
  res.json('From JWT Authorization');
});

app.get('/dashboard/:userID', passport.authenticate('jwt', {session: false}), function(req, res) {
  // refactor to use userID
  console.log('Dashboard: ' + req.params.userID);

  // require ObjectID function for express
  db.collection('users').findOne({_id : ObjectID(req.params.userID)}, function(err, docs) {
    if (err) res.json(err);
    else {
      res.json(docs);
    }
  })
});

// register user test session in the DB
app.post('/testSessionRegister/:userID/:testID/:testStartAt',
         passport.authenticate('jwt', {session: false}), function(req, res) {

           console.log(req.params.userID);
           console.log(req.params.testID);
           console.log(Date.now());

           db.collection('userTestSession').insert({userID: req.params.userID,
                                                    testID: req.params.testID,
                                                    testStartAt: req.params.testStartAt});

           res.json('Post test session returns ...');
})

app.get('/test/:testID/question/:questionNo',
        passport.authenticate('jwt', {session: false}),
        function(req, res) {
          console.log(req.params.testID);
          console.log(req.params.questionNo);

          db.collection('unSubTestContent').findOne({TestID: req.params.testID,
                                                     QuestionNumber: req.params.questionNo},
                                                     function(err, docs) {
            if (err) res.json(err);
            else {
              console.log(docs);
              res.json(docs);
            }
    })
})

app.post('/checkAnswerTutorialMode',
          passport.authenticate('jwt', {session: false}),
          function(req, res) {

  // Use post data to retrieve Solution from the DB to check the answer and response back

  var userID = req.body.userID;
  var solutionID = req.body.TestID;
  var testStartAt = req.body.testStartAt;
  var questionNo = req.body.QuestionNumber;
  var userAnswer = req.body.Answer;

  var solution;
  var explanation;

  // Retrieve Solution from the DB
  db.collection('unSubSolContent').findOne({SolutionID: solutionID,
                                            SolQuestionNumber: questionNo},
                                            function (err, docs) {
    if (err) throw err;
    else {
      console.log(docs);
    }
    solution = docs.Solution;
    explanation = docs.Explanation;

    /** Record user Test result in the DB somewhere here
      * 1. score and count score
      * 2. cumulative score
      * 3. time spent on the question
      * 4. use collection 'userTestResult'
      */

    if (userAnswer == solution) {

      db.collection('userTestResult').insert({userID: req.body.userID,
                                              testID: req.body.TestID,
                                              testStartAt: req.body.testStartAt,
                                              questionStartAt: req.body.currentQuestionStartAt,
                                              questionFinishAt: req.body.currentQuestionFinishAt,
                                              questionNo: req.body.QuestionNumber,
                                              userAnswer:req.body.Answer,
                                              result: 'correct'});

      res.json({result: 'Correct',
                explanation: docs.Explanation});
    }
    else {

      db.collection('userTestResult').insert({userID: req.body.userID,
                                              testID: req.body.TestID,
                                              testStartAt: req.body.testStartAt,
                                              questionStartAt: req.body.currentQuestionStartAt,
                                              questionFinishAt: req.body.currentQuestionFinishAt,
                                              questionNo: req.body.QuestionNumber,
                                              userAnswer:req.body.Answer,
                                              result: 'in-correct'});

      res.json({result: 'InCorrect',
                explanation: docs.Explanation});
    }
  });
})

// To get the Test Header
app.get('/testHeader/:testID', passport.authenticate('jwt', {session: false}),
          function(req, res) {

  console.log(req.params.testID);

  db.collection('unSubTestHeader').findOne({TestID: req.params.testID},
                                          function(err, docs) {
    if (err) console.log(err)
    else {
      console.log(docs);
      res.json(docs);
    }
  })
});

// Get test summary
app.get('/getTestSummary/:userID/:testID/:testStartAt', passport.authenticate('jwt', {session: false}),
          function (req, res) {
  db.collection('userTestResult').find({userID: req.params.userID,
                                        testID: req.params.testID,
                                        testStartAt: req.params.testStartAt}).toArray(function(err, docs) {
    if (err) throw err;
    else {
      console.log(docs);
      res.json(docs);
    }
  })
})

app.get('/reviewTest/:testID/:questionNo', passport.authenticate('jwt', {session: false}),
function (req, res) {
            console.log(req.params.testID);
            console.log(req.params.questionNo);
            console.log('Review received at server');
            res.json('Send back the review');
})

app.listen(port, function(){
	console.log('Server starts on port '+ port);
});
