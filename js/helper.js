
var map;
console.log("MRA ","enter helper.js");

function initializeMap() {
  console.log("MRA ","enter initializeMap");

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

window.addEventListener('load', initializeMap);
window.addEventListener('resize', function(e) {
    //Make sure the map bounds get updated on page resize
    map.fitBounds(window.mapBounds);
});
