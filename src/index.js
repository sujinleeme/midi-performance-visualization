import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import { Grid, Grommet, Heading, Box, Paragraph } from "grommet";
import { grommet, hpe, dark } from "grommet/themes";

import MusicScore from "./MusicScore";
import * as serviceWorker from "./serviceWorker";

// if (process.env.NODE_ENV !== "production") {
//   const { whyDidYouUpdate } = require("why-did-you-update");
//   whyDidYouUpdate(React);
// }

const THEMES = {
  grommet,
  hpe,
  dark,
};

const measureElement = element => ({
  width: element.current.getBoundingClientRect().width,
  height: element.current.getBoundingClientRect().height,
});

class App extends React.Component {
  scoreEL = React.createRef();

  pageEl = React.createRef();

  state = {
    scoreView: {
      height: 0,
      width: 0,
      zoom: 30,
    },
  };

  componentDidMount() {
    this.onScoreSizeChange();
    window.addEventListener("resize", this.onScoreSizeChange.bind(this));
  }

  onScoreSizeChange() {
    const result = measureElement(this.scoreEL);
    const { scoreView } = this.state;
    this.setState({
      scoreView: { ...scoreView, ...result },
    });
  }

  render() {
    const themeName = "grommet";
    const { scoreView } = this.state;
    return (
      <Grommet theme={THEMES[themeName || "grommet"]}>
        <Box>
          <Grid
            margin="small"
            areas={[
              { name: "header", start: [0, 0], end: [1, 0] },
              { name: "main", start: [0, 1], end: [0, 1] },
              { name: "control", start: [1, 1], end: [1, 1] },
              { name: "foot", start: [0, 2], end: [1, 2] },
            ]}
            columns={["3/4", "1/4"]}
            rows={["auto", "300px", "auto"]}
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
            <Box ref={this.scoreEL} gridArea="main">
              <MusicScore page={scoreView} />
            </Box>
            <Box gridArea="control" background="brand">
              control
            </Box>
            <Box gridArea="foot" background="dark">
              <Box>
                <Paragraph margin="none">©</Paragraph>
              </Box>
            </Box>
          </Grid>
        </Box>
      </Grommet>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

if (module.hot) {
  module.hot.accept();
}

serviceWorker.unregister();
