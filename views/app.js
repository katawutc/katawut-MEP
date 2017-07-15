var app = angular.module("app", ["ngRoute"]);

app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
      templateUrl : 'main.html'
    })
    .when("/o-net", {
      templateUrl : 'onet.html',
      controller : 'myCtrl'
    })
    .when("/post", {
      templateUrl : 'post.html'
    })
    .when("/O-net-M3-main", {
      templateUrl : 'onet-m3-main.html'
    })
    .when("/O-net-M3", {
      templateUrl : 'onet-m3.html',
      controller : 'ONetM3'
    })
    .when("/O-net-M3-tutorial", {
      templateUrl : 'onet-m3-tutorial.html'
    })
    .when("/signUp", {
      templateUrl : 'signUp.html'
    })
    .when("/logIn", {
      templateUrl : 'logIn.html',
      controller : 'logInCtrl'
    })
    .when("/dashboard/:userID", {
      templateUrl : 'dashboard.html',
      controller :'dashboardCtrl'
    })
    .when("/dashboard", {
      templateUrl : 'dashboard.html',
      controller :'dashboardCtrl'
    })
    .when("/examListPage", {
      templateUrl : 'examListPage.html',
      controller : 'examListPageCtrl'
    })
    .when("/test/:testID", {
      templateUrl : 'testMain.html',
      controller : 'testMain'
    })
    .when("/test/:testID/question/:questionNo", {
      templateUrl : 'testSelectedStart.html',
      controller : 'testSelectedStart'
    })
    .when("/testSummary", {
      templateUrl : 'testSummary.html',
      controller : 'testSummaryController'
    })
    .when("/reviewTest/:testID/:questionNo", {
      templateUrl : 'reviewTest.html',
      controller : 'reviewTestController'
    })
    .when("/O-Net-Test-1", {
      templateUrl : 'O-Net-Test-1.html'
    })
    .when("/O-Net-Test-1-start", {
      templateUrl : 'O-Net-Test-1-start.html'
    })
    .when("/errorPage", {
      templateUrl : 'error.html'
    })
});

app.controller('examListPageCtrl', function($scope, $http, $window) {
  $scope.jwtAuthorizedPage = function() {
    $http({
      url: '/jwtAuthorized',
      method: 'GET',
      headers: {
        'Authorization': 'JWT ' + $window.sessionStorage.token
      }
    }).then(function(response){
      console.log('Success');
      $scope.data = response.data;
    });
  }
})

app.controller('myCtrl', function($scope, $http){
    $http.get('/getExamDB')
    .then(function(response){
        $scope.exam = response.data;
  });

$scope.submitFunc = function () {
  $http({
    url: '/submitAnswer',
    method: 'POST',
    data: $scope.formData
  }).then(function(response){
    console.log('Post data');
    $scope.Result = response.data;
  });
};
});

app.controller('view1Ctrl', function($scope, $http) {
    $scope.submitPost = function() {
        $http.post('/view1',$scope.formData)
        .then(function(){
            console.log("posted successfully");
        })
    }
});


// Global variable to submit answers
var allAnswers = [];
//

// Create service to hold all the anser of the test
app.service('AllAnswerService', function() {
  var allAnswer = {};

  function set(data) {
    allAnswer = data;
  }

  function get() {
    return allAnswer;
  }

  return {
    set: set,
    get: get
  }
});

// user log in service
app.service('UseLogInService', function($window) {
  var userProfile = {};

  function set(data) {
    $window.sessionStorage.userProfile = data;
  }

  function get() {
    return $window.sessionStorage.userProfile;
  }

  return {
    set: set,
    get: get
  }

})

app.controller('ONetM3', function($scope, $http, $location, AllAnswerService) {
  $http.get('/ONetM3')
  .then(function(response){
    $scope.exam = response.data;
    $scope.count = 0;
    $scope.question = response.data.Questions[$scope.count];
    $scope.answers = response.data.Questions[$scope.count].Answers;
    $scope.answer1 = response.data.Questions[$scope.count].Answers[0];
    $scope.answer2 = response.data.Questions[$scope.count].Answers[1];
    $scope.answer3 = response.data.Questions[$scope.count].Answers[2];
    $scope.answer4 = response.data.Questions[$scope.count].Answers[3];

    /*
     Check the logic which has the number of Questions in the test \
     to stop the loop
     the change the page to summary answer in the table \
     before post the answer to the server the check the answers \
     the return to a new page with the exam result analysis
    */

    $scope.submitAndNext = function() {

      // All answers to be submitted
      // To loop up to number of questions
      if ($scope.count < $scope.exam.NumberOfQuestions-1) {

      console.log($scope.formData.answer);
      allAnswers.push($scope.formData.answer);
      console.log(allAnswers);

      $scope.count += 1;

      $scope.formData.answer = "";

      $scope.question = response.data.Questions[$scope.count];
      $scope.answer1 = response.data.Questions[$scope.count].Answers[0];
      $scope.answer2 = response.data.Questions[$scope.count].Answers[1];
      $scope.answer3 = response.data.Questions[$scope.count].Answers[2];
      $scope.answer4 = response.data.Questions[$scope.count].Answers[3];
    }
    else {
      $scope.testEnd = false;
      allAnswers.push($scope.formData.answer);
      console.log($scope.formData.answer);
      console.log(allAnswers);
      console.log('You reach the end of the test.');

      AllAnswerService.set(allAnswers);

      console.log(AllAnswerService.get(allAnswers));

      $location.path("/testSummary");
      }
    }
  });

});

