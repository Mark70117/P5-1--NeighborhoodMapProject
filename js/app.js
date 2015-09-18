/*
 github.com/Mark70117/P5-1--NeighborhoodMapProject
 by Mark Anderson <Mark70117@ma7.org>
 Project 5 for Udacity Front End Nano Degree
 Neighborhood Map Project
*/

/*global
    Firebase,
    KnockoutFire,
    google,
    $,
    ko
*/


/*
   CONSTANTS
*/
/*
The project "Map Icons Collection" was created by Nicolas Mollet under the Creative Commons Attribution-Share Alike 3.0 Unported license
(CC BY SA 3.0 - http://creativecommons.org/licenses/by-sa/3.0/).
Please credit: Maps Icons Collection https://mapicons.mapsmarker.com
*/
var PIN_ICON = 'icons/pin-export.png';
var STAR_ICON = 'icons/star-3.png';

var FIREBASE_DB_URL = 'https://popping-heat-1511.firebaseio.com/markers';
var MAP_HOME_LAT = 29.967969 ;
var MAP_HOME_LNG = -90.056589;

/*
  GLOBALS
*/
var map;  // singleton google map
var infowindow;  // singleton google map infowindow
var firebase = new Firebase(FIREBASE_DB_URL);
var masterVM;

// Helper function to wrap call to Foursquare API
function foursquareAPIwrapper (gMapMarker) {
    'use strict';
    var title = gMapMarker.getTitle();
    var position = gMapMarker.getPosition();
    var lat = position.lat();
    var lng = position.lng();

    var url = 'https://api.foursquare.com/v2/venues/search' +
        '?client_id=3MQGWJDDFWX1OGYLXRRTV4FQJ4RKEOXHGHSREFHGFQVYXZZZ' +
        '&client_secret=RZ3VWUPP0WAYLZGKGA1GSZYUBLLPRDQ40YDNG4KE0COFQUVF' +
        '&v=20130815' +
        '&ll=' + lat + ',' + lng +
        '&intent=checkin' +
        '&query=' + title +
        '&limit=1';
    $.ajax({
        url: url,
        success: function (result) {
            var venues = result.response.venues;
            if (venues.length > 0) {
                var matchingVenue = venues[0];
                masterVM.mapVM.setVenue(matchingVenue);
            } else {
                alert("Difficulty matching venue on foursquare!");
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert("Difficulty contacting foursquare! " + errorThrown);
        }
    });
}

// KnockoutJS view model for the search/filter string box
var FilterVM = function () {
    'use strict';

    var self = this ;

    self.filterText =  ko.observable("");

    // Boolean function to indicate if search string in present in function parameter
    self.filterTextPresent = function (baseStr) {
        return ko.computed({
            read: function () {
            // ignore case in looking for search string
            return baseStr.toLowerCase().indexOf(self.filterText().toLowerCase()) >= 0;
            }
        });
    };
};

// KnockoutJS view model for the google map
var MapViewModel = function () {
    'use strict';

    var self = this ;

    // keep track of last marker context to be able to close infowindow if
    // marker changes from visible to hidden
    self.lastStarContext = false ;

    // uses KnockoutFire inteface between KnockoutJS and Firebase
    self.markers =  KnockoutFire.observable(
        firebase, {
            "$marker": {
                "content": true,
                "markerConfig": true
            },
            ".newItem": {
                ".priority": function () { return Date.now(); }
            }
        }
    );

    self.removeMarker = function (marker) {
        firebase.child(marker.firebase.name()).remove();
    };

    // Star Marker description
    self.venueName = ko.observable("");
    self.venueURL = ko.observable("");
    self.venueAddress = ko.observable("");
    self.venuePhone = ko.observable("");
    self.venueCategory = ko.observable("");

    // define closure to call foursquare map API for a marker in context
    self.markerClickFunc = function (dataContext) {
        return function () {
            var marker = dataContext._mapMarker;
            foursquareAPIwrapper(marker);
            // if different marker clicked from last time
            if (self.lastStarContext && (dataContext !== self.lastStarContext)) { // if different binding context
		// last marker to give up possession of infoWindo
                self.lastStarContext._possessInfoWindow = false ;
                infowindow.close();
		// undo promotion to star marker
                var lastStarMarker = self.lastStarContext._mapMarker ;
                lastStarMarker.setIcon(PIN_ICON);
                lastStarMarker.setZIndex(0);
            }
            dataContext._possessInfoWindow = true;
            // promote marker to star marker
            marker.setIcon(STAR_ICON);
            marker.setZIndex(1);
            infowindow.setContent('...'); // content will be filled in with async ajax success call to self.setVenue
            infowindow.open(map, marker);
            self.lastStarContext = dataContext;
        };
    };

    // function to duplicate the action of clicking on a marker
    //   used by the list view
    self.clickMarker = function () {
        // make sure markerClickFN has been set up.
        if (typeof this._markerClickFn === "function") {
            this._markerClickFn();
        }
    };

    // convert return result from foursquare to KO obseravables
    //  update google maps infowindow with updated venue content
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
        infowindow.setContent($('#star-marker-desc').html());

    };
};

// create a custom binding map: for KnockoutJS to google maps functionality
ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        'use strict';
        var marker = new google.maps.Marker({
            map: allBindings().map,
            position: allBindings().markerConfig.position,
            icon: 'icons/pin-export.png',
            title: allBindings().markerConfig.title,
            zIndex: 0
        });
        bindingContext.$data._mapMarker = marker;
        bindingContext.$data._possessInfoWindow = false;
        bindingContext.$data._markerClickFn = masterVM.mapVM.markerClickFunc(bindingContext.$data);
        google.maps.event.addListener(marker, 'click', bindingContext.$data._markerClickFn);
    },
    update: function (element, valueAccessor, allBindings, deprecatedVM, bindingContext) {
        'use strict';
        var mapMarker = bindingContext.$data._mapMarker;
        var possessInfoWindow = bindingContext.$data._possessInfoWindow;
        // change in backend db (title, position) could have triggered update
        mapMarker.setTitle(allBindings().markerConfig.title);
        mapMarker.setPosition(allBindings().markerConfig.position);
        // search filter triggered update
        var isVisible= allBindings().visible();
        mapMarker.setVisible(isVisible);
        // when marker gets hidden, close associated infowindow
        if (!isVisible && possessInfoWindow) {
            bindingContext.$data._possessInfoWindow = false;
            infowindow.close();
        }
    }
};

// master VM to encapsulate sub view modules
masterVM = {
    filterVM : new FilterVM(),
    mapVM: new MapViewModel()
};

// init function for KnockoutJS binding
function initializeKO() {
    'use strict';
    ko.applyBindings(masterVM);
}

// init function for google map
function initializeMap() {
    'use strict';
    var mapOptions = {
        zoom: 15,
        center: new google.maps.LatLng(MAP_HOME_LAT, MAP_HOME_LNG)
    };

    map = new google.maps.Map(
        document.getElementById('map-canvas'),
        mapOptions
    );
    infowindow = new google.maps.InfoWindow({ content: '...' });
}

// initialize view models and map when DOM is ready
$(function () {
    'use strict';
    initializeKO();
    initializeMap();
});
