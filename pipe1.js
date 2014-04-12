"use strict";

var fs     = require('fs')
var stream = require('stream')

var in_stream = fs.createReadStream( "pipe1.js" )

var upper_stream = new stream.Transform()
upper_stream._transform = function(data,enc,done){
  this.push( data.toString().toUpperCase() )
  done()
}

 
in_stream
  .pipe( upper_stream )
  .pipe( process.stdout )

