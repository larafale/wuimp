var myApp = angular.module('myApp', []);

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-36006605-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};


function DefaultController($scope, $http) {

  $scope.hash = getId();
  $scope.place = {};
  $scope.places = [];
  $scope.totalSearch = 0;
  var yyymmdd = new Date().yyyymmdd()
    , fs = { token : "oauth_token=PK10U4AOCRU2VW3ZDNR41XPUDXS4R3VM3S2V404WSIHAUCX4", public:"client_id=QHODUDWGF01V3S2EWRIQ5HLNPXUUWLP2XMTUPJ3DYWUBZNKG", secret: "client_secret=2JGX233YXHA0JCXH1HWXGKS0TGTL54RUTAG5Q4ONPSODWFYJ" }
    , is = { public : "client_id=b9b016b2ab564ff18b3dc22460fc4753" };

  /* handle sockets */
  var socket = io.connect();
  socket.on('status', function (data) { console.log(data.status); });
  socket.on('place', function (data) {
    $scope.places.unshift(data);
    $scope.$digest();
  });

  /* init page */
  if($scope.hash) process($scope.hash, true);
  else {
    $scope.picOfDay = true;
    $scope.hash = "4adcda09f964a520dd3321e3";//machu pichu
    process($scope.hash, true);
  }

  $scope.paginate = function (){

    if(!$scope.next) return ;

    var url = $scope.next;
    var split = url.split('callback=');
    url = split[0] + 'callback=?&amp;&';
    split = split[1].split('client_id=');
    url = url + 'client_id=' + split[1];

    $.getJSON(url, function(data){
      $scope.next = data.pagination && data.pagination.next_url ? data.pagination.next_url : null;
      $scope.medias = _.compact(_.union($scope.medias, data.data));
      $scope.$digest();
    });

  };

  $scope.search = function(foursquareId){
    process(foursquareId, true);
    return false;
  };

  function process(foursquareId, direct){

    var url = 'https://api.instagram.com/v1/locations/search?callback=?&amp;&foursquare_v2_id=' + foursquareId + '&' + is.public;
    $.getJSON(url, function(data){

      $scope.searched = true;

      if(!data.data[0]){
        $scope.medias = [];
        $scope.$digest();
        return;
      };

      $scope.place.name = data.data[0].name;
      $scope.place.lat = data.data[0].latitude;
      $scope.place.lng = data.data[0].longitude;
      $scope.place.idInstagram = data.data[0].id;

      // if(!direct){
      //   $.ajax({
      //     url: 'https://api.foursquare.com/v2/venues/explore?' + fs.public + '&' + fs.secret + '&ll=' + ($scope.place.lat + ',' + $scope.place.lng) + '&v=' + yyymmdd,
      //     dataType: "json"
      //   }).success(function(data){
      //     $scope.recommended = []
      //     if(data.numResults) {
      //       _.each(data.response.groups[0].items, function(item, i){
      //         if(item.venue.categories[0] && item.venue.categories[0].icon) item.venue.icon = item.venue.categories[0].icon.prefix+'bg_32'+item.venue.categories[0].icon.suffix
      //         $scope.recommended[i] = item.venue 
      //         console.log(item.venue)
      //       });
      //       $scope.$digest();
      //     }
      //   });
      // }

      if(!direct) socket.emit('search', $scope.place);
      _gaq.push(['_trackPageview', '/' + foursquareId + '?place=' + $scope.place.name + '&city=' + $scope.place.city]);

      if($scope.totalSearch) $scope.picOfDay = false;
      $scope.totalSearch = $scope.totalSearch + 1;


      /* init tweet */
      var btn = $('#shareSource').clone();
      btn.show();
      btn.attr("data-url", "http://www.wuimp.com/" + $scope.hash);
      btn.attr("data-text", "Check what's going on in \"" + $scope.place.name + "\" " + ($scope.place.city || ''));
      btn.attr("class", "twitter-share-button");

      $('#share').empty().append(btn);
      $.getScript("http://platform.twitter.com/widgets.js");

      /* pull photos from instagram locationID */
      $.getJSON('https://api.instagram.com/v1/locations/'+$scope.place.idInstagram+'/media/recent?callback=?&amp;&' + is.public, function(data){
        
        $scope.next = data.pagination && data.pagination.next_url ? data.pagination.next_url : null;
        $scope.medias = data.data;
        $scope.$digest();

        /* set google map */
        if(!mapInit) initMaps();
        if($scope.place.lat && $scope.place.lng){
          var latlng = new google.maps.LatLng($scope.place.lat, $scope.place.lng);
          map.setCenter(latlng);
          marker = new google.maps.Marker({ map: map, position: latlng });
          $('#map_canvas').show();
        };

      });

    });

  };



  var cm1 = new CompleterJS({
    input     : $('#city')
  , minChars  : 3
  , maxResults: 10
  , source    : function(query, defered){

      $.ajax({
        url: 'http://ws.geonames.org/searchJSON?maxRows=8&featureClass=P&style=full&name_startsWith=' + query,
        dataType: "json"
      }).success(function(data){
        var source = _.map(data.geonames, function(o){
          var value = o.lat + ',' + o.lng;
          var name  = _.compact([o.name, o.adminName2, o.countryName]).join(", "); /*Aix-enProvence, Bouche-du-Rhone, France*/
          var short = o.name;
          return { id: value, text: name, short: short } 
        });
        defered.resolve(source);
      });

    }
  , afterSelection : function(data){
      $scope.place.city = cm1.text;
      cm2.value = null;
      $('#place').val('');
      $('#place').focus();
    }
  });

  var cm2 = new CompleterJS({
    input     : $('#place')
  , minChars  : 3
  , maxResults: 10
  , onFocus   : function(){ if(!cm1.value){ $('#city').focus() } }
  , source    : function(query, defered){
    
      $.ajax({
        url: 'https://api.foursquare.com/v2/venues/suggestcompletion?' + fs.token + '&query=' + query + '&ll=' + cm1.value + '&v=' + yyymmdd,
        dataType: "json"
      }).success(function(data){
        var source = _.compact(_.map(data.response.minivenues, function(o){
          var distance  = o.location && o.location.distance ? o.location.distance : false
            , obj = {
                id    : o.id
              , text  : _.compact([o.name]).join(", ")
              , name  : _.compact([o.name]).join(", ")
              , icon  : o.categories[0] && o.categories[0].icon ? o.categories[0].icon.prefix+"bg_32"+o.categories[0].icon.suffix : false
              , lat   : o.location && o.location.lat ? o.location.lat : false
              , lng   : o.location && o.location.lng ? o.location.lng : false
            }
            console.log(obj)
          return distance && distance < 8000 ? obj : null;
        }));
        defered.resolve(source);
      });

    }
  , afterSelection : function(data){
      $scope.place = data
      $scope.hash = data.id;
      process(data.id);
      $('#place').blur();
    }
  , formatList : function(data, elem){
      var icon = data.icon ? '<img src="'+data.icon+'" />&nbsp;' : '';
      elem.html(icon + data.text);
      return elem;
    }
  });


  var geocoder
    , map
    , marker
    , mapInit = false;

  function initMaps() {
    geocoder = new google.maps.Geocoder();
    map      = new google.maps.Map(document.getElementById('map_canvas'), {
      zoom: 16,
      center: new google.maps.LatLng(-34.397, 150.644),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    mapInit = true;
  };

};