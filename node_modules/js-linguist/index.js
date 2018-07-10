'use strict'
const exec = require('child_process').exec
const parse = require('./parse')

function main (opts, cb) {
  opts = opts || {}

  exec('linguist', function (err, stdout, stderr) {
    if (err) {
      console.log(err)
    }


    if (stdout) {
      if (opts && opts.stdout) {
        return cb(stdout)
      } else {
        return cb(parse.trimLinguistOutput(stdout))
      }
    }
  })
}

module.exports = main
