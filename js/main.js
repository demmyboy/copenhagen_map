
// Creating the Model where the location details is stored// 
var areaData = [
  {
    name: "Eatery",
    address: "Rådhusstræde 5",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=r%C3%A5dhusstr%C3%A6de",
    latitude: 55.676964,
    longitude: 12.574255,
    marker: ''
  },
  {
    name: "The Foot Locker",
    address: "Amagertorv 11",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=amagertorv%2011",
    latitude: 55.678665,
    longitude: 12.578270,
    marker: ''
  },
  {
    name: "Royal Bagel",
    address: "Valkendorfsgade 7",
    streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=valkendorfsgade",
    latitude: 55.680077,
    longitude: 12.577937,
    marker: ''
  },
  {
    name: "Netto (Shopping)",
    address: "Nørre Voldgade 94",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=N%C3%B8rre%20Voldgade%2094",
    latitude: 55.683752,
    longitude: 12.573103,
    marker: ''
  },
  {
    name: "Pizza Perfecto",
    address: "Søborg Hovedgade 29",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=S%C3%B8borg%20Hovedgade%2029",
    latitude:55.730302,
    longitude: 12.521172,
    marker: ''
  },
  {
    name:"Roskilde Museum",
    address:"Sankt Ols Stræde 3",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Sankt%20Ols%20Stræde%203",
    latitude:55.641910,
    longitude: 12.087845,
    marker: ''
  },
  {
    name:"Nordea Bank",
    address:"Jernbanegade 11",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Jernbanegade%2011",
    latitude: 55.835592,
    longitude: 12.062436,
    marker: ''
  },
  {
    name:"Q8 Tankstation",
    address:"Frederiksborgvej 9",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Frederiksborgvej%209",
    latitude: 55.812721,
    longitude: 12.376593,
    marker: ''
  },
  {
    name: "Hospital",
    address: "Herlev Ringvej 75",
    streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Herlev%20Ringvej%2075",
    latitude: 55.731009,
    longitude: 12.443272,
    marker: ''
  }
];

//Creating observables using KO best practise
var Place = function (data) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.streetView = ko.observable(data.streetView);
  this.latitude = ko.observable(data.latitude);
  this.longitude = ko.observable(data.longitude);
  this.marker = '';
};

//Global Variables
var map;
var infoWindow;
var marker;

function initMap () {


//View Model Proper
var AppViewModel = function () {

  // Checking strings in the searched menu
  var stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length) {
        return false;
    }
    return string.substring(0, startsWith.length) === startsWith;
  };

  //replacing this with self from now. 
  var self = this;

  // this is the location that the viewer sees when the page is loaded (heart of Copenhagen)
  var mapOptions = {
    zoom: 10,
    center: {lat: 55.676097, lng: 12.568337}
  };

  map = new google.maps.Map(document.getElementById("map"),
      mapOptions);

  //Create event listener to cause map to resize and remain centered in response to a window resize
  google.maps.event.addDomListener(window, "resize", function() {
			var center = map.getCenter();
			google.maps.event.trigger(map, "resize");
			map.setCenter(center);
  });

  // Observable arrays for the markers
  self.markerArray = ko.observableArray(areaData);

  //Create markers to populate the map with respect to the Location Details
  self.markerArray().forEach(function(location) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(location.latitude, location.longitude),
      map: map,
      title: location.name,
      animation: google.maps.Animation.DROP
    });

    location.marker = marker;

    // implementig the bounce effect
    location.marker.addListener('click', toggleBounce);

    function toggleBounce() {
      if (location.marker.getAnimation() !== null) {
        location.marker.setAnimation(null);
      } else {
        location.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ location.marker.setAnimation(null); }, 2100);
      }
    }

    //Create variables for use in contentString for infowindows which shows when the marker is shown
    var placeNames = location.name;
    var placeAddresses = location.address;
    var placeStreetView = location.streetView;

    
    infoWindow = new google.maps.InfoWindow();

    //Create event listener to open infowindow when marker is clicked
    google.maps.event.addListener(location.marker, 'click', function() {
          //Create contentString variable for infowindows
          var contentString;

          //Alter location.name content to account for symbols and spaces
          var alteredName = encodeURI(location.name);

          //Wikipedia API request URL
          var wikiUrl = "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=" + alteredName + "&limit=1&redirects=return&format=json";

          //AJAX request for Wikipedia API information used in infowindows
          $.ajax ({
            url: wikiUrl,
            dataType: "jsonp",
            success: function ( response ){
              var articleList = response[1];
              /* Pulls up information about each marker(location) depending on the information 
                  in the locationDetails() function*/
              if (articleList.length > 0) {
                for (var i=0; i<articleList.length; i++) {
                  articleStr = articleList[i];
                  var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                  contentString = '<div id="content">' + placeNames + '<p>' + placeAddresses + '</p>' + '<p>' + response[2] + '</p>' + '<a href=" ' + url + '">' + url + '</a>' + '<img class="img-responsive" src=" ' + placeStreetView + '">' +'</div>';
                  infoWindow.setContent(contentString);
                  console.log(response);
                }
                console.log(wikiUrl);
              //this code will run if there is no info about the particular location in the wiki
              } else {
                contentString = '<div id="content">' + placeNames + '<p>' + placeAddresses + '</p>' + '<p>' + 'No articles found in the Wiki at the moment, maybe later'+ '</p>' +'<img class="img-responsive" src=" ' + placeStreetView + '">' + '</div>';
                console.log(wikiUrl);
                infoWindow.setContent(contentString);
              }
            }
          //this code will run if the the wiki cannot be reached at the moment, mayb due to internet connection
          }).error(function(e){
            contentString = '<div id="content">' + placeNames + '<p>' + placeAddresses + '</p>' + '<p>' + 'Cannot connect to reach Wikipedia'+ '</p>' + '</div>';
            infoWindow.setContent(contentString);
          });
      //open the infoWindow
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

  /* This allows the input of the user to be visible so long it is on the list, i.e 
        it filters out the location that is not being typed in by the user*/
  self.filteredPlaces = ko.computed(function(location) {
    var filter = self.query().toLowerCase();
    //If there is nothing in the filter, return the full list and all markers are visible
    if (!filter) {
      self.markerArray().forEach(function(location) {
          location.marker.setVisible(true);
        });
      return self.markerArray();
    } else {
        return ko.utils.arrayFilter(self.markerArray(), function(location) {
          is_filtered = stringStartsWith(location.name.toLowerCase(), filter);
           if (is_filtered) {
              location.marker.setVisible(true);
              console.log("clicked");
              return is_filtered;
            }
           else {
              location.marker.setVisible(false);
              return is_filtered;
            }
        });
      }
  }, self);
};

//Call the AppViewModel function
ko.applyBindings(new AppViewModel());
}


