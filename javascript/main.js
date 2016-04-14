var locationDetails = function() {
    "use strict";
    // This is an array that stores the information of every marker on indicated on the map
    var areaData = [{
        areaName:"Rådhusstræde 5",
        areaDescription:"Eatery",
        areaStr:"Copenhagen",
        streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=r%C3%A5dhusstr%C3%A6de",
        latLng:{
            lat:55.676964,
            lng:12.574255
        }, 
    },
    {   areaName:"Amagertorv 11",
        areaDescription:"The Foot Locker",
        areaStr: "Copenhagen",
        streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=amagertorv%2011",
        latLng:{
            lat:55.678665,
            lng:12.578270
        },
    },{ 
        areaName:"Valkendorfsgade 7",
        areaDescription:"Royal Bagel",
        areaStr: "Copenhagen",
        streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=valkendorfsgade",
        latLng:{
            lat:55.680077,
            lng:12.577937
        },
    },
    {   areaName:"Nørre Voldgade 94",
        areaDescription:"Netto (Shopping)",
        areaStr:"Copenhagen",
        streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=N%C3%B8rre%20Voldgade%2094",
        latLng:{
            lat:55.683752,
            lng:12.573103
        },
    },
    {
        areaName: "Søborg Hovedgade 29",
        areaDescription: "Pizza Perfecto",
        areaStr: "Copenhagen",
        streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=S%C3%B8borg%20Hovedgade%2029",
        latLng:{
            lat: 55.730302,
            lng: 12.521172
        },
    },
    {
        areaName: "Herlev Ringvej 75",
        areaDescription: "Hospital",
        areaStr: "Copenhagen",
        streetView:"http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Herlev%20Ringvej%2075",
        latLng:{
            lat: 55.731009,
            lng: 12.443272
        },
    },
    {
        areaName: "Sankt Ols Stræde 3",
        areaDescription: "Roskilde Museum",
        areaStr: "Copenhagen",
        streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Sankt%20Ols%20Stræde%203",
        latLng:{
            lat:55.641910,
            lng: 12.087845
        },
    },
    {
        areaName: "Jernbanegade 11",
        areaDescription: "Nordea Bank",
        areaStr: "Copenhagen",
        streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Jernbanegade%2011",
        latLng:{
            lat:55.835592,
            lng: 12.062436
        },
    },
    {
        areaName: "Frederiksborgvej 9",
        areaDescription: "Q8 Tankstation",
        areaStr: "Copenhagen",
        streetView: "http://maps.googleapis.com/maps/api/streetview?size=150x150&location=Frederiksborgvej%209",
        latLng:{
            lat:55.812721,
            lng: 12.376593
        },
    }];

    var ViewModel = function() {

        var self = this;
        self.googleMap = new google.maps.Map(document.getElementById('map'), {
            center:{ // this is the location that the viewer sees when the page is loaded.
                lat: 55.676097,
                lng: 12.568337
            },
            zoom: 10
        });

        
        /* The empty array creates the information of location and a new location 
        is stored everytime the push is called */
        self.allLocations = [];
        areaData.forEach(function(location) {
            self.allLocations.push(new Location(location));
        });

        /* Pulls up information about each marker(location) depending on the information 
         in the locationDetails() function*/
        self.allLocations.forEach(function(location) {
            var information = '<div class="markerInfo text-center row">' + '<h1>' + location.areaName + '</h1>' + '<h2>' + location.areaDescription + '</h2>' +
                '<img class="img-responsive" src=" ' + location.streetView + '"> ' + "<div id='pullUpDetails'></div>" + '</div>';

            var markerOptions = {
                map: self.googleMap,
                position: location.latLng,
                draggable: false,
                animation: google.maps.Animation.DROP,
                content: information
            };
            location.marker = new google.maps.Marker(markerOptions);

            location.marker.infoWindow = new google.maps.InfoWindow({
                position: location.latLng,
                content: information
            });
            location.marker.infoWindow.setContent(location.marker.content);

            location.marker.addListener('click', function toggleBounce() {
                location.marker.infoWindow.open(self.googleMap);
                getApi();
                if (location.marker.getAnimation() !== null) {
                    location.marker.setAnimation(null);
                } else {
                    location.marker.setAnimation(google.maps.Animation.BOUNCE);
                }
                setTimeout(function() {
                    location.marker.setAnimation(null);
                }, 1400);
            });

            var getApi = function() {

                var pullup = $('#pullUpDetails');
                var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + location.areaStr + '&format=json&callback=wikiCallback';
                var wikiRequestTimeout = setTimeout(function() {
                    pullup.text("wiki info cannot be found at the moment, try again later");
                }, 8000);

                $.ajax({
                    url: wikiUrl,
                    dataType: "jsonp",
                    jsonp: "callback",
                    success: function(response) {
                        var articleList = response[1];
                        var i;
                        var article;
                        var url;
                        pullup.text('');
                        for (i = 0; i < articleList.length; i+=1) {
                            article = articleList[i];
                            url = 'http://en.wikipedia.org/wiki/' + article;
                            pullup.append('<li class="text-center"><a href="' + url + '">' + article + '</a></li>');
                        }
                        clearTimeout(wikiRequestTimeout);
                    }
                });
            };
        });
        // this is the way knockout will make the arrays visible
        self.visible = ko.observableArray();
        
        self.allLocations.forEach(function(location) {
            self.visible.push(location);
        });
        self.userInput = ko.observable('');
         /* This allows the input of the user to be visible so long it is on the list, i.e 
        it filters out the location that is not being typed in by the user*/

        self.filterMarkers = function() {

            var searchInput = self.userInput().toLowerCase();

            self.visible.removeAll();


            self.allLocations.forEach(function(location) {
                location.marker.setMap(null);

                if (location.areaDescription.toLowerCase().indexOf(searchInput) !== -1) {
                    self.visible.push(location);
                };
            });

            self.visible().forEach(function(location) {
                location.marker.setMap(self.googleMap);
            });
        };

        function Location(showAll) {
            this.areaName = showAll.areaName;
            this.areaDescription = showAll.areaDescription;
            this.streetView = showAll.streetView;
            this.latLng = showAll.latLng;
            this.areaStr = showAll.areaStr;
            // You will save a reference to the locations' map marker after you build the
            // marker:
            this.openInfoWindow = function() {
                this.marker.infoWindow.open(self.googleMap, this.marker);
            };
            this.marker = null;
        };
    };
    ko.applyBindings(new ViewModel());
};