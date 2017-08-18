var express = require('express');
var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var github = require('octonode');
var path = require('path');
var fs = require('fs-extra');
var session = require('express-session');
var bodyParser = require('body-parser')
var methodOverride = require('method-override');

var app = express();
var configFile = require(path.join(process.cwd(),'.config.book.json'));
var callbackURL_ = path.join(configFile.heroku_url, 'github/auth/return');
const oauth_file = require(path.join(process.cwd(),'.oauth.github.json'));
const GitHubApi = require("github");

var engines = require('consolidate');

var organizacion;

app.set('views', __dirname + '/_book');
app.engine('html', engines.mustache);
app.set('view engine', 'html');
console.log("Callback URL IS: " + callbackURL_);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new Strategy({
  clientID: oauth_file.clientID,
  clientSecret: oauth_file.clientSecret,
  callbackURL: oauth_file.callbackURL,
  scope: ['user','repo']
},
function(accessToken, refreshToken, profile, done) {
  profile.token = accessToken;
    done(null,profile)
}));




var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
    console.log('Your files will be served through this web server in port ' + port);
});


app.get('/',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res) {
});


app.get("/github/auth/return",
  passport.authenticate('github', { failureRedirect: '/fail' }),
  function(req, res) {
    organizacion = require('./.config.book.json').organization;
    var client = github.client(req.user.token);

    var ghorg = client.org(organizacion);

    console.log("USERNAME: " + req.user.username);

    client.get(`/users/${req.user.username}/orgs`, {}, function (err, status, body, headers) {
      if (body.length == 0) res.redirect('/fail');
      var founded = false;
      console.log("ORGSSSSS")
      body.forEach((org,inx) => {
        console.log(org);
        if (org.login == organizacion) {
          founded = true;
          res.redirect('/content');
        }
        else if (inx + 1 == body.length && !founded) {
          res.redirect('/fail');
        }
      });
    });

});

app.get("/content", (req, res) => {
  res.render('index')
});


app.get('/fail', (req, res) => {
  res.send("<h1 style='color:red;'>FAILED AUTHENTICATION. You are not part of the organization " + organizacion + "</h1>");
});

app.use(express.static(__dirname + '/_book'));