// Sign up controller
app.controller('signUpCtrl', function($scope, $http, $location) {
  $scope.signUpSubmit = function() {
    $http.post('/signUp',$scope.formData)
    .then(function(){
        console.log("Submit sign up form posted successfully");
      });
    }
  });

// Log in controller
app.controller('logInCtrl', function($scope, $http, $location, $window, UseLogInService) {
  $scope.logInSubmit = function() {
    $http({
      method: 'POST',
      url: '/logIn',
      data: $scope.credentials
    }).then(function successCallback(response) {
    // this callback will be called asynchronously
    // when the response is available
    console.log("Post log in successfully");

    $window.sessionStorage.setItem('user', response.data.user);
    $window.sessionStorage.setItem('userID', response.data.userID);
    $window.sessionStorage.setItem('token', response.data.token);
    $window.sessionStorage.setItem('message', response.data.message);

    // Get userID here to start dashboard controller
    if ($window.sessionStorage.getItem('message') == 'login success') {
      //$location.path('/dashboard'+'/'+$window.sessionStorage.getItem('user'));
      $location.path('/dashboard'+'/'+$window.sessionStorage.getItem('userID'));
    }
    else if ($window.sessionStorage.getItem('message') == 'login fail') {
      // need to flash message to the user
      $location.path('/login');
    }

    }, function errorCallback(response) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    $location.path('/logIn');
    });
  }
});

app.controller('dashboardCtrl', function ($scope, $http, $location, $window, $routeParams) {

  // Use service to call to server to get private user information to display
  var url = '/dashboard/' + $window.sessionStorage.getItem('userID');

  console.log(url);
  // http get to retrieve user dashboard data
  $http({
  url: url,
  method: 'GET',
  headers: {
    'Authorization': 'JWT ' + $window.sessionStorage.token
    }
  }).then(function successCallback(response) {
    // this callback will be called asynchronously
    // when the response is available

    $scope.user = response.data.userName;
    $scope.email = response.data.userEMail;
    $scope.id = response.data._id;

  }, function errorCallback(response) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    console.log(response.status);
    $location.path('/errorPage');
  });


});

app.controller('testSummary-Ctrl', function($scope, $http, AllAnswerService) {
  $scope.answers = AllAnswerService.get();
})

app.controller('testMain', function($scope, $http, $routeParams, $location, $window) {
  console.log($routeParams.testID);
  $scope.testID = $routeParams.testID;
  console.log($scope.testID);

  var url = '/testHeader/'+$scope.testID;

  // Test Header and description will be displayed here.
  $http({
  url: url,
  method: 'GET', /* Use POST to register user test  session on the DB here ?*/
  headers: {
    'Authorization': 'JWT ' + $window.sessionStorage.token
    }
  }).then(function successCallback(response) {
    /** should keep the test information and \
      * number of questions and other header  on the sessionStorage here
      */
    $scope.testDescription = response.data.TestDescription;
    $window.sessionStorage.setItem('testID', response.data.TestID);
    $window.sessionStorage.setItem('testDescription', response.data.TestDescription);
    $window.sessionStorage.setItem('numberOfQuestions', response.data.NumberOfQuestions);

  }, function errorCallback(response) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    console.log(response.status);
    $location.path('/errorPage');
  });

  $scope.startTest = function(){

    // start clock the test start should be here ?
    /** Register the user for the test session in the database
      * 1. http POST
      * 2. refactor to be a service later
      */
      $window.sessionStorage.setItem('testStartAt', Date.now());
      var testSessionRegister = '/testSessionRegister/'+$window.sessionStorage.userID
                                                       +'/'
                                                       +$window.sessionStorage.testID
                                                       +'/'
                                                       +$window.sessionStorage.testStartAt;
      console.log(testSessionRegister);

      $http({
      url: testSessionRegister,
      method: 'POST',
      headers: {
        'Authorization': 'JWT ' + $window.sessionStorage.token
        }
      }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        console.log(response.data);

      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });

    $location.path('/test/'+$scope.testID+'/question/1');
  }
});

