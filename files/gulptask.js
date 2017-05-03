

var gulp = require('gulp');
var exec = require('child_process').exec;
var fs = require('fs-extra');

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
  exec('git add _book',function(err, out){
    if (err) console.log(err);
    console.log(out);
    exec('git commit -m \"Updating book for heroku\"')
  });
}
