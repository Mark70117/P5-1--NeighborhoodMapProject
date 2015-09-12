var PIN_ICON = 'icons/pin-export.png';
var STAR_ICON = 'icons/star-3.png';
var MAP_HOME_LAT = 29.967969 ;
var MAP_HOME_LNG = -90.056589;


var map;
var lastStarMarker ;
var firebase = new Firebase("https://popping-heat-1511.firebaseio.com/markers");

var FilterVM = function() {
    var self = this ;
    self.filterText =  ko.observable("");
    self.filterTextPresent = function(baseStr) {
      return ko.computed({
        read: function() {
          return baseStr.toLowerCase().indexOf(self.filterText().toLowerCase()) >= 0;
        }
      });
    };
};

var MapViewModel = function() {
    var self = this ;
    self.simple = ko.observable("simple");
    self.markers =  KnockoutFire.observable(
        firebase, {
            "$marker": {
                "content": true,
                "markerConfig": true
            },
            ".newItem": {
                ".priority": function() { return Date.now() }
            }
        }
    );
    self.removeMarker = function(marker) {
        firebase.child(marker.firebase.name()).remove();
    };

    self.markerClickFunc = function (marker, i) {
                 return function () {
                 console.log("MRA click",i);
                 console.log("MRA click",marker.getPosition().lat());
                 console.log("MRA click",marker.getPosition().lng());
                 var position = marker.getPosition();
                 callFoursquareAPI(position.lat(), position.lng());
                 if (lastStarMarker) {
                     lastStarMarker.setIcon(PIN_ICON);
                     lastStarMarker.setZIndex(0);
                 }
                 marker.setIcon(STAR_ICON);
                 marker.setZIndex(1);
                 lastStarMarker = marker;
                 //infowindow.setContent(hk_markers[i].name);
                 //infowindow.open(map, marker);
            }
        };

    self.clickMarker= function() {
        // make sure markerClickFN has been set up.
        if (typeof this._markerClickFn === "function") {
            this._markerClickFn();
        }
    };
};

var masterVM = {
  filterVM : new FilterVM(),
  mapVM: new MapViewModel()
};

function initializeKO() {
  ko.applyBindings(masterVM);
};

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
	console.log("MRA map init ", allBindings());
        var marker = new google.maps.Marker({
            map: allBindings().map,
            position: allBindings().markerConfig.position,
            icon: 'icons/pin-export.png',
            title: allBindings().markerConfig.title,
            zIndex: 0
        });
        var i = allBindings().markerConfig.title;
        bindingContext.$data._mapMarker = marker;
        bindingContext.$data._markerClickFn = masterVM.mapVM.markerClickFunc(marker, allBindings().markerConfig.title);
        google.maps.event.addListener(marker, 'click', bindingContext.$data._markerClickFn);
    },
    update: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        var mapMarker = bindingContext.$data._mapMarker ;
        // change in backend db (title, position) could have triggered update
        mapMarker.setTitle(allBindings().markerConfig.title);
        mapMarker.setPosition(allBindings().markerConfig.position);
        // search filter triggered update
        mapMarker.setVisible(allBindings().visible());
    }
};

//TODO rename as wrapper
function callFoursquareAPI(lat,lng) {
  url = 'https://api.foursquare.com/v2/venues/search' +
        '?client_id=3MQGWJDDFWX1OGYLXRRTV4FQJ4RKEOXHGHSREFHGFQVYXZZZ' +
        '&client_secret=RZ3VWUPP0WAYLZGKGA1GSZYUBLLPRDQ40YDNG4KE0COFQUVF' +
        '&v=20130815' +
        '&ll=' + lat + ',' + lng +
        '&intent=checkin' +
        '&limit=4'
  // TODO increase limit to try and match close together locations
  console.log(url);
  $.ajax({
    url: url,
    success: function (result) {
      console.log(0,result.response.venues[0].name);
      console.log(1,result.response.venues[1].name);
      console.log(2,result.response.venues[2].name);
      console.log(3,result.response.venues[3].name);
   }
  });
  //TODO ajax failure
}

function initializeMap() {

  var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(MAP_HOME_LAT, MAP_HOME_LNG)
  };

  map = new google.maps.Map(
    document.getElementById('map-canvas'),
    mapOptions
  );

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();
}

function initializeAll() {
  initializeKO();
  initializeMap();
};

$(function() {
  initializeAll();
});

