"use strict";
 
var fs = require('fs')

var in_stream = fs.createReadStream( "pipe0.js" )

in_stream.pipe(process.stdout)

