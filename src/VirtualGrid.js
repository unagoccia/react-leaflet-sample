import L from 'leaflet';

var VirtualGrid = L.FeatureGroup.extend({
    include: L.Mixin.Events,
    options: {
        cellSize: 256,
        delayFactor: 0,
        adjustTile: false,
        selectedFillColor: "#3ac1f0",
        selectedFillOpacity: .2,
        style: {
            stroke: true,
            color: '#000',
            dashArray: null,
            lineCap: null,
            lineJoin: null,
            weight: 2,
            opacity: 1,

            fill: true,
            fillColor: null, //same as color by default
            fillOpacity: 0,

            clickable: true
        }
    },
    initialize: function(options) {
        L.Util.setOptions(this, options);
        L.FeatureGroup.prototype.initialize.call(this, [], options);
    },
    onAdd: function(map) {
        this._map = map;
        L.FeatureGroup.prototype.onAdd.call(this, this._map);
        this._cells = [];
        this.drawAreaSize = this._map.getSize();

        var bounds = this._getBounds(this._map.getBounds(), this._map.getZoom());
        this._setupGrid(bounds);

        this._map.on("move", this._moveHandler, this);
        this._map.on("zoomend", this._zoomHandler, this);
        this._map.on("resize", this._resizeHandler, this);
    },
    onRemove: function(map) {
        L.FeatureGroup.prototype.onRemove.call(this, map);
        map.off("move", this._moveHandler, this);
        map.off("zoomend", this._zoomHandler, this);
        map.off("resize", this._resizeHandler, this);
    },
    getCell: function(latlng) {
        var result;
        this._cells.some(function(cell){
            var minLat = Math.min(cell.bounds._northEast.lat, cell.bounds._southWest.lat);
            var maxLat = Math.max(cell.bounds._northEast.lat, cell.bounds._southWest.lat);
            var minLng = Math.min(cell.bounds._northEast.lng, cell.bounds._southWest.lng);
            var maxLng = Math.max(cell.bounds._northEast.lng, cell.bounds._southWest.lng);

            if(minLat<=latlng.lat && latlng.lat<=maxLat && minLng<=latlng.lng && latlng.lng<=maxLng) {
                result = cell;
                return true;
            }
        });
        return result;
    },
    selectCell(cell) {
        var selectCell = this._loadedCells.get(cell.id);
        selectCell.gridObject.setStyle({fillColor: this.options.selectedFillColor, fillOpacity: this.options.selectedFillOpacity});
        selectCell.gridObject.redraw();
    },
    _getBounds(bounds, zoom) {
        if(this.options.adjustTile) {
            var dispNorthWest = bounds.getNorthWest();
            var dispSouthEast = bounds.getSouthEast();
            var tile = this._latlng2tile(dispNorthWest.lat, dispNorthWest.lng, zoom);
            var latlng = this._tile2latlng(tile.tx, tile.ty, zoom);
            var northWest = {lat: latlng.lat, lng: latlng.lng};
            var northWest_p = this._latlng2pixel(northWest.lat, northWest.lng, zoom);
            tile = this._latlng2tile(dispSouthEast.lat, dispSouthEast.lng, zoom);
            latlng = this._tile2latlng(tile.tx+1, tile.ty+1, zoom);
            var southEast = {lat: latlng.lat, lng: latlng.lng};
            var southEast_p = this._latlng2pixel(southEast.lat, southEast.lng, zoom);
            var northEast = L.latLng(southEast.lat, northWest.lng);
            var southWest = L.latLng(northWest.lat, southEast.lng);
            bounds = L.latLngBounds(southWest, northEast);
            var sizeX =  Math.max(northWest_p.px, southEast_p.px) - Math.min(northWest_p.px, southEast_p.px);
            var sizeY =  Math.max(northWest_p.py, southEast_p.py) - Math.min(northWest_p.py, southEast_p.py);
            this.drawAreaSize = {x: sizeX, y: sizeY};
        }
        return bounds;
    },
    _latlng2tile(lat, lng, zoom) {
        var pixel = this._latlng2pixel(lat, lng, zoom);
        return this._pixel2tile(pixel.px, pixel.py, zoom);
    },
    _latlng2pixel(lat, lng, zoom) {
        var px = Math.round( Math.pow( 2, zoom + 7 ) * ( lng / 180 + 1 ));
        var py = Math.round( Math.pow( 2, zoom + 7 ) / Math.PI * ( -Math.atanh( Math.sin( Math.PI / 180 * lat )) + Math.atanh( Math.sin( Math.PI / 180 * 85.05112878))));
        return {px: px, py: py};
    },
    _pixel2tile(px, py, zoom) {
        var tx = Math.floor(px / 256);
        var ty = Math.floor(py / 256);
        return {tx: tx, ty: ty, zoom: zoom};
    },
    _tile2latlng(tx, ty, zoom) {
        var pixel = this._tile2pixel(tx, ty);
        return this._pixel2latlng(pixel.px, pixel.py, zoom);
    },
    _tile2pixel(tx, ty) {
        var px = tx * 256;
        var py = ty * 256;
        return {px: px, py: py};
    },
    _pixel2latlng(px, py, zoom) {
        var lat = 180 / Math.PI * ( Math.asin( Math.tanh(-Math.PI / Math.pow( 2, zoom + 7 ) * py + Math.atanh( Math.sin( Math.PI / 180 * 85.05112878 )))));
        var lng = 180 * ( px / Math.pow( 2, zoom + 7 ) - 1 );
        return {lat: lat, lng: lng}
    },
    _clearLayer: function(e) {
        this._cells = [];
    },
    _moveHandler: function(e) {
        var bounds = this._getBounds(e.target.getBounds(), e.target.getZoom());
        this._renderCells(bounds);
    },
    _zoomHandler: function(e) {
        this.clearLayers();
        var bounds = this._getBounds(e.target.getBounds(), e.target.getZoom());
        this._renderCells(bounds);
    },
    _renderCells: function(bounds) {
        this._cells = this._cellsInBounds(bounds);
        this.fire("newcells", this._cells);
        for (var i = this._cells.length - 1; i >= 0; i--) {
            var cell = this._cells[i];
            if(this._loadedCells.get(cell.id) === undefined) {
            // if (this._loadedCells.indexOf(cell.id) === -1) {
                (function(cell, i) {
                    cell.gridObject = L.rectangle(cell.bounds, this.options.style);
                    setTimeout(this.addLayer.bind(this, cell.gridObject), this.options.delayFactor * i);
                }.bind(this))(cell, i);
                // this._loadedCells.push(cell.id);
                this._loadedCells.set(cell.id,cell);
            }
        }
    },
    _resizeHandler: function(e) {
        this._setupSize();
    },
    _setupSize: function() {
        this._rows = Math.ceil(this.drawAreaSize.x / this._cellSize);
        this._cols = Math.ceil(this.drawAreaSize.y / this._cellSize);
    },
    _setupGrid: function(bounds) {
        this._origin = this._map.project(bounds.getNorthWest());
        this._cellSize = this.options.cellSize;
        this._setupSize();
        this._loadedCells = new Map();
        this._cells = [];
        this.clearLayers();
        this._renderCells(bounds);
    },
    _cellTile: function(row, col) {
        var x = this._origin.x + (row * this._cellSize);
        var y = this._origin.y + (col * this._cellSize);
        var tx = Math.floor( x / 256 );
        var ty = Math.floor( y / 256 );
        return {x: tx, y: ty};
    },
    _cellPoint: function(row, col) {
        var x = this._origin.x + (row * this._cellSize);
        var y = this._origin.y + (col * this._cellSize);
        return new L.Point(x, y);
    },
    _cellExtent: function(row, col) {
        var swPoint = this._cellPoint(row, col);
        var nePoint = this._cellPoint(row - 1, col - 1);
        var sw = this._map.unproject(swPoint);
        var ne = this._map.unproject(nePoint);
        return new L.LatLngBounds(ne, sw);
    },
    _cellsInBounds: function(bounds) {
        var offset = this._map.project(bounds.getNorthWest());
        var center = bounds.getCenter();
        var offsetX = this._origin.x - offset.x;
        var offsetY = this._origin.y - offset.y;
        var offsetRows = Math.round(offsetX / this._cellSize);
        var offsetCols = Math.round(offsetY / this._cellSize);
        var cells = new Map();
        var cells = [];
        for (var i = 0; i <= this._rows; i++) {
            for (var j = 0; j <= this._cols; j++) {
                var row = i - offsetRows;
                var col = j - offsetCols;
                var cellBounds = this._cellExtent(row, col);
                var tile = this._cellTile(row, col);
                var cellId = row + ":" + col;
                // cells.set(
                //     cellId,
                //     {
                //         bounds: cellBounds,
                //         center: cellBounds.getCenter(),
                //         distance: cellBounds.getCenter().distanceTo(center),
                //         tileCoordinates: tile
                //     }
                // );
                cells.push({
                    id: cellId,
                    bounds: cellBounds,
                    center: cellBounds.getCenter(),
                    distance: cellBounds.getCenter().distanceTo(center),
                    tileCoordinates: tile
                });
            }
        }
        cells.sort(function(a, b) {
            return a.distance - b.distance;
        });
        return cells;
    }
});

export default VirtualGrid;
