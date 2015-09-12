
var PIN_ICON = 'icons/pin-export.png';
var STAR_ICON = 'icons/star-3.png';
var MAP_HOME_LAT = 29.967969 ;
var MAP_HOME_LNG = -90.056589;

var map;
// TODO firebase broken?
var firebase = new Firebase("https://popping-heat-1511.firebaseio.com/markers");

var FilterVM = function () {
    var self = this ;
    self.filterText =  ko.observable("");
    self.filterTextPresent = function (baseStr) {
      return ko.computed({
        read: function () {
          return baseStr.toLowerCase().indexOf(self.filterText().toLowerCase()) >= 0;
        }
      });
    };
};

var MapViewModel = function () {
    var self = this ;
    self.lastStarMarker = false ;
    self.markers =  KnockoutFire.observable(
        firebase, {
            "$marker": {
                "content": true,
                "markerConfig": true
            },
            ".newItem": {
                ".priority": function () { return Date.now() }
            }
        }
    );
    self.removeMarker = function (marker) {
        firebase.child(marker.firebase.name()).remove();
    };

    self.venueName = ko.observable("");
    self.venueURL = ko.observable("");
    self.venueAddress = ko.observable("");
    self.venuePhone = ko.observable("");
    self.venueCategory = ko.observable("");

    self.markerClickFunc = function (marker, i) {
                 return function () {
                 console.log("MRA click",i);
                 console.log("MRA click",marker.getPosition().lat());
                 console.log("MRA click",marker.getPosition().lng());
                 foursquareAPIwrapper(marker);
                 if (self.lastStarMarker) {
                     self.lastStarMarker.setIcon(PIN_ICON);
                     self.lastStarMarker.setZIndex(0);
                 }
                 marker.setIcon(STAR_ICON);
                 marker.setZIndex(1);
                 self.lastStarMarker = marker;
            }
        };

    self.clickMarker = function () {
        // make sure markerClickFN has been set up.
        if (typeof this._markerClickFn === "function") {
            this._markerClickFn();
        }
    };
    self.setVenue = function (foursquareVenue) {
        self.venueName(foursquareVenue.name);
        self.venueURL(foursquareVenue.url ? foursquareVenue.url : "" );
        if (foursquareVenue.location) {
          self.venueAddress(foursquareVenue.location.address ? foursquareVenue.location.address : "");
        } else {
          self.venueAddress("");
        }
        if (foursquareVenue.contact) {
          self.venuePhone(foursquareVenue.contact.formattedPhone ? foursquareVenue.contact.formattedPhone : "");
        } else {
          self.venuePhone("");
        }
        if (foursquareVenue.categories[0]) {
          self.venueCategory(foursquareVenue.categories[0].name ? foursquareVenue.categories[0].name : "");
        } else {
          self.venueCategory("");
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
	//TODO firebase working?
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
	//TODO firebase working?
        var mapMarker = bindingContext.$data._mapMarker ;
        // change in backend db (title, position) could have triggered update
        mapMarker.setTitle(allBindings().markerConfig.title);
        mapMarker.setPosition(allBindings().markerConfig.position);
        // search filter triggered update
        mapMarker.setVisible(allBindings().visible());
    }
};

function foursquareAPIwrapper(gMapMarker) {
  var title = gMapMarker.getTitle(); 
  var position = gMapMarker.getPosition();
  var lat = position.lat(); 
  var lng = position.lng();

  url = 'https://api.foursquare.com/v2/venues/search' +
        '?client_id=3MQGWJDDFWX1OGYLXRRTV4FQJ4RKEOXHGHSREFHGFQVYXZZZ' +
        '&client_secret=RZ3VWUPP0WAYLZGKGA1GSZYUBLLPRDQ40YDNG4KE0COFQUVF' +
        '&v=20130815' +
        '&ll=' + lat + ',' + lng +
        '&intent=checkin' +
        '&limit=4'
  console.log(url);
  $.ajax({
    url: url,
    success: function (result) {
      venues = result.response.venues;
      matchingVenue = {};
      for (i = 0; i < venues.length; i++) {
        if (venues[i].name === title) { 
          matchingVenue = venues[i];
          break;
        }
      }
      console.log(matchingVenue);
      masterVM.mapVM.setVenue(matchingVenue);
   },
   error: function(XMLHttpRequest, textStatus, errorThrown) {
       alert("Difficulty contacting foursquare! " + errorThrown);
   }
  });
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

$(function () {
  initializeAll();
});

