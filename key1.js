"use strict";


// core modules
var stream = require('stream')
var util   = require('util')


// third party modules
var es         = require('event-stream')
var keypress   = require('keypress')



process.stdin.setRawMode(true)
process.stdin.resume()

keypress(process.stdin)


var keypresser = new stream.Readable({objectMode:true})
keypresser._read = function(){}

process.stdin.on('keypress', function (ch,key) {
  keypresser.push( {ch:ch,key:key} )
})


var outstream = keypresser
      .pipe(es.stringify())
      .pipe(process.stdout)

 
