var map;
var firebase = new Firebase("https://popping-heat-1511.firebaseio.com/markers");
var viewModel = {
    "markers": KnockoutFire.observable(
        firebase, {
            "$marker": {
                "content": true,
                "markerConfig": true
            },
            ".newItem": {
                ".priority": function() { return Date.now() }
            }
        }
    ),
    "removeMarker": function(marker) {
        firebase.child(marker.firebase.name()).remove();
    }
};

function initializeKO() {
  ko.applyBindings(viewModel, document.getElementById("markers"));
};

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        var marker = new google.maps.Marker({
            map: allBindings().map,
            position: allBindings().markerConfig.position,
            title: allBindings().markerConfig.title
        });
	bindingContext.$data._mapMarker = marker;
    },
    update: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        bindingContext.$data._mapMarker.setTitle(allBindings().markerConfig.title);
        bindingContext.$data._mapMarker.setPosition(allBindings().markerConfig.position);
    }
};


function initializeMap() {

  // var mapOptions = {
  //    disableDefaultUI: true
  //};
  var mapOptions = {
    zoom: 16,
    center: new google.maps.LatLng(29.966027, -90.061787)
  };

  map = new google.maps.Map(
    document.getElementById('mapContainer'),
    mapOptions
  );

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();
}

function initializeAll() {
  initializeKO();
  initializeMap();
};

window.addEventListener('load', initializeAll);
//window.addEventListener('resize', function(e) {
//    //Make sure the map bounds get updated on page resize
//    map.fitBounds(window.mapBounds);
//});
