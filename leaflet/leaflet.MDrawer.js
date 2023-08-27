
L.mdrawer = L.Layer.extend({
    options : {
        //------------------------------------------------------------------------------
        //Default style for geometry
        //------------------------------------------------------------------------------
        color: "#FF4444",
        fillColor: "#ffffff",
        fillOpacity: 0.5,
        radius: 5,
        weight: 2
    },

    initialize: function (options) {
        L.setOptions(this, options);
        this._map = false;
        this._polyline = null;
        this._polygon = null;
        this._mapWasMoved = false;
        this._pointsList = [];
        this._layer = false;
        
        this._geometryType = "polyline";
        this._moveMarker = this._makeMarker([0, 0]);

        this._moveObject = null;

        this._lastPoint = false;
        this.distanceCur = 0;
        
        
    },

    onAdd: function(map) {
        this._map = map;
    },

    start: function(type = "polyline") {

        console.log("Start ", type);
        this._geometryType = type;

        this.distanceCur = 0;
        this._pointsList = [];
        this._lastPoint = false;

        this._layer = L.layerGroup().addTo(this._map);
        this._layer.addLayer(this._moveMarker);

        this._map.on("mouseup", (e) => {
            if(!this._mapWasMoved && e.originalEvent.button == 0) {
                this._addPoint(e.latlng);
            }
            this._mapWasMoved = false;
        });
        this._map.on("movestart", () => {
            this._mapWasMoved = true;
        });
        this._map.on("mousemove", (e) => {
            if(this._geometryType == "square" && this._pointsList.length == 2) return;
            this._setMarker(e.latlng);
        });
    },
    stop: function() {
        this._map.removeLayer(this._layer);
        this._layer = null;
        this._moveObject = null;
        this._polyline = null;
        this._map.off("mousemove");
        this._map.off("movestart");
        this._map.off("mouseup");
    },
    save: function() {
        let POIInfo = {
            type: this._geometryType == "square" ? "polygon" : this._geometryType,
            color: this.options.color,
            fillColor: this.options.fillColor,
            fillOpacity: this.options.fillOpacity,
            width: this.options.weight,
            points: this._geometryType == "square" ? this._moveObject.getLatLngs()[0] : this._polyline.getLatLngs()
        }
        this.stop();
        return POIInfo;
    },
    _addPoint: function(latlng) {
        
        if(this._geometryType == "square" && this._pointsList.length == 2) return;
         

        this._lastPoint = latlng;

        this._pointsList.push([latlng.lat, latlng.lng]);

        let marker = this._makeMarker(latlng);
        
        this._layer.addLayer(marker);
        

        if(this._geometryType == "polyline" || this._geometryType == "polygon") {
            if(this._pointsList.length == 2) {
                this._polyline = L.polyline(this._pointsList, {color: this.options.color, weight: this.options.weight});
                this._layer.addLayer(this._polyline);
            }
    
            if(this._polyline && this._pointsList.length > 2) {
                this._polyline.addLatLng(latlng);
            }
    
            if(this._polyline) {
                this._polyline.bringToBack();
                this.distanceCur = this._polyline.distance("m");
            }
            
            marker.setTooltipContent(`<p class="font-size-13 text-muted mb-0">${this.distanceCur} mls</p>`);
        }

        if(this._geometryType == "polygon" && this._pointsList.length == 3) {
            this._polygon = L.polygon(this._pointsList, {fillColor: this.options.fillColor, fillOpacity: this.options.fillOpacity, weight: 0});
            this._layer.addLayer(this._polygon);
        }

        if(this._geometryType == "polygon" && this._pointsList.length > 3) {
            this._polygon.setLatLngs(this._pointsList);
        }

    },
    _makeMarker: function(latlngs) {

        let marker = L.circleMarker(latlngs, {
            radius: this.options.radius,
            weight: 1,
            color: this.options.color,
            fillColor: this.options.fillColor,
            fillOpacity: this.options.fillOpacity
        });
        
        if(this._geometryType == "polyline") {
            console.log("Make pop up for marker");
            marker.bindTooltip("Temp text", {
                className: "flex-grow-1 overflow-hidden me-3",
                permanent: true
            });
            marker.openTooltip();
        }

        return marker;
    },
    _setMarker: function(latlng) {
        
        if(this._moveObject) {
            
            if(this._geometryType == "polyline" || this._geometryType == "polygon") {
                this._moveObject.setLatLngs([this._lastPoint, latlng]);
                let distancePlus = this._moveObject.distance("m");
                this._moveMarker.setTooltipContent(`<p class="font-size-13 text-muted mb-0">+${distancePlus} mls</p>`);
            }
            if(this._geometryType == "square") {
                this._moveObject.setLatLngs(this._getSquareCoords(latlng));
            }
        }

        if(this._pointsList.length == 1 && !this._moveObject) {

            if(this._geometryType == "polyline" || this._geometryType == "polygon") {
                this._moveObject = L.polyline([this._lastPoint, latlng], this.options);
            }
            if(this._geometryType == "square") {
                this._moveObject = L.polygon(this._getSquareCoords(latlng), this.options);
                this._moveObject.maptoriumID = "square";
            }
            
            this._layer.addLayer(this._moveObject);
            //this._moveObject.bringToBack()
        }

        if(this._moveMarker) {
            this._moveMarker.setLatLng(latlng);
        }
    },
    _getSquareCoords(latlng) {
        return [[this._lastPoint.lat, this._lastPoint.lng], [this._lastPoint.lat, latlng.lng],[latlng.lat, latlng.lng], [latlng.lat, this._lastPoint.lng]];
    }
});

L.MDrawer = function (options) {
    return new L.mdrawer(options);
};