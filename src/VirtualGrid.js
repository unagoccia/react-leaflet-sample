import L from 'leaflet';

var VirtualGrid = L.FeatureGroup.extend({
    include: L.Mixin.Events,
    options: {
        cellSize: 256,
        delayFactor: 0,
        adjustTile: false,
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
        // L.marker([this._map.getCenter().lat, this._map.getCenter().lng]).addTo(this._map);

        var zoom = this._map.getZoom();
        var bounds = this._map.getBounds();
        var dispNorthWest = bounds.getNorthWest();
        var dispSouthEast = bounds.getSouthEast();
        if(this.options.adjustTile) {
            var tile = this._latlng2tile(dispNorthWest.lat, dispNorthWest.lng, zoom);
            var latlng = this._tile2latlng(tile.tx, tile.ty, zoom);
            var northWest = {lat: latlng.lat, lng: latlng.lng};
            // L.marker([northWest.lat, northWest.lng]).addTo(this._map);
            var northWest_p = this._latlng2pixel(northWest.lat, northWest.lng, zoom);
            // console.info(tile);
            // console.info(latlng);
            // console.info(northWest);
            // console.info(northWest_p);
            // this._map.setView(northWest);
            tile = this._latlng2tile(dispSouthEast.lat, dispSouthEast.lng, zoom);
            latlng = this._tile2latlng(tile.tx+1, tile.ty+1, zoom);
            // this._map.setView(latlng);
            var southEast = {lat: latlng.lat, lng: latlng.lng};
            // this._map.setView([southEast.lat, southEast.lng]);
            // L.marker([southEast.lat, southEast.lng]).addTo(this._map);
            var southEast_p = this._latlng2pixel(southEast.lat, southEast.lng, zoom);
            // console.info(tile);
            // console.info(latlng);
            // console.info(southEast);
            // console.info(southEast_p);
            // this._map.setView(southEast);
            var northEast = L.latLng(southEast.lat, northWest.lng);
            // console.info(northEast);
            // this._map.setView(northEast);
            var southWest = L.latLng(northWest.lat, southEast.lng);
            // console.info(southWest);
            // this._map.setView(northEast);
            bounds = L.latLngBounds(southWest, northEast);
            // console.info(bounds);
            // console.info(Math.max(northWest_p.px, southEast_p.px));
            // console.info(Math.min(northWest_p.px, southEast_p.px));
            var sizeX =  Math.max(northWest_p.px, southEast_p.px) - Math.min(northWest_p.px, southEast_p.px);
            var sizeY =  Math.max(northWest_p.py, southEast_p.py) - Math.min(northWest_p.py, southEast_p.py);
            this.drawAreaSize = {x: sizeX, y: sizeY};
        }
        // console.info(bounds);
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
                // console.log("-----------------------");
                // console.log(minLat<=latlng.lat && latlng.lat<=maxLat && minLng<=latlng.lng && latlng.lng<=maxLng);
                // console.log(`${minLat}<=${latlng.lat}:${minLat<=latlng.lat}`);
                // console.log(`${latlng.lat}<=${maxLat}:${latlng.lat<=maxLat}`);
                // console.log(`${minLng}<=${latlng.lng}:${minLng<=latlng.lng}`);
                // console.log(`${latlng.lng}<=${maxLng}:${latlng.lng<=maxLng}`);
                // console.log("-----------------------");
                result = cell;
                return true;
            }
        });
        return result;
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
        this._renderCells(e.target.getBounds());
    },
    _zoomHandler: function(e) {
        this.clearLayers();
        this._renderCells(e.target.getBounds());
    },
    _renderCells: function(bounds) {
        // TODO 表示領域の左上端を起点にセルを描画し始める処理となっているので、表示領域の左上端を含むタイルの左上端を起点に表示領域の右下端を含むタイルの右下端までセルを描画するように修正する
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
        console.info(this.drawAreaSize);
        this._rows = Math.ceil(this.drawAreaSize.x / this._cellSize);
        this._cols = Math.ceil(this.drawAreaSize.y / this._cellSize);
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
        // console.info(this._origin);
        // console.info(offset);
        var center = bounds.getCenter();
        var offsetX = this._origin.x - offset.x;
        var offsetY = this._origin.y - offset.y;
        // console.info(offsetX);
        // console.info(offsetY);
        var offsetRows = Math.round(offsetX / this._cellSize);
        var offsetCols = Math.round(offsetY / this._cellSize);
        // console.info(offsetRows);
        // console.info(offsetCols);
        var cells = [];
        for (var i = 0; i <= this._rows; i++) {
            for (var j = 0; j <= this._cols; j++) {
                var row = i - offsetRows;
                var col = j - offsetCols;
                var cellBounds = this._cellExtent(row, col);
                var tile = this._cellTile(row, col);
                var cellId = row + ":" + col;
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
        // console.info(cells);
        return cells;
    }
});

export default VirtualGrid;
