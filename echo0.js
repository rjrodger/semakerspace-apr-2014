
var net = require('net')

var server = net.createServer(function(connection) {
  connection
    .pipe(connection)

}).listen(8124)

// telnet localhost 8124
// type stuff, hit return
 

