import React from 'react';
import { render } from 'react-dom';
import L from 'leaflet';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import VirtualGrid from "./VirtualGrid.js";

export default class MapArea extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            center: {
                lat: 35.43529889334017,
                lng: 139.6187337487936,
            },
            zoom: 15,
        }
        this.popup = L.popup({
            maxWidth: 400
        });
        this.imageIsClick = false;
        this.gridGroup;
    }

    componentDidMount() {
        this.showGrid();
    }

    // onMapMousedown(e) {
    //     const tagName = e.originalEvent.srcElement.tagName;
    //     // console.log(tagName);
    //     if (tagName == "IMG") {
    //         this.imageIsClick = true;
    //     } else {
    //         this.imageIsClick = false;
    //     }
    //
    //     const map = this.refs.map.leafletElement;
    //     map.closePopup();
    // }

    // onMapMouseup(e) {
    //     if (!this.imageIsClick) {
    //         // console.dir(e);
    //         // console.dir(e.originalEvent);
    //         console.log([e.originalEvent.offsetX, e.originalEvent.offsetY]);
    //         // console.dir(e.originalEvent.srcElement);
    //         console.dir(e.originalEvent.srcElement.currentSrc);
    //
    //         const pixelCoordinates = {
    //             x: e.originalEvent.offsetX,
    //             y: e.originalEvent.offsetY
    //         };
    //         const tileImageUrl = e.originalEvent.srcElement.currentSrc;
    //         this.showPopup(e.latlng, pixelCoordinates, tileImageUrl);
    //     }
    // }

    onMapClick(e) {
        // console.dir(e);
        // console.dir(e.originalEvent);
        // console.dir(this.gridGroup);
        // console.dir(this.gridGroup.getCell(e.latlng));
        // console.dir(this.gridGroup.getBounds());

        const tagName = e.originalEvent.srcElement.tagName;
        // if (this.imageIsClick) {
        if (tagName == "IMG") {
            // console.log([e.originalEvent.offsetX, e.originalEvent.offsetY]);
            // console.dir(e.originalEvent.srcElement);
            // console.dir(e.originalEvent.srcElement.currentSrc);

            const pixelCoordinates = {
                x: e.originalEvent.offsetX,
                y: e.originalEvent.offsetY
            };
            const tileImageUrl = e.originalEvent.srcElement.currentSrc;
            this.showPopup(e.latlng, pixelCoordinates, tileImageUrl);
        }
        const map = this.refs.map.leafletElement;
        this.getTile(map.getPixelBounds());
    }

    onMapZoomStart(e) {
        const map = this.refs.map.leafletElement;
        map.removeLayer(this.gridGroup);
    }

    onMapZoomEnd(e) {
        this.showGrid();
    }

    showPopup(latlng, pixelCoordinates, tileImageUrl) {
        // console.dir(latlng);
        const map = this.refs.map.leafletElement;
        this.popup
            .setLatLng(latlng)
            .setContent(`
                LatLng: ${latlng.lat}, ${latlng.lng}<br>
                The tile image URL: ${tileImageUrl}<br>
                Pixel coordinates: ${pixelCoordinates.x}, ${pixelCoordinates.y}
            `)
            .openOn(map);
    }

    showGrid() {
        const map = this.refs.map.leafletElement;
        this.gridGroup = new VirtualGrid({
            cellSize: 64
        }).addTo(map);
    }

    artanh(z) {
        return 1/2 * Math.log( ( 1 + z ) / ( 1 - z ) );
    }

    getTile(bounds) {
        var nw_tx = Math.floor( bounds.min.x / 256 );
        var nw_ty = Math.floor( bounds.min.y / 256 );
        var se_tx = Math.floor( bounds.max.x / 256 );
        var se_ty = Math.floor( bounds.max.y / 256 );
        console.log([nw_tx, nw_ty]);
        console.log([se_tx, se_ty]);
    }

    render() {
        const position = [this.state.center.lat, this.state.center.lng];
        return (
            <Map ref="map" center={position} zoom={this.state.zoom} onClick={this.onMapClick.bind(this)} onZoomend={this.onMapZoomEnd.bind(this)} onZoomstart={this.onMapZoomStart.bind(this)}>
                <TileLayer
                    url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
            </Map>
        );
    }
}
