var express = require('express');
var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var github = require('octonode');
var path = require('path');
var app = express();
var pkg = require(path.join(basePath, 'package.json'));
var configFile = require(path.join(process.cwd(),'.config.book.json'));
var callbackURL_ = configFile.heroku_url.concat('/login/github/return');
const TOKEN = fs.existsSync(path.join(process.env.HOME,'.gitbook-setup','token.json'))? require(path.join(process.env.HOME,'.gitbook-setup','token.json')).token : null;

console.log("Callback URL IS: " + callbackURL_);

function checkAuthorization (callback) {
  var org = require('./.config.book.json').organization;

  passport.use(new Strategy({
    clientID: datos_config.clientID,
    clientSecret: datos_config.clientSecret,
    callbackURL: callbackURL_
  },
  function(accessToken, refreshToken, profile, cb) {

    var client = github.client(TOKEN);
    var ghorg = client.org(org);

    ghorg.member(profile.username, (err,result) =>
    {
      if(err) console.log(err);
      console.log("Result:"+result);
      if(result == true)
        return callback(null, profile);
      else
        return callback(null, null);
    });
    // return cb(null, profile);
  }));
}


function registrateOauthApp() {

}


app.use('/', express.static(__dirname + '/_book'));
var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
    console.log('Your files will be served through this web server in port ' + port);
});


app.get('/', (request, response) => {
  if (fs.existsSync(oauth.json)) {
    checkAuthorization((err, profile) => {
      if (err) console.log(err);
      else response.render ('index');
    });
  }
  else {
    response.render("https://github.com/settings/applications/new?oauth_application[name]=ruda&oauth_application[url]=url&oauth_application[description]=&oauth_application[callback_url]=cucu");
  }
});
