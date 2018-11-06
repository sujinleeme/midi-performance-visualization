import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import { Grid, Grommet, Heading, Box, Paragraph } from "grommet";
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
        <Grid
          margin="small"
          areas={[
            { name: "header", start: [0, 0], end: [1, 0] },
            { name: "main", start: [0, 1], end: [0, 1] },
            { name: "control", start: [1, 1], end: [1, 1] },
            { name: "foot", start: [0, 2], end: [1, 2] },
          ]}
          columns={["3/4", "1/4"]}
          rows={["auto", "large", "auto"]}
        >
          <Box gridArea="header" background="brand">
            <Box
              background="brand"
              direction="row"
              align="center"
              pad={{ between: "medium" }}
            >
              <Heading level={3} responsive>
                MIDI performance Visualization
              </Heading>
            </Box>
          </Box>
          <Box gridArea="main" background="gray">
            <MusicScore />
          </Box>
          <Box gridArea="control" background="brand">
            control
          </Box>
          <Box gridArea="foot" background="dark">
            <Box>
              <Paragraph margin="none">© 2018 SNU MARG x KASIT MAC</Paragraph>
            </Box>
          </Box>
        </Grid>
      </Grommet>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

if (module.hot) {
  module.hot.accept();
}

serviceWorker.unregister();
