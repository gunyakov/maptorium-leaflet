//------------------------------------------------------------
//Init leaflet map
//------------------------------------------------------------
$("#leaflet-map").height($(document).height() - $(".navbar-header").height() + 2);
let map = L.map('leaflet-map').setView([39, 0], 5);
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

let MDOM = new M.MDOM({
    mapsContainerID: "maps-list",
    layersContainerID: "layers-list",
    menuParrentTag: "ul",
    menuChildTag: "li",
    menuParrentClass: "",
    menuChildClass: "",
    menuSelectedClass: "bg-secondary",
    gpsRouteButton: "gps-show-route",
    gpsRouteRecordButton: "gps-record-route",
    gpsRouteNewButton: "gps-new-route",
    gpsRouteTimeButton: "gps-sample-time",
    gpsHistoryButton: "gps-history-list",
    gpsHistoryCleanButton: "gps-clear-history",
    toggleClass: "bg-secondary",
    mapContainerID: "mapMenuContainer",
    routeListContainer: "route-list"
});

//------------------------------------------------------------
//Config for maptorium UI
//------------------------------------------------------------
let MUI = new M.Maptorium({
    vectorMapSupport: false,
    MDOM: MDOM
});
//Save zoom to default config (used to restore when page reload)
map.on("zoomend", () => {
    MUI.setZoom(map.getZoom());
});
//Save map center to default config (used to restore when page reload)
map.on("moveend", () => {
    MUI.setCoords(map.getCenter()['lat'], map.getCenter()['lng']);
});

$("#gps-new-route").on('click', function(e) {
    let rname = $("#new-route-name").val();
    $("#newRouteModal").modal("hide");
    if(rname.length < 4) {
        alertify.error("New route name less than 4 simbols. Skip.");
    }
    else {
        MUI.startNewRoute(rname);
        $("#new-route-name").val("");
    }
});
$("#b-select-tile").on("click", (ev) => {
    TileGrid.select(async function(geometry, polygonRef) {
        let poiID = await MUI.addPOI(geometry);
        console.log(poiID);
        if(poiID > 0) {
            polygonRef.maptoriumID = poiID;
            polygonRef.bindTooltip('Geometry ' + response.markID);
            polygonRef.shape = "Polygon";
        }
    });
});
//------------------------------------------------------------
//Network mode change functions
//------------------------------------------------------------
$("[data-key=t-change-mode").on("click", function(ev) {
    MUI.setMode($(this).attr("mode-val"));
});

//------------------------------------------------------------
//Leaflet specific functions and interractions
//------------------------------------------------------------
(async() => {
    //------------------------------------------------------------
    //Set function what will execute when maptorium init
    //------------------------------------------------------------
    MUI.on("init", async function(mapsList, layersList) {
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
        
        setTimeout(() => $("#side-menu").metisMenu({toggle: true}), 1000);
    });
    //------------------------------------------------------------
    //Center map event raised when default config received from server
    //or when Centered GPS position activated
    //------------------------------------------------------------
    MUI.on("map.center", function(lat, lng, zoom) {
        map.setView([lat, lng], zoom);
    });
    //------------------------------------------------------------
    //Fire when need change main map
    //------------------------------------------------------------
    MUI.on("map.change", function(mapID, currentMapID) {
        if(currentMapID) {
            mapsLayers[currentMapID].remove();
        }
        mapsLayers[mapID].addTo(map);
        mapsLayers[mapID].bringToBack();
    });
    //------------------------------------------------------------
    //Fire when need add overlay to map
    //------------------------------------------------------------
    MUI.on("map.layerAdd", function(layerID) {
        overlayLayers[layerID].addTo(map);
        overlayLayers[layerID].bringToFront();
    });
    //------------------------------------------------------------
    //Fire when need remove overlay from map
    //------------------------------------------------------------
    MUI.on("map.layerRemove", function(layerID) {
        overlayLayers[layerID].remove();
    });
    //------------------------------------------------------------
    //Fire when gps have new coords
    //------------------------------------------------------------
    MUI.on("gps.update", function(lat, lon, dir) {
        MDraw.moveMarker(lat, lon, dir);
    });
    //------------------------------------------------------------
    //Fire when route insert new point
    //------------------------------------------------------------
    MUI.on("route.point", function(lat, lon) {
        MDraw.routePoint(lat, lon);
    });
    //------------------------------------------------------------
    //Fire when need to hide current route
    //------------------------------------------------------------
    MUI.on("route.hide", function() {
        MDraw.hideRoute();
    });
    //------------------------------------------------------------
    //Fire when need to show current route
    //------------------------------------------------------------
    MUI.on("route.show", function(points) {
        MDraw.drawRoute(points);
    });
    //------------------------------------------------------------
    //Fire when need to hide history routes
    //------------------------------------------------------------
    MUI.on("history.hide", function() {
        MDraw.hideHistory();
    });
    //------------------------------------------------------------
    //Fire when need to show history route
    //------------------------------------------------------------
    MUI.on("history.show", function(points) {
        console.log("History show");
        MDraw.drawPolyline(points);
    });
    //------------------------------------------------------------
    //Init new Maptorium UI after all preparations. Must call last
    //------------------------------------------------------------
    await MUI.init();
})();