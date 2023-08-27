//------------------------------------------------------------
//Vars for leaflet 
//------------------------------------------------------------
let mapsLayers = {};
let overlayLayers = {};
//------------------------------------------------------------------------------
//GPS: Init
//------------------------------------------------------------------------------
let MDraw = L.MDraw({
    showRoute: true,
    gpsRun: true
});
MDraw.onAdd(map);
//------------------------------------------------------------------------------
//Add info table for map
//------------------------------------------------------------------------------
var GPSInfoBar = L.Control.extend({
    options : {
        position : 'bottomleft'
    },
    onAdd : function(map) {
        // create the control container with a particular class name
        var container = L.DomUtil.get('routeInfo');
        // ... initialize other DOM elements, add listeners, etc.
        return container;
    }
});
map.addControl(new GPSInfoBar());
//------------------------------------------------------------------------------
//Bottom bar add on map
//------------------------------------------------------------------------------
var controlBar = L.control.bar('bar',{
    position: 'bottom',
    visible: true
});
map.addControl(controlBar);

var jobmanager = L.Control.extend({
    options: {
        position: "topright",
        visible: true
    },
    onAdd : function(map) {
        this._map = map;
        if(!this._container) {
            this._container = L.DomUtil.get("jobManager");
        }
        // Make sure we don't drag the map when we interact with the content
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(this._container, 'contextmenu', stop)
            .on(this._container, 'click', stop)
            .on(this._container, 'mousedown', stop)
            .on(this._container, 'touchstart', stop)
            .on(this._container, 'dblclick', stop)
            .on(this._container, 'mousewheel', stop)
            .on(this._container, 'MozMousePixelScroll', stop);
        return this._container;
    }
});
let jobManager = new jobmanager();
map.addControl(jobManager);

var cachedmapstate = L.Control.extend({
    options: {
        position: "bottomright",
        visible: true
    },
    onAdd : function(map) {
        this._map = map;
        if(!this._container) {
            this._container = L.DomUtil.get("cachedMapBar");
        }
        return this._container;
    }
});
map.addControl(new cachedmapstate());

var routeProgress = L.Control.extend({
    options: {
        position: "bottomright",
        visible: true
    },
    onAdd : function(map) {
        this._map = map;
        if(!this._container) {
            this._container = L.DomUtil.get("drawingRouteProgress");
        }
        return this._container;
    }
});
map.addControl(new routeProgress());
// let jobManagerShow = false;

// $("#job-manager-btn").on("click", function() {
//     if(jobManagerShow) {
//         map.removeControl(jobManager);
//         jobManagerShow = false;
//         $("#job-manager-btn").removeClass("bg-secondary");
//     }
//     else {
//         map.addControl(jobManager);
//         jobManagerShow = true;
//         $("#job-manager-btn").addClass("bg-secondary");
//     }
// });
//------------------------------------------------------------------------------
//Tile grid add to map
//------------------------------------------------------------------------------
var TileGrid = L.tilegrid({
    //...globalPolygonOptions,
    zoomOffset: -1,
    zoom: -1
});
TileGrid.onAdd(map);

let setTileGrid = function(zoom, zoomOffset) {
    TileGrid.setGrid(zoom, zoomOffset);
}

