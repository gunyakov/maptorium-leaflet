L.RotaitedMarker = L.Marker.extend({
	options: {
	  rotationAngle: 0,
	  rotationOrigin: "center",
	},
  
	initialize: function (latlng, options) {
	  L.Marker.prototype.initialize.call(this);
  
	  L.Util.setOptions(this, options);
	  this._latlng = L.latLng(latlng);
  
	  this.options.rotationOrigin = this.options.rotationOrigin || "center bottom";
	  this.options.rotationAngle = this.options.rotationAngle || 0;
  
	  // Ensure marker keeps rotated during dragging
	  this.on("drag", function (e) {
		e.target._applyRotation();
	  });
	},
  
	onRemove: function (map) {
	  L.Marker.prototype.onRemove.call(this, map);
	},
  
	_setPos: function (pos) {
	  L.Marker.prototype._setPos.call(this, pos);
	  this._applyRotation();
	},
  
	_applyRotation: function () {
	  if (this.options.rotationAngle) {
		this._icon.style[L.DomUtil.TRANSFORM + "Origin"] =
		  this.options.rotationOrigin;
  
		this._icon.style[L.DomUtil.TRANSFORM] +=
		  " rotate(" + this.options.rotationAngle + "deg)";
	  }
	},
  
	setRotationAngle: function (angle) {
	  this.options.rotationAngle = angle;
	  this.update();
	  return this;
	},
  
	setRotationOrigin: function (origin) {
	  this.options.rotationOrigin = origin;
	  this.update();
	  return this;
	},
  });
  
  L.rotatedMarker = function (latlng, options) {
	return new L.RotatedMarker(latlng, options);
  };

  L.rotaitedMarker = function (options) {
	return new L.RotaitedMarker(options);
  };
  