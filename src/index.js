import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import { Grommet, Heading } from "grommet";
import { grommet, hpe, dark } from "grommet/themes";
import MusicScore from "./MusicScore";
import * as serviceWorker from "./serviceWorker";

if (process.env.NODE_ENV !== "production") {
  const { whyDidYouUpdate } = require("why-did-you-update");
  whyDidYouUpdate(React);
}

const THEMES = {
  grommet,
  hpe,
  dark,
};

class App extends React.Component {
  render() {
    const themeName = "grommet";
    return (
      <Grommet theme={THEMES[themeName || "grommet"]}>
        <Heading level={3} responsive>
          MIDI performance Visualization
        </Heading>
        <MusicScore />
      </Grommet>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

if (module.hot) {
  module.hot.accept();
}

serviceWorker.unregister();
