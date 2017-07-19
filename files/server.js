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
const GitHubApi = require("github");
/*
var github = new GitHubApi({
  // optional
  debug: true,
  protocol: "https",
  host: "api.github.com", // should be api.github.com for GitHub
  headers: {
      "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
  },
  Promise: require('bluebird'),
  followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
  timeout: 5000
});
*/

var engines = require('consolidate');

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
//app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

passport.use(new Strategy({
  clientID: oauth_file.clientID,
  clientSecret: oauth_file.clientSecret,
  callbackURL: oauth_file.callbackURL
},
function(accessToken, refreshToken, profile, done) {
  var org = require('./.config.book.json').organization;

/*
  github.authenticate({
    type: 'token',
    token: accessToken
  });

  github.orgs.getMembers({
    org: org
  }, (err, out) => {
    var members = out.data;
    var is_member = false;
    github.users.get({}, (err, out) => {
      members.forEach ((owner, inx) => {
        if (out.data.login == owner.login) {
          done(null, out.data);
          is_member = true;
        }
        else if (inx + 1 == members.length && !is_member) {
          done(null, null);
        }
      })
    })
  })
*/


  // My personal access token. That is problem because the user have to put its token to check if is member of a organization (private organization).
  var client = github.client("61c3f65de1d82d24c8effd01ea6ffb2a9c6ae7bf");
  var ghme = client.me();

  ghme.info((err, out) => {
    console.log("GHME INFO")
    if (err) console.log(err);
    else console.log(out);
  });


  var ghorg = client.org(org);


  /*
  ghorg.members((err, result) => {
    if (err) console.log(err);
    else console.log(result);
  })
  */


  ghorg.member(profile.username, (err,result, whatis) =>
  {
    if(err) console.log(err);

    console.log("Result: " + result); // Always is FALSE
    if(result == true)
      done(null, profile);
    else
      done(null, null);
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
    //console.log(res);
    res.redirect('/content');
  });

app.get("/content", (req, res) => {
  res.render('index')
});


app.get('/fail', (req, res) => {
  res.send("<h1>FAILED AUTHENTICATION</h1>");
});

app.use(express.static(__dirname + '/_book'));
