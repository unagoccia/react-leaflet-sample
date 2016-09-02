import React from 'react';
import { render } from 'react-dom';
import Radium from 'radium';

export default class CustomControl extends React.Component {

    onMapClick() {
        const map = this.props.map;
        map.setView([35,146]);
    }

    render() {
        var styles = {
            menu: {
                width: 26,
                height: 26,
                backgroundColor: 'white',
                borderBottom: '1px solid #ccc',
                padding: 3,
            },
            img: {
                width: '100%',
                height: 'auto',
            }
        };

        return(
            <div>
                <div style={styles.menu} onClick={this.onMapClick().bind(this)}>
                    <img src="../imges/ico_garbage_can.png" style={styles.img}/>
                </div>
            </div>
        );
    }
}
CustomControl = Radium(CustomControl);
