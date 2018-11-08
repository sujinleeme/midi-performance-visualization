// @flow
import React, { Component } from "react";
import axios from "axios";
import cache from "./utils/ScriptCache";
import { SCRIPTS } from "./constants";
import { ScoreProvider, ScoreConsumer } from "./context";

type Props = {
  page: Object,
};

type State = {
  error: boolean,
  errorMessage: ?string,
  musicScore: ?string,
  musicScoreSvg: ?HTMLDivElement,
  isLoaded: boolean,
  scriptCache: any,
  vrvToolkit: any,
};

const Container = () => (
  <ScoreConsumer>
    {({ isLoaded, error, musicScoreSvg }) =>
      isLoaded && !error ? (
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
      isLoaded: false,
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
              isLoaded: true,
              vrvToolkit: new window.verovio.toolkit(),
            },
            () => {
              this.loadScore();
            }
          );
        });
    }

    componentDidUpdate(prevProps) {
      const { isLoaded } = this.state;
      const { page } = this.props;
      if (page !== prevProps.page && isLoaded) {
        this.loadScorePage();
      }
    }

    setMusicScoreOptions() {
      const { vrvToolkit } = this.state;
      const { page } = this.props;

      const options = {
        pageHeight: (page.height * 100) / page.zoom,
        pageWidth: (page.width * 100) / page.zoom,
        scale: page.zoom,
        adjustPageHeight: true,
      };
      page && vrvToolkit.setOptions(options);
    }

    loadScore() {
      const { vrvToolkit, musicScore } = this.state;
      if (vrvToolkit) {
        this.setMusicScoreOptions();
        vrvToolkit.loadData(musicScore);
        this.loadScorePage();
      }
    }

    loadScorePage(pageNumer = 1) {
      const { vrvToolkit } = this.state;
      if (vrvToolkit) {
        this.setMusicScoreOptions();
        vrvToolkit.redoLayout();
        const musicScoreSvg = vrvToolkit.renderToSVG(pageNumer, {});
        this.setState({ musicScoreSvg });
      }
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
