////**Model Data**////

//Identify place information in an array
var initialMarkers = [
  {
    name: 'Union College',
    address: '807 Union St, Schenectady, NY 12308',
    latitude: 42.817765,
    longitude: -73.930548,
    marker: ''
  },
  {
    name: 'Schenectady County Community College',
    address: '78 Washington Avenue, Schenectady, NY 12305',
    latitude: 42.815087,
    longitude: -73.953974,
    marker: ''
  },
  {
    name: 'General Electric',
    address: '1 River Road, Schenectady, NY 12345',
    latitude: 42.810269,
    longitude: -73.953759,
    marker: ''
  },
  {
    name: 'First Reformed Church of Schenectady',
    address: '8 North Church Street, Schenectady, NY 12305',
    latitude: 42.817104,
    longitude: -73.947059,
    marker: ''
  },
  {
    name: 'Bow Tie Cinemas',
    address: '400 State St, Schenectady, NY 12305',
    latitude: 42.812920,
    longitude:  -73.942673,
    marker: ''
  },
  {
    name: 'Amtrak',
    address: '332 Erie Blvd, Schenectady, NY 12305',
    website: 'amtrak.com',
    latitude: 42.814612,
    longitude: -73.942893,
    marker: ''
  }
];

//Construct Place data using ko.observable so data is updated in real time when changed
var Place = function (data) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.website = ko.observable(data.website);
  this.latitude = ko.observable(data.latitude);
  this.longitude = ko.observable(data.longitude);
  this.marker = '';
};

////**View Model**////

//Create global variables for use in map functions
var map;
var infoWindow;
var marker;

//Create callback function for Google map async load
function initMap () {
//Create View Model main function
var AppViewModel = function () {

  //Function to assist with filteredPlaces list by checking the beginning of string searched
  var stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length) {
        return false;
    }
    return string.substring(0, startsWith.length) === startsWith;
  };

  //Variable to keep references of "this" inside the View Model
  var self = this;

  //Create map centered on Schenectady, NY
  var mapOptions = {
    zoom: 15,
    center: {lat: 42.814113, lng: -73.939643}
  };

  map = new google.maps.Map(document.getElementById("map"),
      mapOptions);

  //Create event listener to cause map to resize and remain centered in response to a window resize
  google.maps.event.addDomListener(window, "resize", function() {
			var center = map.getCenter();
			google.maps.event.trigger(map, "resize");
			map.setCenter(center);
  });

  //Create observable array for markers
  self.markerArray = ko.observableArray(initialMarkers);

  //Create markers that populate on the map and correspond to the locations identified in the initialMarkers array
  self.markerArray().forEach(function(placeItem) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(placeItem.latitude, placeItem.longitude),
      map: map,
      title: placeItem.name,
      animation: google.maps.Animation.DROP
    });

    placeItem.marker = marker;

    //Add bounce animation to markers when clicked or selected from list
    placeItem.marker.addListener('click', toggleBounce);

    function toggleBounce() {
      if (placeItem.marker.getAnimation() !== null) {
        placeItem.marker.setAnimation(null);
      } else {
        placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ placeItem.marker.setAnimation(null); }, 2100);
      }
    }

    //Create variables for use in contentString for infowindows
    var windowNames = placeItem.name;
    var windowAddresses = placeItem.address;

    //Create new infowindow
    infoWindow = new google.maps.InfoWindow();

    //Create event listener to open infowindow when marker is clicked
    google.maps.event.addListener(placeItem.marker, 'click', function() {
          //Create contentString variable for infowindows
          var contentString;

          //Alter placeItem.name content to account for symbols and spaces
          var alteredName = encodeURI(placeItem.name);

          //Wikipedia API request URL
          var wikiUrl = "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=" + alteredName + "&limit=1&redirects=return&format=json"

          //AJAX request for Wikipedia API information used in infowindows
          $.ajax ({
            url: wikiUrl,
            dataType: "jsonp",
            success: function ( response ){
              var articleList = response[1];
              //If an article is found, populate infowindow with content string information showing Wikipedia response
              if (articleList.length > 0) {
                for (var i=0; i<articleList.length; i++) {
                  articleStr = articleList[i];
                  var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                  contentString = '<div id="content">' + windowNames + '<p>' + windowAddresses + '</p>' + '<p>' + response[2] + '</p>' + '<a href=" ' + url + '">' + url + '</a>' + '</div>'
                  infoWindow.setContent(contentString);
                  console.log(response);
                }
                console.log(wikiUrl);
              //If no article is found, populate infowindow with content string reflecting no articles were found
              } else {
                contentString = '<div id="content">' + windowNames + '<p>' + windowAddresses + '</p>' + '<p>' + 'No articles found on Wikipedia'+ '</p>' + '</div>'
                console.log(wikiUrl);
                infoWindow.setContent(contentString);
              }
            }
          //Communicate error when Wikipedia API is unable to be reached or is not available
          }).error(function(e){
            contentString = '<div id="content">' + windowNames + '<p>' + windowAddresses + '</p>' + '<p>' + 'Failed to reach Wikipedia'+ '</p>' + '</div>'
            infoWindow.setContent(contentString);
          });
      //Call to open the infowindow
      console.log("clicked");
      infoWindow.open(map, this);
    });
  });

  //Function to connect marker triggers to list selection, allows markers to animate and infowindows to open when list is clicked
  self.markerTrigger = function(marker) {
        google.maps.event.trigger(this.marker, 'click');
  };

  //Create observable for information typed into the search bar
  self.query= ko.observable('');

  //Create a ko.computed for the filtering of the list and the markers
  self.filteredPlaces = ko.computed(function(placeItem) {
    var filter = self.query().toLowerCase();
    //If there is nothing in the filter, return the full list and all markers are visible
    if (!filter) {
      self.markerArray().forEach(function(placeItem) {
          placeItem.marker.setVisible(true);
        });
      return self.markerArray();
    //If a search is entered, compare search data to place names and show only list items and markers that match the search value
    } else {
        return ko.utils.arrayFilter(self.markerArray(), function(placeItem) {
          is_filtered = stringStartsWith(placeItem.name.toLowerCase(), filter);
          //Show markers that match the search value and return list items that match the search value
           if (is_filtered) {
              placeItem.marker.setVisible(true);
              console.log("clicked");
              return is_filtered
            }
          //Hide markers that do not match the search value
           else {
              placeItem.marker.setVisible(false);
              return is_filtered
            }
        });
      }
  }, self);
};

//Call the AppViewModel function
ko.applyBindings(new AppViewModel());
};

////**References**////
//Using "this" instead of "self" with markers: http://you.arenot.me/2010/06/29/google-maps-api-v3-0-multiple-markers-multiple-infowindows/
//Assisted with creation of list and list filter:http://opensoul.org/2011/06/23/live-search-with-knockoutjs/
//Assisted with creation of list filter: http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
//stringStartsWith function for ko filter: http://stackoverflow.com/questions/28042344/filter-using-knockoutjs
//Function use to resize map in response to window resize: http://codepen.io/hubpork/pen/xriIz
