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
  midi: ?string,
  isLoaded: boolean,
  scriptCache: any,
  vrvToolkit: any,
  score: {
    totalPageNum: number,
  },
  current: {
    pageNum: number,
  },
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
      midi: null,
      isLoaded: false,
      scriptCache: {},
      vrvToolkit: {},
      score: {
        totalPageNum: 0,
      },
      current: {
        pageNum: 1,
      },
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
      this.fetchScoreData();
      this.initVrvToolkit();
      document.addEventListener("keydown", this.handleKeyPress, false);
    }

    componentDidUpdate(prevProps) {
      const { isLoaded } = this.state;
      const { page } = this.props;
      if (page !== prevProps.page && isLoaded) {
        this.loadScorePage();
      }
    }

    setScoreOption() {
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

    handleKeyPress = e => {
      e = e || window.event;
      const type = e.key;

      const arrowKeys = {
        ArrowLeft: () => this.movePrevPage(),
        ArrowRight: () => this.moveNextPage(),
        ArrowUp: () => {},
        ArrowDown: () => {},
        default: () => {},
      };
      (arrowKeys[type] || arrowKeys.default)();
    };

    initScorePage(pageNum = 1) {
      const { vrvToolkit } = this.state;
      if (vrvToolkit) {
        this.setScoreOption();
        vrvToolkit.redoLayout();
        const musicScoreSvg = vrvToolkit.renderToSVG(pageNum, {});
        const totalPageNum = vrvToolkit.getPageCount();
        const midi = `data:audio/midi;base64${vrvToolkit.renderToMIDI()}`;

        this.setState({
          musicScoreSvg,
          midi,
          score: {
            totalPageNum,
          },
        });
      }
    }

    loadScorePage(pageNum = 1) {
      const { vrvToolkit } = this.state;
      if (vrvToolkit) {
        vrvToolkit.redoLayout();
        const musicScoreSvg = vrvToolkit.renderToSVG(pageNum, {});
        this.setState({
          musicScoreSvg,
        });
      }
    }

    moveNextPage() {
      const { score, current } = this.state;
      if (current.pageNum < score.totalPageNum) {
        this.setState(prevState => ({
          current: {
            pageNum: prevState.current.pageNum + 1,
          },
        }));
        this.loadScorePage(current.pageNum + 1);
      }
    }

    movePrevPage() {
      const { current } = this.state;
      if (current.pageNum > 1) {
        this.setState(prevState => ({
          current: {
            pageNum: prevState.current.pageNum - 1,
          },
        }));
        this.loadScorePage(current.pageNum - 1);
      }
    }

    fetchScoreData() {
      axios({
        method: "get",
        url: "/static/chopin10_3.mei",
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
    }

    initVrvToolkit() {
      const { scriptCache } = this.state;
      scriptCache &&
        scriptCache.verovio.onLoad((err, tag) => {
          this.setState(
            {
              error: tag.error,
              isLoaded: true,
              vrvToolkit: new window.verovio.toolkit(),
            },
            () => this.loadScore()
          );
        });
    }

    loadScore() {
      const { vrvToolkit, musicScore } = this.state;
      if (vrvToolkit) {
        vrvToolkit.loadData(musicScore);
        this.initScorePage();
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
