

var gulp = require('gulp');
var exec = require('child_process').exec;
gulp.task('deploy-heroku', [], function() {
  exec('gitbook build',function(err, out){
    if (err) console.log(err);
    console.log(out);
    exec('git add _book',function(err, out){
      if (err) console.log(err);
      console.log(out);
      exec('git commit -m \"creating book for heroku\"')
    })
  })
});
