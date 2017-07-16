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
var heroku_url = configFile.heroku_url;
var heroku_app_name = book_name + "-" + author + '-gs';
var launcher = require( 'launch-browser' );
var Tacks = require('tacks');
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


function setup (callback) {
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
            else callback(null,"Created heroku app " + heroku_app_name);
          });
        }
        else {
          heroku.post('/apps', {body: {name: heroku_app_name}}).then(app => {
            setHerokuData(app, (err) => {
              if (err) callback(err, null);
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

module.exports.install = (callback) => {
  if (configFile['private'] == "yes") {
    var base_url = 'https://github.com/settings/applications/new?';
    var name_param_url = 'oauth_application[name]=' + heroku_app_name;
    var url_param_url = '&oauth_application[url]=' + heroku_url;
    var desc_param_url = '&oauth_application[description]=' + configFile['description'];
    var callback_param_url = '&oauth_application[callback_url]=' + heroku_url + 'github/auth/return';
    var oauth_register_url = base_url + name_param_url + url_param_url + desc_param_url + callback_param_url;

    inquirer.prompt([
      {
        type:'input',
        name: 'nothing',
        message: 'Now browser will be opened to create oauth app. YOU HAVE TO COPY the app clientID and clientSecret',
        filter: function (val) {
          launcher(oauth_register_url, { browser: ['chromium','chrome', 'firefox', 'safari'] }, function (e, browser) {
            if(e) return console.log(e);
            //browser.on('stop', function(code){
            //});
          });
          return val;
        }
      },
      {
        type: 'input',
        name: 'clientID',
        message: 'Put the client ID of the oauth App: ',
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
          callback(err, msg);
        });
      });
  }
  else {
    setup();
  }
}
