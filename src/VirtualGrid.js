import L from 'leaflet';

var VirtualGrid = L.FeatureGroup.extend({
    include: L.Mixin.Events,
    options: {
        cellSize: 256,
        delayFactor: 2.5,
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
        L.FeatureGroup.prototype.onAdd.call(this, map);
        this._map = map;
        this._cells = [];
        this._setupGrid(map.getBounds());

        map.on("move", this._moveHandler, this);
        map.on("zoomend", this._zoomHandler, this);
        map.on("resize", this._resizeHandler, this);
    },
    onRemove: function(map) {
        L.FeatureGroup.prototype.onRemove.call(this, map);
        map.off("move", this._moveHandler, this);
        map.off("zoomend", this._zoomHandler, this);
        map.off("resize", this._resizeHandler, this);
    },
    getCell: function(latlng) {
        // return this._cells.find(cell => function(latlng) {
        //     console.log(latlng);
        //
        //     var minLat = Math.min(cell.bounds._northEast.lat, cell.bounds._southWest.lat);
        //     var maxLat = Math.max(cell.bounds._northEast.lat, cell.bounds._southWest.lat);
        //     var minLng = Math.min(cell.bounds._northEast.lng, cell.bounds._southWest.lng);
        //     var maxLng = Math.max(cell.bounds._northEast.lng, cell.bounds._southWest.lng);
        //
        //     if(minLat<=latlng.lat && latlng.lat<=maxLat && minLng<=latlng.lng && latlng.lng<=maxLng) {
        //         console.log("-----------------------");
        //         console.log(minLat<=latlng.lat && latlng.lat<=maxLat && minLng<=latlng.lng && latlng.lng<=maxLng);
        //         console.log(`${minLat}<=${latlng.lat}:${minLat<=latlng.lat}`);
        //         console.log(`${latlng.lat}<=${maxLat}:${latlng.lat<=maxLat}`);
        //         console.log(`${minLng}<=${latlng.lng}:${minLng<=latlng.lng}`);
        //         console.log(`${latlng.lng}<=${maxLng}:${latlng.lng<=maxLng}`);
        //         console.log("-----------------------");
        //         return true;
        //     }
        //     return false;
        // });
        var result;
        this._cells.some(function(cell){
            var minLat = Math.min(cell.bounds._northEast.lat, cell.bounds._southWest.lat);
            var maxLat = Math.max(cell.bounds._northEast.lat, cell.bounds._southWest.lat);
            var minLng = Math.min(cell.bounds._northEast.lng, cell.bounds._southWest.lng);
            var maxLng = Math.max(cell.bounds._northEast.lng, cell.bounds._southWest.lng);
            // var minLat = cell.bounds._southWest.lat;
            // var maxLat = cell.bounds._northEast.lat;
            // var minLng = cell.bounds._northEast.lng;
            // var maxLng = cell.bounds._southWest.lng;



            if(minLat<=latlng.lat && latlng.lat<=maxLat && minLng<=latlng.lng && latlng.lng<=maxLng) {
                console.log("-----------------------");
                console.log(minLat<=latlng.lat && latlng.lat<=maxLat && minLng<=latlng.lng && latlng.lng<=maxLng);
                console.log(`${minLat}<=${latlng.lat}:${minLat<=latlng.lat}`);
                console.log(`${latlng.lat}<=${maxLat}:${latlng.lat<=maxLat}`);
                console.log(`${minLng}<=${latlng.lng}:${minLng<=latlng.lng}`);
                console.log(`${latlng.lng}<=${maxLng}:${latlng.lng<=maxLng}`);
                console.log("-----------------------");
                result = cell;
                return true;
            }
        });
        return result;
    },
    _clearLayer: function(e) {
        this._cells = [];
    },
    _moveHandler: function(e) {
        this._renderCells(e.target.getBounds());
    },
    _zoomHandler: function(e) {
        this.clearLayers();
        this._renderCells(e.target.getBounds());
    },
    _renderCells: function(bounds) {
        this._cells = this._cellsInBounds(bounds);
        this.fire("newcells", this._cells);
        for (var i = this._cells.length - 1; i >= 0; i--) {
            var cell = this._cells[i];
            if (this._loadedCells.indexOf(cell.id) === -1) {
                (function(cell, i) {
                    setTimeout(this.addLayer.bind(this, L.rectangle(cell.bounds, this.options.style)), this.options.delayFactor * i);
                }.bind(this))(cell, i);
                this._loadedCells.push(cell.id);
            }
        }
    },
    _resizeHandler: function(e) {
        this._setupSize();
    },
    _setupSize: function() {
        this._rows = Math.ceil(this._map.getSize().x / this._cellSize);
        this._cols = Math.ceil(this._map.getSize().y / this._cellSize);
    },
    _setupGrid: function(bounds) {
        this._origin = this._map.project(bounds.getNorthWest());
        this._cellSize = this.options.cellSize;
        this._setupSize();
        this._loadedCells = [];
        this._cells = [];
        this.clearLayers();
        this._renderCells(bounds);
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
        var cells = [];
        for (var i = 0; i <= this._rows; i++) {
            for (var j = 0; j <= this._cols; j++) {
                var row = i - offsetRows;
                var col = j - offsetCols;
                var cellBounds = this._cellExtent(row, col);
                var cellId = row + ":" + col;
                cells.push({
                    id: cellId,
                    bounds: cellBounds,
                    distance: cellBounds.getCenter().distanceTo(center)
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
