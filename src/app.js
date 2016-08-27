import React from "react";
import {render} from "react-dom";
// import MapArea from "./MapAreaWithLeaflet.js";
import MapArea from "./MapAreaWithReactLeaflet.js";

export default class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div>
                <MapArea />
            </div>
        );
    }
}

render(
    <App />,
    document.getElementById('app')
);
