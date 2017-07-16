
(function () {
  var gulp = require('gulp');
  var exec = require('child_process').exec;
  var path = require('path');
  var configFile = require(path.join(process.cwd(), '.config.book.json'));;

  gulp.task('deploy-heroku', [], function() {
      exec('git add .', (err, out) => {
        if (err) console.log(err);
        console.log(out);
        exec('git commit -m \"Updating book for heroku at ' + new Date() + '\"', function (err, out) {
          console.log(out);
          exec('git push heroku master', function(err,out) {
            console.log(out);
            console.log("Now you can see your document at " + configFile['heroku_url']);
          })
        });
      });
  });
})(this);
