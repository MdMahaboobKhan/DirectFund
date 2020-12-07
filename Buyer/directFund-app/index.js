var express = require('express');
var app = express();

app.use(express.static('src'));

app.listen(3010, function () {
  console.log('DirectFund Dapp listening on port 3010!');
});