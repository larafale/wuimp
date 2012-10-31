
/**
 * Module dependencies.
 */

var express = require('express')
  , app     = module.exports.app      = express()
  , request = module.exports.request  = require('request')
  , fs      = module.exports.fs       = require('fs')
  , http    = require('http')
  , path    = require('path')

app.configure(function(){
  app.set('port', process.env.PORT || 3000)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.locals.pretty = true
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(path.join(__dirname, 'public')))
})

app.locals.foursquare = {
  'client_id' : 'QHODUDWGF01V3S2EWRIQ5HLNPXUUWLP2XMTUPJ3DYWUBZNKG'
, 'redirect'  : 'http://gramquest.herokuapp.com/foursquare'
, 'token'     : 'PK10U4AOCRU2VW3ZDNR41XPUDXS4R3VM3S2V404WSIHAUCX4'
}

app.configure('development', function(){
  app.use(express.errorHandler())
})

var routes = require('./routes/')(app)

app.get('/img/*', function(req, res){ fs.readFile(__dirname + '/public' + req.path, function(err, data) { res.end(data) }) })
app.get('/js/*.js', function(req, res){ fs.readFile(__dirname + '/public' + req.path, function(err, data) { res.end(data) }) })
app.get('/css/*.css', function(req, res){ fs.readFile(__dirname + '/public' + req.path, function(err, data) { res.end(data) }) })

app.get('/', routes.index)
app.get('/test', routes.test)
app.get('/foursquare', routes.foursquare)
app.get('/foursquare_token', routes.foursquare_token)

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'))
})
