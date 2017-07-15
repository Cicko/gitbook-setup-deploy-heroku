var express = require('express');
var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var github = require('octonode');
var path = require('path');
var app = express();
var pkg = require(path.join(basePath, 'package.json'));
var book_json = require('./book.json');
var callbackURL_ = book_json.heroku_url.concat('/login/github/return');

console.log("Callback URL IS: " + callbackURL_);

passport.use(new Strategy({
    clientID: datos_config.clientID,
    clientSecret: datos_config.clientSecret,
    callbackURL: callbackURL_
  },
  function(accessToken, refreshToken, profile, cb) {

      var token = datos_config.token;
      var client = github.client(token);

      var ghorg = client.org('ULL-ESIT-SYTW-1617');

      ghorg.member(profile.username, (err,result) =>
      {
          if(err) console.log(err);
          console.log("Result:"+result);
          if(result == true)
            return cb(null, profile);
          else {
            return cb(null,null);
          }
      });
    // return cb(null, profile);
}));

app.use('/', express.static(__dirname + '/_book'));
var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
    console.log('Your files will be served through this web server in port ' + port);
});


app.get('/', (request, response) => {
      response.render ('index');
});
