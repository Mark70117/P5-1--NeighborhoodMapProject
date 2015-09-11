var map;
var lastStarMarker ;
var firebase = new Firebase("https://popping-heat-1511.firebaseio.com/markers");

var FilterVM = function() {
    var self = this ;
    self.filterText =  ko.observable("");
    self.foobar = function(foo) {
      return ko.computed({
        read: function() {
          console.log("MRA FOO: ",foo);
          return self.filterText() === foo;
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


};

var masterVM = {
  filterVM : new FilterVM(), 
  mapVM: new MapViewModel()
};

function initializeKO() {
  ko.applyBindings(masterVM);
};

//theFilterVM.filterText.subscribe(function(newValue) {
// console.log("MRA subcribe func");
//});

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        console.log("MRA ","ko.bindingHandler.map ","init enter");
        console.log("MRA ","ko.bindingHandler.map ", element);
        console.log("MRA ","ko.bindingHandler.map ", valueAccessor);
        console.log("MRA ","ko.bindingHandler.map ", allBindings().map);
        var marker = new google.maps.Marker({
            map: allBindings().map,
            position: allBindings().markerConfig.position,
            icon: 'icons/pin-export.png',
            title: allBindings().markerConfig.title
        });
        var i = allBindings().markerConfig.title;
             google.maps.event.addListener(marker, 'click', (function (marker, i) {
                 return function () {
                 console.log("MRA click",i);
                 console.log("MRA click",marker.getPosition().lat());
                 console.log("MRA click",marker.getPosition().lng());
                 var position = marker.getPosition();
                 callFoursquareAPI(position.lat(), position.lng());
                 if (lastStarMarker) {
                     lastStarMarker.setIcon('icons/pin-export.png');
                 }
                 marker.setIcon('icons/star-3.png');
                 lastStarMarker = marker;
                 //infowindow.setContent(hk_markers[i].name);
                 //infowindow.open(map, marker);
            }
        })(marker, i));
    bindingContext.$data._mapMarker = marker;
    },
    update: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        console.log("MRA ","ko.bindingHandler.map ","update enter");
        bindingContext.$data._mapMarker.setTitle(allBindings().markerConfig.title);
        bindingContext.$data._mapMarker.setPosition(allBindings().markerConfig.position);
    }
};

function callFoursquareAPI(lat,lng) {
  url = 'https://api.foursquare.com/v2/venues/search' +
        '?client_id=3MQGWJDDFWX1OGYLXRRTV4FQJ4RKEOXHGHSREFHGFQVYXZZZ' +
        '&client_secret=RZ3VWUPP0WAYLZGKGA1GSZYUBLLPRDQ40YDNG4KE0COFQUVF' +
        '&v=20130815' +
        '&ll=' + lat + ',' + lng +
        '&intent=checkin' +
        '&limit=1'
  console.log(url);
  $.ajax({
    url: url,
    success: function (result) { console.log(result.response.venues[0].name); }
  });
}

function initializeMap() {

  // var mapOptions = {
  //    disableDefaultUI: true
  //};
  var mapOptions = {
    zoom: 16,
    center: new google.maps.LatLng(29.966027, -90.061787)
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

