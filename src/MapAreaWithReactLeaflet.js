import React from 'react';
import { render } from 'react-dom';
import L from 'leaflet';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

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
    }

    onMapClick(e) {
        const {lat, lng} = e.latlng;
        const map = this.refs.map.leafletElement;
        L.popup()
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);;
    }

    render () {
        const position = [this.state.center.lat, this.state.center.lng];
        return (
            <Map center={position} zoom={this.state.zoom} onClick={this.onMapClick.bind(this)} ref="map">
                <TileLayer
                    url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
            </Map>
        );
    }
}