// Tutorial mode test
app.controller('testSelectedStart', function($scope, $http, $routeParams, $window, $location) {
  console.log($routeParams.testID);
  console.log($routeParams.questionNo);

  // use for showing submit answer or next question button
  $scope.submitted = true;
  $scope.isSubmitted = function() {
    return $scope.submitted;
  }

  $scope.next = false;
  $scope.isNext = function() {
    return  $scope.next; /*!($scope.submitted);*/
  }

  // To control the test finish button
  $scope.testFinished = false;
  $scope.isTestFinished = function() {
    return $scope.testFinished;
  }

  var testUrl = '/test/'+$routeParams.testID+'/question/'+$routeParams.questionNo;

  console.log(testUrl);

  $scope.testID = $routeParams.testID;
  $scope.questionNo = $routeParams.questionNo;

  // http get to retrieve Exam question
  $http({
  url: testUrl,
  method: 'GET',
  headers: {
    'Authorization': 'JWT ' + $window.sessionStorage.token
    }
  }).then(function successCallback(response) {
    // this callback will be called asynchronously
    // when the response is available

    $scope.questionNo = response.data.QuestionNumber;
    $scope.question = response.data.Question;
    $scope.choice1 = response.data.ArrayOfAnswerChoice[0];
    $scope.choice2 = response.data.ArrayOfAnswerChoice[1];
    $scope.choice3 = response.data.ArrayOfAnswerChoice[2];
    $scope.choice4 = response.data.ArrayOfAnswerChoice[3];

    // where to clock question starts ?
    $window.sessionStorage.setItem('currentQuestionStartAt', Date.now());
    console.log('currentQuestionStartAt: '+$window.sessionStorage.currentQuestionStartAt);

  }, function errorCallback(response) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    console.log(response.status);
    $location.path('/errorPage');
  });

  $scope.submitAnswer = function() {

      console.log($scope.formData.answer);

      // use value of $scope.formData.answer to trigger the dialog here

      $scope.submitted = false;
      $scope.next = true;
      $scope.testFinished = false;

      // where to clock question finishes ?
      $window.sessionStorage.setItem('currentQuestionFinishAt', Date.now());

      console.log($scope.formData.answer);

      var answerJSON = {userID: $window.sessionStorage.userID,
                        TestID: $routeParams.testID,
                        testStartAt: $window.sessionStorage.testStartAt,
                        QuestionNumber: $routeParams.questionNo,
                        Answer: $scope.formData.answer,
                        currentQuestionStartAt: $window.sessionStorage.currentQuestionStartAt,
                        currentQuestionFinishAt: $window.sessionStorage.currentQuestionFinishAt};

      // use service to check the answer on the server
      // http get to retrieve Exam question
      $http({
      url: '/checkAnswerTutorialMode',
      method: 'POST',
      data: answerJSON,
      headers: {
        'Authorization': 'JWT ' + $window.sessionStorage.token
        }
      }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        console.log('Checked answer is returned.')
        $scope.result = response.data.result;
        $scope.explanation = response.data.explanation

        /** The logic to check if it is the end of the test here
          * 1. Not to display next question button
          * 2. Instead show end of test and go to Test summary button here
          */
        if ($routeParams.questionNo == $window.sessionStorage.getItem('numberOfQuestions')) {
          $scope.submitted = false;
          $scope.next = false;
          $scope.testFinished = true;
        }

      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        console.log(response.status);
        $location.path('/errorPage');
      });
    }

    $scope.nextQuestion = function() {
      console.log('Next question, please ...');
      ++$scope.questionNo;
      console.log($scope.questionNo);

      // looping through to get the next question in the test
      if ($scope.questionNo <= $window.sessionStorage.getItem('numberOfQuestions')) {
        // change button type to display
        $scope.submitted = true;
        $scope.next = false;
        $scope.testFinished = false;
        // Fetching a new question from the DB by routing
        $location.path('/test/'+$scope.testID+'/question/'+$scope.questionNo);
    } else {
      console.log('To show the summary page')

    }
  }

  $scope.showTestSummary = function() {
    $location.path('/testSummary');
  }
})

app.controller('testSummaryController', function($scope, $http, $routeParams, $window, $location) {
  var url = '/getTestSummary/'+$window.sessionStorage.userID+
            '/'+$window.sessionStorage.testID+
            '/'+$window.sessionStorage.testStartAt

  $http({
  url: url,
  method: 'GET',
  headers: {
    'Authorization': 'JWT ' + $window.sessionStorage.token
    }
  }).then(function successCallback(response) {
    $scope.results = response.data;
  }, function errorCallback(response) {

  });
})

app.controller('reviewTestController', function($scope, $http, $routeParams, $window, $location) {

  var url = '/reviewTest/'+$routeParams.testID+'/'+$routeParams.questionNo;

  console.log(url);

  $http({
  url: url,
  method: 'GET',
  headers: {
    'Authorization': 'JWT ' + $window.sessionStorage.token
    }
  }).then(function successCallback(response) {
      console.log('Received review');
  }, function errorCallback(response) {
      console.log(response.data);
  });

})
