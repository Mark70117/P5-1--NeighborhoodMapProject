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

    self.clickMarker= function() {
      // TODO checkif difined begore calling
      this._markerClickFn();
    };
};

var masterVM = {
  filterVM : new FilterVM(), 
  mapVM: new MapViewModel()
};

function initializeKO() {
  ko.applyBindings(masterVM);
};

// TODO move inside view model
var markerClickFunc = function (marker, i) {
                 return function () {
                 console.log("MRA click",i);
                 console.log("MRA click",marker.getPosition().lat());
                 console.log("MRA click",marker.getPosition().lng());
                 var position = marker.getPosition();
                 callFoursquareAPI(position.lat(), position.lng());
                 // TODO use constant to defind icon
                 if (lastStarMarker) {
                     lastStarMarker.setIcon('icons/pin-export.png');
                 }
                 // TODO use constant to defind icon
                 marker.setIcon('icons/star-3.png');
                 lastStarMarker = marker;
                 //infowindow.setContent(hk_markers[i].name);
                 //infowindow.open(map, marker);
            }
        };

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
	console.log("MRA map init ", allBindings());
        var marker = new google.maps.Marker({
            map: allBindings().map,
            position: allBindings().markerConfig.position,
            icon: 'icons/pin-export.png',
            title: allBindings().markerConfig.title
        });
        var i = allBindings().markerConfig.title;
        bindingContext.$data._mapMarker = marker;
        bindingContext.$data._markerClickFn = markerClickFunc(marker, allBindings().markerConfig.title);
        google.maps.event.addListener(marker, 'click', bindingContext.$data._markerClickFn);
    },
    update: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
	console.log("MRA map update", allBindings());
	console.log("MRA map update", allBindings().visible());
	// TODO use local vars to DRY
        bindingContext.$data._mapMarker.setTitle(allBindings().markerConfig.title);
        bindingContext.$data._mapMarker.setPosition(allBindings().markerConfig.position);
        bindingContext.$data._mapMarker.setVisible(allBindings().visible());
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
        '&limit=1'
  // TODO increase limit to try and match close together locations
  console.log(url);
  $.ajax({
    url: url,
    success: function (result) { console.log(result.response.venues[0].name); }
  });
  //TODO ajax failure
}

function initializeMap() {

  // var mapOptions = {
  //    disableDefaultUI: true
  //};
  // TODO figure better zome and center
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

