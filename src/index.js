import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import { Grommet, Box, Heading } from "grommet";
import { grommet, hpe, dark } from "grommet/themes";

import * as serviceWorker from "./serviceWorker";

const THEMES = {
  grommet,
  hpe,
  dark,
};

const App = () => {
  const color = "#FFD6D6";
  const themeName = "grommet";
  return (
    <Grommet theme={THEMES[themeName || "grommet"]}>
      <Box
        background={color}
        style={{ minHeight: "100vh", transition: "background 2s" }}
      >
        <Heading level={3} responsive>
          MIDI performance Visualization
        </Heading>
      </Box>
    </Grommet>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));

if (module.hot) {
  module.hot.accept();
}

serviceWorker.unregister();
