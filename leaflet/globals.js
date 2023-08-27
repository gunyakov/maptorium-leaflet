//------------------------------------------------------------
//Init leaflet map
//------------------------------------------------------------
let heightAdjust = $(document).height() - $(".navbar-header").height() + 2;
$("#leaflet-map").height(heightAdjust);

let map = L.map('leaflet-map', {
    editable: true,
    contextmenu: true,
    worldCopyJump: true,
    maxBoundsViscosity: 1,
    attributionControl: false,
    contextmenuItems: [{
        text: 'Add placemark',
        iconCls: 'mdi mdi-pin-outline',
        callback: function(e) {
          $("[name=lat]").attr("m-fix", "yes");
          $("[name=lat]").val(e.latlng.lat);
          $("[name=lng]").val(e.latlng.lng);
          $("#markAddModal").modal("show");
        },
      },
      '-',
      {
        text: "Force...",
        iconCls: "mdi mdi-download-multiple",
        contextmenuItems: [
          {
            text: 'Force download map tile to cache',
            callback: function() {}, //downloadTileMap,
            iconCls: "mdi mdi-download-multiple"
          },
          {
            text: 'Force download overlay tile to cache',
            callback: function() {}, //downloadTileOverlay,
            iconCls: "mdi mdi-download-multiple"
          },
          {
            text: 'Force download visible map tile to cache',
            callback: function() {}, //downloadTileMapForce,
            iconCls: "mdi mdi-download-multiple"
          },
          {
            text: 'Force download visible overlay tile to cache',
            callback: function() {}, //downloadTileOverlayForce,
            iconCls: "mdi mdi-download-multiple"
          }
        ]
      }
      ]
}).setView([39, 0], 5);
//------------------------------------------------------------------------------
//Drawer
//------------------------------------------------------------------------------
let MDrawer = L.MDrawer();
MDrawer.addTo(map);
M.on("start.polyline", () => {
  MDrawer.start();
});
M.on("stop.polyline", () => {
  MDrawer.stop();
});
M.on("save.polyline", () => {
  let POIInfo = MDrawer.save();
  M.addPOI(POIInfo, true);
});
M.on("start.square", () => {
  MDrawer.start("square");
});
M.on("stop.square", () => {
  MDrawer.stop();
});
M.on("save.square", () => {
  let POIInfo = MDrawer.save();
  M.addPOI(POIInfo, true);
});
M.on("start.polygon", () => {
  MDrawer.start("polygon");
});
M.on("stop.polygon", () => {
  MDrawer.stop();
});
M.on("save.polygon", () => {
  let POIInfo = MDrawer.save();
  M.addPOI(POIInfo, true);
});
//Save map center to default config (used to restore when page reload)
map.on("moveend", () => {
  M.updateMapPosition(map.getCenter()['lat'], map.getCenter()['lng'], map.getZoom());
});
// map.on("zoomend", () => {
//   //console.log(map.getBounds(), map.getZoom());
// });
map.on("moveend", () => {
  let bounds = map.getBounds();
  bbox = [bounds._northEast.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._southWest.lat];
  M.cachedMap.setBBOX(bbox);
  M.cachedMap.setZoom(map.getZoom());
});

async function POIDelete(e) {
    let result = await M.deletePOI(e.relatedTarget.maptoriumID);
    if(result) e.relatedTarget.remove();
}

async function POIModal(e) {
    let ID = e.relatedTarget.maptoriumID;
    //Open modal to set POI colors style
    M.POIModal(ID, function(poiID, style) {
      //Callback to change POI style according settings
      map.eachLayer(function(layer) {
        if(layer.maptoriumID == poiID) {
          style.weight = style.width;
          layer.setStyle(style);
          if(style.name) layer.bindTooltip(style.name);
          else layer.bindTooltip('Poi ' + ID);
        }
      });
    });
}

let PoiIDforEdit = 0;
let POIForEdit = {
    type: "",
    points: [],
};
//-----------------------------------------------------------------------------------------------
//POI Edit
//-----------------------------------------------------------------------------------------------
async function POIEdit(e) {
  //Open POI edit panel
  M.DOM.POIEdit();
  PoiIDforEdit = e.relatedTarget.maptoriumID;
  //Enable POI edit on map using plugin
  map.eachLayer(function(layer) {
    if(layer.maptoriumID == PoiIDforEdit) {
      POIForEdit.type = layer.shape;
      POIForEdit.points = [...layer.getLatLngs()[0]];
      layer.enableEdit();
    }
  });
}
//Callbalck, when POI edit panel Save Button called
M.on("poi.save", () => {
  map.eachLayer(function(layer) {
    if(layer.maptoriumID == PoiIDforEdit) {
      //Disable POI edit
      layer.disableEdit();
      //Get new coords
      let points = layer.getLatLngs();
      //Send new coords to server
      M.updatePOI(PoiIDforEdit, layer.shape, points[0]);
      //Reset POI ID
      PoiIDforEdit = 0;
    }
  });
});