$("#gps-new-route").on('click', function(e) {
    let rname = $("#new-route-name").val();
    $("#newRouteModal").modal("hide");
    if(rname.length < 4) {
        alertify.error("New route name less than 4 simbols. Skip.");
    }
    else {
        M.startNewRoute(rname);
        $("#new-route-name").val("");
    }
});
//Draw Polygone using tile boudaries
$("#b-select-tile").on("click", (ev) => {
    TileGrid.select(async function(geometry) {
        let poiID = await M.addPOI(geometry);
        if(poiID > 0) MDraw.drawPolygon(geometry.points, poiID);
    });
});
//------------------------------------------------------------------------------
//Tiled cached map
//------------------------------------------------------------------------------
let CachedMap = L.cachedmap();
CachedMap.addTo(map);
//------------------------------------------------------------
//Leaflet specific functions and interractions
//------------------------------------------------------------
(async() => {
    //------------------------------------------------------------
    //Set function what will execute when maptorium init
    //------------------------------------------------------------
    M.on("init", async function(mapsList, layersList) {
        //Prepare tile layers for maps
        for(let i = 0; i < mapsList.length; i++) {
            let mapInfo = mapsList[i];
            mapsLayers[mapInfo.id] = (
                L.tileLayer(
                    `tile?map=${mapInfo.id}&z={z}&x={x}&y={y}`, 
                    {
                    maxZoom: 20,
                    attribution: mapInfo.attribution,
                    tileSize: mapInfo.tileSize,
                    zoomOffset: 0,
                    type: mapInfo.type,
                    mapID: mapInfo.id,
                    }
                )
            )
        }
        //Prepare tile layers for overlays
        for(let i = 0; i < layersList.length; i++) {
            let mapInfo = layersList[i];
            if(mapInfo.format != "vector") {
                overlayLayers[mapInfo.id] = (
                    L.tileLayer(
                        `tile?map=${mapInfo.id}&z={z}&x={x}&y={y}`, 
                        {
                        maxZoom: 20,
                        attribution: mapInfo.attribution,
                        tileSize: mapInfo.tileSize,
                        zoomOffset: 0,
                        type: mapInfo.type,
                        mapID: mapInfo.id,
                        }
                    )
                )
            }
            else {
                overlayLayers[mapInfo.id] = L.mapboxGL({
                    accessToken: 'P2DGn4fI4cVJ928SF14v',
                    style: "leaflet/mapbox/bright.json",
                    transformRequest: (url, resourceType) => {
                    
                      if(resourceType == "Tile") {
                        //console.log(url);
                        url = url.replace("https://api.maptiler.com/tiles/v3/", '');
                        url = url.split("/");
                        //console.log(url);
                        url[2] = url[2].split(".");
                        url[2] = url[2][0];
                        url = `http://${window.location.hostname}:${window.location.port}/tile?map=${mapInfo.id}&z=${url[0]}&x=${url[1]}&y=${url[2]}`;
                        //console.log(url);
                        return {
                          url: url,
                          credentials: 'include'  // Include cookies for cross-origin requests
                        };
                      }
                      else if(resourceType == "SpriteJSON") return {url: `leaflet/mapbox/sprite.json`}
                      else if(resourceType == "SpriteImage") return {url: `leaflet/mapbox/sprite.png`}
                      else if(resourceType == "Glyphs") return {url: `leaflet/mapbox/0-255.pbf`}
                      else if(resourceType == "Style") return {url: url}
                      else if(resourceType == "Source") return {url: "leaflet/mapbox/tiles.json"}
                    else {
                        console.log(resourceType, url);
                        
                      }
                    }
                });
                // overlayLayers[mapInfo.id] = L.vectorGrid.protobuf(`tile?map=${mapInfo.id}&z={z}&x={x}&y={y}`, vectorHybridOverlayStyle)
    			// .on('click', function(e) {	// The .on method attaches an event handler
    			// 	L.popup()
    			// 		.setContent(e.layer.properties.name || e.layer.properties.type)
    			// 		.setLatLng(e.latlng)
    			// 		.openOn(map);

    			// 	L.DomEvent.stop(e);
    			// });
            }
            
        }
        
        setTimeout(() => {
            $("#side-menu").metisMenu({toggle: true});
            $(".veritical-menu").css("height", heightAdjust+"px");
        }, 1000);
    });
    //------------------------------------------------------------
    //Center map event raised when default config received from server
    //or when Centered GPS position activated
    //------------------------------------------------------------
    M.on("map.center", function(lat, lng, zoom) {
        map.setView([lat, lng]);
        if(zoom) {
            map.setZoom(zoom);
        }
    });
    //------------------------------------------------------------
    //Fire when need change main map
    //------------------------------------------------------------
    M.on("map.change", function(mapID, currentMapID) {
        if(currentMapID) {
            mapsLayers[currentMapID].remove();
        }
        mapsLayers[mapID].addTo(map);
        mapsLayers[mapID].bringToBack();
    });
    //------------------------------------------------------------
    //Fire when need add overlay to map
    //------------------------------------------------------------
    M.on("map.layerAdd", function(layerID) {
        overlayLayers[layerID].addTo(map);
        overlayLayers[layerID].bringToFront();
    });
    //------------------------------------------------------------
    //Fire when need remove overlay from map
    //------------------------------------------------------------
    M.on("map.layerRemove", function(layerID) {
        overlayLayers[layerID].remove();
    });
    //------------------------------------------------------------
    //Fire when gps have new coords
    //------------------------------------------------------------
    M.on("gps.update", function(lat, lng, dir) {
        MDraw.moveMarker(lat, lng, dir);
    });
    //------------------------------------------------------------
    //Fire when route insert new point
    //------------------------------------------------------------
    M.on("route.point", function(lat, lng) {
        MDraw.routePoint(lat, lng);
    });
    //------------------------------------------------------------
    //Fire when need to hide current route
    //------------------------------------------------------------
    M.on("route.hide", function() {
        MDraw.hideRoute();
    });
    //------------------------------------------------------------
    //Fire when need to show current route
    //------------------------------------------------------------
    M.on("route.show", function(points) {
        MDraw.drawRoute(points);
    });
    //------------------------------------------------------------
    //Fire when need to hide history routes
    //------------------------------------------------------------
    M.on("history.hide", function() {
        MDraw.hideHistory();
    });
    //------------------------------------------------------------
    //Fire when need to show history route
    //------------------------------------------------------------
    M.on("history.show", function(ID, points) {
        MDraw.drawPolyline(points, ID);
    });
    //------------------------------------------------------------
    //Fire when need to show history route
    //------------------------------------------------------------
    M.on("history.point", function(ID, lat, lng) {
        MDraw.pointPolyline(ID, lat, lng);
    });
    //------------------------------------------------------------
    //Fire when need to draw polygon
    //------------------------------------------------------------
    M.on("add.polygon", function(points, ID, options) {
        MDraw.drawPolygon(points, ID, options);
    });
    //------------------------------------------------------------
    //Fire when need to draw polyline
    //------------------------------------------------------------
    M.on("add.polyline", function(points, ID, config) {
        MDraw.drawPolyline(points, ID, config);
    });
    //------------------------------------------------------------
    //Fire when need to draw point
    //------------------------------------------------------------
    M.on("add.point", function(info) {
        MDraw.drawPoint(info);
    });
    //------------------------------------------------------------
    //Fire when new cached Map arrive
    //------------------------------------------------------------
    M.on("cachedtile.map", function(mapInfo) {
        CachedMap.setData(mapInfo);
        CachedMap.bringToFront();
    });
    //------------------------------------------------------------
    //Fire when tile in cache map change state
    //------------------------------------------------------------
    M.on("cachedtile.tile", function(tileInfo) {
        CachedMap.updateTile(tileInfo);
    });
    //------------------------------------------------------------
    //Fire when cached map clean button was presed
    //------------------------------------------------------------
    M.on("cachedtile.clean", function() {
        CachedMap.setData(null);
    });
    //------------------------------------------------------------
    //Init new Maptorium UI after all preparations. Must call last
    //------------------------------------------------------------
    await M.init();
})();