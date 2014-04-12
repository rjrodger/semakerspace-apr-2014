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



var keyparser = new stream.Transform({objectMode:true})
keyparser._transform = function(keypress, enc, done) {
  var self = this

  keypress = keypress || {}

  var ch  = keypress.ch
  var key = keypress.key

  var cmd = {name:'noop'}

  if( key ) {
    if( key.ctrl && 'c' == key.name ) {
      cmd.name = 'die'
    }
    else if( 'c' == key.name ) {
      cmd.name = 'reset'
      cmd.rgb  = makecolor()
      cmd.loc  = [0,0]
    }

    if( 'b'     == key.name ) { cmd.name = 'toggle-backled' }
    if( 'right' == key.name ) { cmd.name = 'right' }
    if( 'left'  == key.name ) { cmd.name = 'left' }
    if( 'up'    == key.name ) { cmd.name = 'roll' }
    if( 'down'  == key.name ) { cmd.name = 'stop' }
    if( 'q'     == key.name ) { cmd.name = 'die' }

    if( ',' == ch ) { cmd.name = 'slower' }
    if( '.' == ch ) { cmd.name = 'faster' }
  }

  self.push(cmd)
  done()
}



var killer = es.through(function(cmd){
  if( 'die' == cmd.name ) {
    process.exit()
  }
  else this.queue( cmd );
})
 

function makecolor(){
  var r = ~~(Math.random()*255);
  var g = ~~(Math.random()*255);
  var b = ~~(Math.random()*255);
  return [r,g,b];
}


var outstream = keypresser
      .pipe(keyparser)
      .pipe(killer)
      .pipe(es.stringify())
      .pipe(process.stdout)



