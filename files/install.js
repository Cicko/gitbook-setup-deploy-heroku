// There the heroku app should be created.
// There the oauth app should be created.
// There the remote url for the app have to be added to git.

var exec = require('child_process').exec;
var Heroku = require('heroku-client');
var heroku;
var path = require('path')
var fs = require('fs-extra');
var configFile = require(path.join(process.cwd(),'.config.book.json'));
var book_name = configFile.name;
var author = configFile.authors[0];
var heroku_url = configFile.heroku_url;

var heroku_app_name = book_name + "-" + author + '-gs';

function existsHerokuApp (name,callback) {
  var existe = false;
  heroku.get('/apps').then(apps => {
    apps.forEach (function (app,i) {
      if (app.name == name) {
        existe = app;
      }
      if (i+1 == apps.length) callback(existe);
    });
  });
}

function setHerokuData (app, callback) {
  configFile['heroku_url'] = app.web_url;
  fs.unlink('.config.book.json', function(err) {
    fs.writeFileSync('.config.book.json', JSON.stringify(configFile, null, '\t'));
    var token = fs.existsSync(path.join(process.env.HOME,'.gitbook-setup','token.json'))? require(path.join(process.env.HOME,'.gitbook-setup','token.json')).token : false;
    // Hay que revisar luego por seguridad si desde la web se puede coger este token
    fs.writeFileSync('.token.github.json', token);
    exec('git remote', (err, out) => {
      if (out.includes('heroku')) callback();
      else {
        exec('git remote add heroku ' + app.git_url, function(err, out) {
          if (err) callback(err);
          else callback();
        });
      }
    })
  });

}

module.exports.install = (callback) => {
  if (configFile['private'] == "yes") {

  }
  exec ('which heroku', function (err, out) {
    if (out.length == 0) {
      console.log("\x1b[31m","YOU HAVE TO INSTALL HEROKU. EXECUTE '$npm install -g heroku'");
      process.exit();
    }
  });
  if (!fs.existsSync('_book')) {
      exec('gitbook build', function (err, out) {
        if (err) console.log(err);
      });
  }
  exec('heroku auth:token', function(err, out) {
    if (!err) {
      heroku = new Heroku({
        token : out.replace(' ','')
      });
      existsHerokuApp(heroku_app_name, function (app) {
        if (app) {
          setHerokuData(app, (err) => {
            if (err) callback(err);
            else callback(null,"Created heroku app " + heroku_app_name);
          });
        }
        else {
          heroku.post('/apps', {body: {name: heroku_app_name}}).then(app => {
            setHerokuData(app, (err) => {
              if (err) callback(err);
              else callback(null,"Created heroku app " + heroku_app_name);
            });
          }).catch(function(e) {
            console.log(e);
          });
        }
      });
    }
  });
}
