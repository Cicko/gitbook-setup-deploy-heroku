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
//const TOKEN = require(path.join(process.cwd(),'.token.github.json')).token;

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
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

passport.use(new Strategy({
  clientID: oauth_file.clientID,
  clientSecret: oauth_file.clientSecret,
  callbackURL: oauth_file.callbackURL
},
function(accessToken, refreshToken, profile, cb) {
  var org = require('./.config.book.json').organization;
  var client = github.client(accessToken);
  var ghorg = client.org(org);

  ghorg.member(profile.username, (err,result) =>
  {
    if(err) console.log(err);

    console.log("Result: " + result);
    if(result == true)
      return callback(null, profile);
    else
      return callback(null, null);
  });
  // return cb(null, profile);
}));


var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
    console.log('Your files will be served through this web server in port ' + port);
});


app.get('/',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res) {
    console.log("Dicen que esto no se ejecuta");
  });


app.get("/github/auth/return",
  passport.authenticate('github', { failureRedirect: '/fail' }),
  function(req, res) {
    res.render('index')
  });


app.get('/fail', (req, res) => {
  res.send("FAILED authentication");
});

app.use(express.static(__dirname + '/_book'));
