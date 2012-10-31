request = module.parent.exports.request

module.exports = function(app){

  var   ctr = {}
      , foursquare = app.locals.foursquare

  ctr.index = function(req, res){
    res.render('index', { title: 'wuimp.com - what\'s up in my place' })
  }

  ctr.test = function(req, res){
    res.render('test', { title: 'wuimp.com - what\'s up in my place' })
  }

  ctr.foursquare = function(req, res){
    res.json("hello")
  }

  ctr.foursquare_token = function(req, res){
    var url = 'https://foursquare.com/oauth2/authenticate?client_id=' + foursquare.client_id + '&response_type=token&redirect_uri=' + foursquare.redirect
    res.redirect(url)
  }

  return ctr

}