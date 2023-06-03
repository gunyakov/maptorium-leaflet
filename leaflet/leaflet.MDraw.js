//------------------------------------------------------------------------------
//Draw polylines route/route history and handle marker position.
//------------------------------------------------------------------------------
L.maptoriumDrawer = L.Control.extend({
  options : {
    centered : false,
    showRoute: false,
    gpsRun: false,
    routeColor: '#932402',
    historyColor: '#ffff77'
  },
  initialize: function (options) {
	  L.setOptions(this, options);
    this._map = false;
    this.marker = false;
    this.history = [];
    this.routeDistance = 0;
    //------------------------------------------------------------------------------
    //Marker
    //------------------------------------------------------------------------------
    this.ship16 = L.icon({
    	iconUrl : 'assets/images/Container-Ship-Top-Red-icon16.png',
    	iconRetinaUrl : 'my-icon@2x.png',
    	iconSize : [16, 16],
    	iconAnchor : [8, 8],
    });
    this.ship24 = L.icon({
    	iconUrl : 'assets/images/Container-Ship-Top-Red-icon24.png',
    	iconRetinaUrl : 'my-icon@2x.png',
    	iconSize : [24, 24],
    	iconAnchor : [12, 12],
    });

    this.ship32 = L.icon({
    	iconUrl : 'assets/images/Container-Ship-Top-Red-icon32.png',
    	iconRetinaUrl : 'my-icon@2x.png',
    	iconSize : [32, 32],
    	iconAnchor : [18, 18],
    });

    this.ship48 = L.icon({
    	iconUrl : 'assets/images/Container-Ship-Top-Red-icon48.png',
    	iconRetinaUrl : 'my-icon@2x.png',
    	iconSize : [48, 48],
    	iconAnchor : [24, 24],
    });
    //--------------------------------------------------------------------------
    //Work with GPS data update
    //--------------------------------------------------------------------------
    //Reset all track data
    this.route = false;
	},
  moveMarker: function(lat, lng, dir = 0) {
    //Create marker if not yet
    if(!this.marker) this._makeMarker(lat, lng);
    //Set marker position
    else this.marker.setLatLng([lat, lng]);
    //Rotate marker according direction
    if(dir) this.marker.setRotationAngle(dir + 90);
  },
  routePoint: function(lat, lng) {
    //If polyline is present on map
    if(this.route) {
      //Get Leaflet point by GPS Coords
      var point = L.latLng(lat, lng);
      //Add point to polyline
      this.route.addLatLng(point);
      let curDistance = this.route.distance("m");
      $("#curDistance").text(curDistance + " mls.");
      // if(this.distance > 0) {
      //   let timeToGo = (this.distance - curDistance) / data['sog'];
      //   $("#timeToGo").html(timeToGo.toFixed(2) + " hrs");
      //   $("#leaveDistance").html((this.distance - curDistance) + " mls.");
      // }
    }
  },
  onAdd: function(map) {
    this._map = map;
    if(this.route) {
      console.log("polyline section");
      map.addLayer(this.route);
    }
    this._update();
    map.on('zoomend', this._update, this);
  },
  centered: function() {
    this.options.centered = !this.options.centered;
    return this.options.centered;
  },
  hideRoute: function() {
    //Remove polyline from map
    this._clean();
  },
  drawRoute: function(points) {
    this._clean();
    let polyline = this._drawPolyline(points, this.options.routeColor);
    this.route = polyline;
    $("#curDistance").text(this.route.distance("m") + " miles.");
    this._map.addLayer(this.route);
    this._update();
  },
  service: function() {
    this.options.gpsRun = !this.options.gpsRun;
    if(!this.options.gpsRun && this.marker) {
      this._map.removeLayer(this.marker);
      this.marker = false;
    }
    return this.options.gpsRun;
  },
  hideHistory: function() {
    if(this._map) {
      for (let [key, value] of Object.entries(this.history)) {
        this._map.removeLayer(value);
      }
    }
    this.history = [];
    this.routeDistance = 0;
  },
  drawPolyline: function(points, color = this.options.historyColor) {
    let polyline = this._drawPolyline(points, color);
    //Save polyline in history storage
    this.history.push(polyline);
    this.routeDistance += polyline.distance("m");
  },
  _drawPolyline: function(points, color) {
    let latlngs = [];
    if(points?.length > 1) {
      //Fill array with leaflet points
      for(i = 0; i < points.length - 1; i++) {
        latlngs.push([points[i]["lat"], points[i]["lon"]])
      }
      //Create Leflet polyline
      let polyline = new L.polyline(latlngs, {
        weight : 1,
        color : color
      });
      //If Leflet create map
      if(this._map) {
        //Add polyline to map
        this._map.addLayer(polyline);
        //Redraw polylines according zoom level
        this._update();
      }
      return polyline;
    }
  },
  _makeMarker: function(lat, lng) {
    //Get Leaflet point by GPS Coords
    var point = L.latLng(lat, lng);
    //If marker is not shown on map yet
    if(!this.marker) {
      //Create new marker
      this.marker = new L.RotaitedMarker(point, {
        icon : this.ship16,
        rotationOrigin: "center center",
      });
    }
    if(this._map) {
      this._map.addLayer(this.marker);
      this._update();
    }
  },
  //----------------------------------------------------------------------------
  //Remove polyline from map
  //----------------------------------------------------------------------------
  _clean: function() {
    if(this.route) {
      this._map.removeLayer(this.route);
      this.route = false;
    }
    if(this.marker) {
      this._map.removeLayer(this.marker);
      this.marker = false;
    }
  },
  //----------------------------------------------------------------------------
  //Update marker and polyline depend of zoom level
  //----------------------------------------------------------------------------
  _update: function() {
    if (this._map.getZoom() <= 4) {
      if(this.marker) this.marker.setIcon(this.ship16);
      if(this.route) this.route.setStyle({weight : 1});
    }

    if (this._map.getZoom() > 4 && this._map.getZoom() <= 7) {
      if(this.marker) this.marker.setIcon(this.ship24);
      if(this.route) this.route.setStyle({weight : 2});
    }

    if (this._map.getZoom() > 7 && this._map.getZoom() <= 10) {
      if(this.marker) this.marker.setIcon(this.ship32);
      if(this.route) this.route.setStyle({weight : 3});
    }

    if (this._map.getZoom() > 10) {
      if(this.marker) this.marker.setIcon(this.ship48);
      if(this.route) this.route.setStyle({weight : 4});
    }
  }
});

L.MDraw = function (options) {
  return new L.maptoriumDrawer(options);
};
