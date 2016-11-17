'use strict'
exports.launch = launchSendMetrics

if (require.main === module) main()

function launchSendMetrics () {
  var path = require('path')
  var npm = require('../npm.js')
  var runBackground = require('./background.js')
  var cliMetrics = path.join(npm.config.get('cache'), 'anonymous-cli-stats.json')
  try {
    fs.statSync(cliMetrics)
    return runInBackground(__filename, [cliMetrics])
  } catch (ex) {
    // if the stats file doesn't exist, don't run
  }
}

function runInBackground (js, args, opts) {
  if (!args) args = []
  args.unshift(js)
  if (!opts) opts = {}
  opts.stdio = 'ignore'
  opts.detached = true
  var child = child_process.spawn(process.execPath, args, opts)
  child.unref()
  return child
}

function main () {
  var fs = require('fs')
  var path = require('path')
  var npm = require('../npm.js')
  var registry = 'https://registry.npmjs.org/'
  var metricFile = process.argv[2]
  var cliMetrics = JSON.parse(fs.readFileSync(metricFile))
  npm.load({}, function (err) {
    if (err) return
    npm.registry.config.retry.retries = 0
    npm.registry.sendAnonymousCLIMetrics(registry, cliMetrics, function (err) {
      if (err) {
        fs.writeFileSync(path.join(path.dirname(metricFile), 'last-send-stats-error.txt'), err.stack)
      } else {
        fs.unlinkSync(cliMetrics)
      }
    })
  })
}
