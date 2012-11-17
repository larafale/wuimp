var myApp = angular.module('myApp', []);

var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-36006605-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

var socket = io.connect();

function DefaultController($scope, $http) {

  $scope.place = {};
  $scope.places = [];

  socket.on('status', function (data) {
    console.log(data.status);
  });

  socket.on('place', function (data) {
    console.log('pulling');
    $scope.places.unshift(data);
    $scope.$digest();
  });

  $scope.hash = getId();
  if($scope.hash) process($scope.hash, true);

  /*$(window).scroll(function(){
    if($(window).scrollTop() == $(document).height() - $(window).height()){
      scope.paginate();
    }
  });*/

  $scope.search = function(foursquareId){
    process(foursquareId, true);
    return false;
  };

  function process(foursquareId, direct){

    var url = 'https://api.instagram.com/v1/locations/search?callback=?&amp;&foursquare_v2_id='+foursquareId+'&client_id=b9b016b2ab564ff18b3dc22460fc4753';
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

      
      if(!direct) socket.emit('search', $scope.place);
      
      _gaq.push(['_trackPageview', '/' + foursquareId + '?place=' + $scope.place.name + '&city=' + $scope.place.city]);

      $('#share').empty();
      var btn = $('#shareSource').clone();

      btn.show();
      btn.attr("data-url", "http://www.wuimp.com/" + $scope.hash);
      btn.attr("data-text", "Check what's going on in \"" + $scope.place.name + "\" " + ($scope.place.city || ''));
      btn.attr("class", "twitter-share-button");

      $('#share').append(btn);
      $.getScript("http://platform.twitter.com/widgets.js");

      $.getJSON('https://api.instagram.com/v1/locations/'+$scope.place.idInstagram+'/media/recent?callback=?&amp;&client_id=b9b016b2ab564ff18b3dc22460fc4753', function(data){
        $scope.next = data.pagination && data.pagination.next_url ? data.pagination.next_url : null;
        $scope.medias = data.data;
        $scope.$digest();

        if(!mapInit) initMaps();

        if($scope.place.lat && $scope.place.lng){
        var latlng = new google.maps.LatLng($scope.place.lat, $scope.place.lng);
        map.setCenter(latlng);
        marker = new google.maps.Marker({
            map: map,
            position: latlng
        });
        $('#map_canvas').show();
      };

      });

    });

  };

  var cm1 = new CompleterJS({
    input     : $('#city')
  , minChars  : 3
  , maxResults: 10
  , startText : "Choose a City"
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
  , startText : "Enter a Place"
  , onFocus   : function(){ if(!cm1.value){ $('#city').focus() } }
  , source    : function(query, defered){

      var ll = cm1.value;

      $.ajax({
        url: 'https://api.foursquare.com/v2/venues/suggestcompletion?oauth_token=PK10U4AOCRU2VW3ZDNR41XPUDXS4R3VM3S2V404WSIHAUCX4&query=' + query + '&ll=' + ll,
        dataType: "json"
      }).success(function(data){
        var source = _.compact(_.map(data.response.minivenues, function(o){
          var value     = o.id;
          var name      = _.compact([o.name]).join(", "); /*Le brigand*/
          var short     = o.name;
          var icon      = o.categories[0] && o.categories[0].icon ? o.categories[0].icon : false;
          var distance  = o.location && o.location.distance ? o.location.distance : false;
          var lat       = o.location && o.location.lat ? o.location.lat : false;
          var lng       = o.location && o.location.lng ? o.location.lng : false;
          return distance && distance < 8000 ? { id: value, text: name, short: short, icon: icon, distance: distance, lat: lat, lng: lng } : null;
        }));
        defered.resolve(source);
      });

    }
  , afterSelection : function(data){
      $scope.place.icon = data.icon;
      $scope.place.idFoursquare = data.id;
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