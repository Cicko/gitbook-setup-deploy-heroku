// There the heroku app should be created.
// There the oauth app should be created.
// There the remote url for the app have to be added to git.

var exec = require('child_process').exec;
var inquirer = require('inquirer')
var Heroku = require('heroku-client');
var heroku;
var path = require('path')
var fs = require('fs-extra');
var configFile = require(path.join(process.cwd(),'.config.book.json'));
var book_name = configFile.name;
var author = configFile.authors[0];
var heroku_app_name = book_name + "-" + author + '-gs';
var heroku_url = "https://" + heroku_app_name + ".herokuapp.com";
var launcher = require( 'launch-browser' );
var Tacks = require('tacks');
var copy = require('copy-to-clipboard')
const { URL } = require('url');
var File = Tacks.File;
var Dir = Tacks.Dir;

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


function setup (callback) {
  exec ('gulp -T', (err, out) => {
    if (err)
      exec ('npm install gulp', (err, out) => {
        var msg = "gulp installed locally";
        console.log(msg);
	if (callback) callback(msg);
      })
  })
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
            if (err) callback(err, null);
            else if (callback) callback(null,"App already exists. Seting heroku app data. " + heroku_app_name);
	    else console.log("App already exists. Seting heroku app data. " + heroku_app_name);
          });
        }
        else {
          heroku.post('/apps', {body: {name: heroku_app_name}}).then(app => {
            setHerokuData(app, (err) => {
              if (err) callback(err, null);
              else if (callback) callback(null,"Created heroku app " + heroku_app_name);
	      else console.log("Created heroku app " + heroku_app_name);
            });
          }).catch(function(e) {
            console.log("El error")
	    callback(e, null);
          });
        }
      });
    }
  });
}

module.exports.install = (callback) => {
  if (configFile['private'] == "yes") {
    var base_url = 'https://github.com/settings/applications/new?';
    var name_param_url = 'oauth_application[name]=' + heroku_app_name;
    var url_param_url = '&oauth_application[url]=' + heroku_url;
    var desc_param_url = '&oauth_application[description]=' + configFile['description'];
    var callback_param_url = '&oauth_application[callback_url]=' + heroku_url + '/github/auth/return';
    var oauth_register_url = base_url + name_param_url + url_param_url + desc_param_url + callback_param_url;

    var canOpenBrowser = false;

    const myURL = new URL(oauth_register_url);

    inquirer.prompt([
      {
        type:'input',
        name: 'nothing',
        message: 'Now browser will be opened to create oauth app. YOU HAVE TO COPY the app clientID and clientSecret (Press Enter)',
        filter: function (val) {
          launcher(myURL.href, { browser: ['chromium','chrome', 'firefox', 'safari'] }, function (e, browser) {
            if(e)  {
              copy(myURL.href);
              console.log(e + " Now just CTRL+V on your browser and press Enter. ");
              //return console.log(e);
            }
            else {
              canOpenBrowser = true;
            }
            //browser.on('stop', function(code){
            //});
          });
          return val;
        }
      },
      {
        type: 'input',
        name: 'justClick',
        message: 'Press Enter to push client ID:',
        validate: function (val) {
          canOpenBrowser = true;
          return true;
        },
        when: function() {
          return !canOpenBrowser;
        }
      },
      {
        type: 'input',
        name: 'clientID',
        message: 'Put the client ID of the oauth App: ',
        when: function() {
          return canOpenBrowser;
        },
        validate: function (value) {
          if (!value) return false;
          return true;
        }
      },
      {
        type: 'input',
        name: 'clientSecret',
        message: 'Put the client Secret of the oauth App: ',
        validate: function (value) {
          if (!value) return false;
          return true;
        }
      }]).then((answers) => {
        var oauth_file = new Tacks(Dir({
          '.oauth.github.json' : File(JSON.stringify({
            clientID: answers.clientID,
            clientSecret: answers.clientSecret,
            callbackURL: heroku_url + '/github/auth/return'
          }, null, "\t"))
        }));
        oauth_file.create(process.cwd());
        setup((err, msg) => {
          if (callback) callback(err, msg);
	  else callback(err, msg);
        });
      });
  }
  else {
    setup();
  }
}
