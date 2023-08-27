//------------------------------------------------------------------------------
//Marker
//------------------------------------------------------------------------------
let ship16 = L.icon({
  iconUrl : 'assets/images/Container-Ship-Top-Red-icon16.png',
  iconRetinaUrl : 'my-icon@2x.png',
  iconSize : [16, 16],
  iconAnchor : [8, 8],
});
let ship24 = L.icon({
  iconUrl : 'assets/images/Container-Ship-Top-Red-icon24.png',
  iconRetinaUrl : 'my-icon@2x.png',
  iconSize : [24, 24],
  iconAnchor : [12, 12],
});

let ship32 = L.icon({
  iconUrl : 'assets/images/Container-Ship-Top-Red-icon32.png',
  iconRetinaUrl : 'my-icon@2x.png',
  iconSize : [32, 32],
  iconAnchor : [18, 18],
});

let ship48 = L.icon({
  iconUrl : 'assets/images/Container-Ship-Top-Red-icon48.png',
  iconRetinaUrl : 'my-icon@2x.png',
  iconSize : [48, 48],
  iconAnchor : [24, 24],
});
//------------------------------------------------------------------------------
//Draw polylines route/route history and handle marker position.
//------------------------------------------------------------------------------
L.maptoriumDrawer = L.Control.extend({
  options : {
    centered : false,
    showRoute: false,
    gpsRun: false,
    routeColor: '#932402',
    historyColor: '#ffff77',
    //------------------------------------------------------------------------------
    //Default style for geometry
    //------------------------------------------------------------------------------
    color: '#3388ff',
    fillColor: '#444444',
    fillOpacity: 0.5,
    weight: 2
  },
  initialize: function (options) {
	  L.setOptions(this, options);
    this._map = false;
    this.marker = false;
    this.history = {};
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
  drawRoute: function(points) {
    this._clean();
    let polyline = this._drawPolyline(points, this.options.routeColor, this.options.weight);
    if(polyline) {
      polyline.bringToFront();
      this.route = polyline;
      this._map.addLayer(this.route);
      this._update();
    }
    else {
      console.log("Points empty", points);
    }
    
  },
  routePoint: function(lat, lng) {
    //If polyline is present on map
    if(this.route) {
      //Get Leaflet point by GPS Coords
      var point = L.latLng(lat, lng);
      //Add point to polyline
      this.route.addLatLng(point);
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
      let keys = Object.keys(this.history);
      for(let i = 0; i < keys.length; i++) {
        this._map.removeLayer(this.history[keys[i]]);
      }
    }
    this.history = {};
  },
  drawPolyline: function(points, ID = 0, config) {
    let polyline = this._drawPolyline(points, config?.color || this.options.historyColor, config?.weight || this.options.weight);
    if(polyline) {
      //Save polyline in history storage
      this.history[ID] = polyline;
      polyline.maptoriumID = ID;
      if(config?.name) {
        polyline.bindTooltip(config.name); 
        polyline.name = config.name;
      }
      else {
        polyline.bindTooltip('Polyline ' + ID);
        polyline.name = 'Polyline ' + ID;
      }
      polyline.bindContextMenu(globalPointOptions);
    }
    else {
      console.log("Error create polyline");
    }
  },
  //Add new point to polyline
  pointPolyline: function(ID, lat, lng) {
    let polyline = this.history[ID];
    //If polyline is present on map
    if(polyline) {
      //Get Leaflet point by GPS Coords
      var point = L.latLng(lat, lng);
      //Add point to polyline
      polyline.addLatLng(point);
    }
  },
  //----------------------------------------------------------------------------
  //Draw polygon on map
  //----------------------------------------------------------------------------
  drawPolygon: function(points, ID, options = {name: "", color: this.options.color, fillColor: this.options.fillColor, fillOpacity: this.options.fillOpacity, width: 2}) {
    let latlngs = this._convertPoints(points);
    let polygon = L.polygon(latlngs, {
      color: options.color,
      fillColor: options.fillColor,
      fillOpacity: options.fillOpacity,
      weight: options.width
    });
    polygon.maptoriumID = ID;
    
    if(options.name) {
      polygon.bindTooltip(options.name); 
      polygon.name = options.name;
    }
    else {
      polygon.bindTooltip('Poi ' + ID);
      polygon.name = 'Poi ' + ID;
    }
    polygon.shape = "polygon";
    if(this._map) polygon.addTo(this._map);
    else console.log("Map is empty");
    polygon.bindContextMenu(globalPolygonOptions);
    polygon.bringToFront();
  },
  drawPoint: function(pointInfo) {
    let marker = L.marker([pointInfo.lat, pointInfo.lng], {
      title: pointInfo.name
    }).addTo(map);
    marker.maptoriumID = pointInfo.ID;
    marker.bindContextMenu(globalPointOptions);
  },
  //----------------------------------------------------------------------------
  //Convert points from server format to leaflet format
  //----------------------------------------------------------------------------
  _convertPoints: function(points) {
    let latlngs = [];
    if(points?.length > 1) {
      //Fill array with leaflet points
      for(let i = 0; i < points.length; i++) {
        latlngs.push([points[i]["lat"], points[i]["lng"]]);
      }
    }
    return latlngs;
  },
  _drawPolyline: function(points, color, weight) {
    let latlngs = points;
    //let latlngs = this._convertPoints(points);
    if(latlngs?.length > 1) {
      //Create Leflet polyline
      let polyline = new L.polyline(latlngs, {
        weight : weight,
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
    else {
      console.log("Point list empty. Cant create polyline", points);
      return false;
    }
  },
  _makeMarker: function(lat, lng) {
    //Get Leaflet point by GPS Coords
    var point = L.latLng(lat, lng);
    //If marker is not shown on map yet
    if(!this.marker) {
      //Create new marker
      this.marker = L.rotaitedMarker(point, {
        icon : this.ship16,
        rotationOrigin: "center",
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
      if(this.marker) this.marker.setIcon(ship16);
      if(this.route) this.route.setStyle({weight : 1});
    }

    if (this._map.getZoom() > 4 && this._map.getZoom() <= 7) {
      if(this.marker) this.marker.setIcon(ship24);
      if(this.route) this.route.setStyle({weight : 2});
    }

    if (this._map.getZoom() > 7 && this._map.getZoom() <= 10) {
      if(this.marker) this.marker.setIcon(ship32);
      if(this.route) this.route.setStyle({weight : 3});
    }

    if (this._map.getZoom() > 10) {
      if(this.marker) this.marker.setIcon(ship48);
      if(this.route) this.route.setStyle({weight : 4});
    }
  }
});

L.MDraw = function (options) {
  return new L.maptoriumDrawer(options);
};
