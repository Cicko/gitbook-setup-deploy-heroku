var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/_book'));
var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
    console.log('Your files will be served through this web server in port ' + port);
});


app.get('/', (request, response) => {
      response.render ('index');
});