M.on("poi.savenew", () => {
  map.eachLayer(async function(layer) {
    if(layer.maptoriumID == PoiIDforEdit) {
      //Disable POI edit
      await layer.disableEdit();
      //Get new coords
      let points = layer.getLatLngs();
      //Send new coords to server
      let geometry = {
        type: layer.shape,
        color: layer.options.color,
        fillColor: layer.options.fillColor,
        fillOpacity: layer.options.fillOpacity,
        points: points[0],
      }
      MDraw.drawPolygon(POIForEdit.points, layer.maptoriumID, {
        name: layer.name,
        color: layer.options.color,
        fillColor: layer.options.fillColor,
        fillOpacity: layer.options.fillOpacity,
        width: layer.options.weight
      });
      map.removeLayer(layer);
      let poiID = await M.addPOI(geometry);
      console.log("New POI ID", poiID);
      if(poiID > 0) MDraw.drawPolygon(points[0], poiID);
      //Reset POI ID
      PoiIDforEdit = 0;
    }
  });
  
});
//-----------------------------------------------------------------------------------------------
//POI Download tiles
//-----------------------------------------------------------------------------------------------
let PoiIDForDownload = 0;
async function POIDownload(e) {
  PoiIDForDownload = e.relatedTarget.maptoriumID;
  M.DOM.POIDownload(PoiIDForDownload);
}

async function GenerateMap(e) {
  let poiID = e.relatedTarget.maptoriumID;
  M.DOM.GenerateMapModal(poiID);
}

function cachedMapActivate(e) {
  M.cachedMap.show(e.relatedTarget.maptoriumID);
}
//----------------------------------------------------------------------------
//Global polygon options
//----------------------------------------------------------------------------
let globalPolygonOptions = {
    contextmenu: true,
    //contextmenuWidth: 140,
    contextmenuInheritItems: true,
    contextmenuItems: [
    '-',
    {
      text: 'Properties...',
      callback: POIModal,
      iconCls: "mdi mdi-application-cog"
    },
    {
      text: 'Edit...',
      callback: POIEdit,
      iconCls: "mdi mdi-circle-edit-outline"
    },
    {
      text: 'Bring to back',
      callback: function() {}, //bringToBack,
      iconCls: "mdi mdi-arrange-send-backward"
    },
    {
      text: 'Add to merge bar',
      callback: function() {}, //showPolygonMergeBar,
      iconCls: "mdi mdi-checkerboard-plus"
    },
    {
      text: 'Start download job...',
      callback: POIDownload, //window.showJobModal,
      iconCls: "mdi mdi-auto-download"
    },
    {
      text: 'Generate map...',
      callback: GenerateMap,
      iconCls: "mdi mdi-auto-download"
    },
    {
      text: 'Tile cached map...',
      iconCls: "mdi mdi-data-matrix-plus",
      callback: cachedMapActivate
    },
    '-',
    {
      text: 'Delete',
      callback: POIDelete,
      iconCls: "mdi mdi-delete-outline"
    }]
}
//----------------------------------------------------------------------------
//Global polygon options
//----------------------------------------------------------------------------
let globalPointOptions = {
  contextmenu: true,
  //contextmenuWidth: 140,
  contextmenuInheritItems: true,
  contextmenuItems: [
  '-',
  {
    text: 'Properties',
    callback: POIModal,
    iconCls: "mdi mdi-application-cog"
  },
  '-',
  {
    text: 'Delete',
    callback: POIDelete,
    iconCls: "mdi mdi-delete-outline"
  }]
}
//----------------------------------------------------------------------------
//HYBRID VECTOR MAP STYLE
//----------------------------------------------------------------------------
let vectorHybridOverlayStyle = {
  rendererFactory: L.canvas.tile,
  attribution: "",
  subdomains: '0123',	// 01234 for openmaptiles, abcd for mapbox
  maxNativeZoom: 20,
  vectorTileLayerStyles: {
    water: [],
    landcover: [],
    landuse: [],
    mountain_peak: [],
    boundary: function(properties, zoom) {
      //console.log(properties);
      var level = properties.admin_level;
      let style = {
        color: "hsl(248, 7%, 66%)",
        fillOpacity: 0
      }
      if (level == 2) {
        if(zoom > 0) style.weight = 0.6;
        if(zoom > 4) style.weight = 1.4;
        if(zoom > 5) style.weight = 2;
        if(zoom > 12) style.weight = 8;
        if(properties.maritime) style.color = "hsl(205,42%,72%)";
      }
      if(level == 4) {
        if(zoom > 0) style.weight = 0;
        if(zoom > 4) style.weight = 0.4;
        if(zoom > 5) style.weight = 1;
        if(zoom > 12) style.weight = 8;
        style.dashArray = '3, 1, 1, 1';
      }
      return style;
    },
    transportation: function(properties, zoom) {

      let style = {width: 1.2};

      if(properties.class == 'motorway') {
        style.color = "hsl(28,72%,69%)";
        if(zoom > 0) style.width = 0;
        if(zoom > 12) style.width = 1;
        if(zoom > 13) style.width = 2;
        if(zoom > 14) style.width = 4;
        return style;
      };
      if(properties.class == 'trunk') {
        //console.log(properties);
        style.color = "hsl(46, 85%, 67%)";
        if(zoom > 0) style.width = 0;
        if(zoom > 12) style.width = 1;
        if(zoom > 13) style.width = 2;
        if(zoom > 14) style.width = 4;
        return style;
      }
      if(properties.class == "minor") {
        style.color = "hsl(0,0%,100%)";
        if(zoom > 0) style.width = 0;
        if(zoom > 12) style.width = 0.5;
        if(zoom > 13) style.width = 1;
        if(zoom > 14) style.width = 4;
        return style;
      }
      if (zoom < 12) return [];
      console.log(properties);
      return [];
    },
    water_name: [],
    transportation_name: [],
    place: function(properties, zoom, coords) {
      return [];
      //console.log(properties);
      if(properties.class == "town") {
        return {icon: new L.divIcon({html: `<div>${properties.name}</div>`})};
      }
    },
    waterway: [],
    aeroway: [],
    aerodrome_label: [],
    globallandcover: [],
    park: [],

  }
}