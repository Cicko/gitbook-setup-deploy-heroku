
(function () {
  var gulp = require('gulp');
  var exec = require('child_process').exec;
  var Heroku = require('heroku-client');
  var heroku;
  var fs = require('fs-extra');

  var book_json = require('./book.json');
  var book_name = book_json.title;
  var author = book_json.author;
  var web_url = book_json.web_url;

  var heroku_app_name = book_name + "-" + author + '-gs';

  gulp.task('deploy-heroku', [], function() {
    if (!fs.existsSync('_book')) {
        exec('gitbook build', function (err, out) {
          updateGit();
        });
    }
    else {
      updateGit();
    }
  });

  function updateGit () {
    exec('git add .',function(err, out){
      if (err) console.log(err);
      console.log(out);
      exec('git commit -m \"Updating book for heroku at ' + new Date() + '\"', function (err, out) {
        exec('git remote -v', function (err, out) {
          if (out.includes('heroku')) {
            console.log("heroku remote exists");
            exec('git push heroku master', function(err,out) {
              console.log(out);
              console.log("Now you can see your document at " + book_json['web_url']);
            })
          }
          else {
            console.log("heroku remote don't exists");
            exec('heroku auth:token', function(err, out) {
              if (!err) {
                heroku = new Heroku({
                  token : out.replace(' ','')
                });
                existsHerokuApp(heroku_app_name, function (app) {
                  if (app) {
                    setHerokuData(app);
                  }
                  else {
                    heroku.post('/apps', {body: {name: heroku_app_name}}).then(app => {
                      setHerokuData(app);
                    }).catch(function(e) {
                      console.log(e);
                    });
                  }
                });
              }
            });
          }
        })
      });
    });
  }

  function setHerokuData (app) {
    book_json['web_url'] = app.web_url;
    fs.unlink('./book.json', function(err) {
      fs.writeFileSync('./book.json', JSON.stringify(book_json, null, '\t'));
    });
    exec('git remote add heroku ' + app.git_url, function(err, out) {
      exec('git push heroku master', function(err, out) {
        console.log(out);
        console.log("Now you can see your document at " + app.web_url);
      })
    });
  }



  function existsHerokuApp (name,callback) {
    var existe = false;
    heroku.get('/apps').then(apps => {
      apps.forEach (function (app,i) {
        console.log(app.name + " and name is: " + name);
        if (app.name == name) {
          existe = app;
        }
        if (i+1 == apps.length) callback(existe);
      });
    });
  }
})(this);
