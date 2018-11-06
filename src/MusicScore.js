// @flow
import React, { Component } from "react";
import axios from "axios";
import cache from "./utils/ScriptCache";
import { SCRIPTS } from "./constants";
import { ScoreProvider, ScoreConsumer } from "./context";

type Props = {
  /* ... */
};

type State = {
  error: boolean,
  errorMessage: ?string,
  musicScore: ?string,
  musicScoreSvg: ?HTMLDivElement,
  loaded: boolean,
  scriptCache: any,
  vrvToolkit: any,
};

const Container = () => (
  <ScoreConsumer>
    {({ loaded, error, musicScoreSvg }) =>
      loaded && !error ? (
        <div dangerouslySetInnerHTML={{ __html: musicScoreSvg }} />
      ) : (
        <div>Loading</div>
      )
    }
  </ScoreConsumer>
);

const Wrapper = () => WrappedComponent => {
  class ScoreWrapper extends Component<Props, State> {
    state = {
      error: false,
      errorMessage: "",
      musicScore: null,
      musicScoreSvg: null,
      loaded: false,
      scriptCache: {},
      vrvToolkit: {},
    };

    static getDerivedStateFromProps(state: State) {
      if (!state.scriptCache) {
        return {
          scriptCache: cache({
            verovio: SCRIPTS.verovio,
          }),
        };
      }
      return null;
    }

    componentDidMount() {
      const { scriptCache } = this.state;
      axios({
        method: "get",
        url: "/static/Beethoven_StringQuartet_op.18_no.2.mei",
        responseType: "text",
      })
        .then(response => {
          this.setState({
            musicScore: response.data,
          });
        })
        .catch(error => {
          this.setState({
            error: true,
            errorMessage: error,
          });
        });

      scriptCache &&
        scriptCache.verovio.onLoad((err, tag) => {
          this.setState(
            {
              error: tag.error,
              loaded: true,
              vrvToolkit: new window.verovio.toolkit(),
            },
            () => {
              this.loadMusicScore();
            }
          );
        });
    }

    loadMusicScore() {
      const { vrvToolkit, musicScore } = this.state;
      const musicScoreSvg = vrvToolkit && vrvToolkit.renderData(musicScore, {});
      this.setState({ musicScoreSvg });
    }

    render() {
      return (
        <ScoreProvider value={this.state}>
          <WrappedComponent />
        </ScoreProvider>
      );
    }
  }

  return ScoreWrapper;
};

export default Wrapper()(Container);
