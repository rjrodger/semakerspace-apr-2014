"use strict";


// core modules
var stream = require('stream')
var util   = require('util')


// third party modules
var es = require('event-stream')

process.stdin.setRawMode(true)
process.stdin.resume()
 

var keypresser = new stream.Readable({objectMode:true})
keypresser._read = function(){}

process.stdin.on('data', function (data) {
  keypresser.push( data )
})

var outstream = keypresser
      .pipe(process.stdout)

