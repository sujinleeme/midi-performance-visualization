// @flow

import React, { Component } from "react";
import axios from "axios";
import cache from "./utils/ScriptCache";
import { SCRIPTS } from "./constants";
import { ScoreProvider, ScoreConsumer } from "./context";
import MusicPlayer from "./MusicPlayer";

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
  score: {
    totalPageNum: number,
  },
  current: {
    pageNum: number,
  },
};

const ScoreView = () => (
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
      score: {
        totalPageNum: 0,
      },
      current: {
        pageNum: 1,
      },
    };

    vrvToolkit: Object = {};

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

    componentDidUpdate(prevProps: Props) {
      const { isLoaded } = this.state;
      const { page } = this.props;
      if (page !== prevProps.page && isLoaded) {
        this.reloadScoreSVG();
      }
    }

    componentWillUnmount() {
      document.removeEventListener("keydown", this.handleKeyPress, false);
    }

    setScoreOption() {
      const { page } = this.props;
      const options = {
        pageHeight: (page.height * 100) / page.zoom,
        pageWidth: (page.width * 100) / page.zoom,
        scale: page.zoom,
        adjustPageHeight: true,
      };
      this.vrvToolkit && page && this.vrvToolkit.setOptions(options);
    }

    handleKeyPress = (e: any) => {
      // const doc: HTMLElement | null = document;

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

    initScorePage(pageNum: number = 1) {
      if (this.vrvToolkit) {
        this.setScoreOption();
        this.vrvToolkit.redoLayout();
        const musicScoreSvg = this.vrvToolkit.renderToSVG(pageNum, {});
        const totalPageNum = this.vrvToolkit.getPageCount();
        const midi = `${this.vrvToolkit.renderToMIDI()}`;

        this.setState({
          musicScoreSvg,
          midi,
          score: {
            totalPageNum,
          },
        });
      }
    }

    reloadScoreSVG(pageNum: number = 1) {
      if (this.vrvToolkit) {
        this.setScoreOption();
        this.vrvToolkit.redoLayout();
        const musicScoreSvg = this.vrvToolkit.renderToSVG(pageNum, {});
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
        this.reloadScoreSVG(current.pageNum + 1);
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
        this.reloadScoreSVG(current.pageNum - 1);
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
            },
            () => {
              this.vrvToolkit = new window.verovio.toolkit();
              if (this.vrvToolkit) {
                this.loadScore();
              }
            }
          );
        });
    }

    loadScore() {
      const { musicScore } = this.state;
      this.vrvToolkit.loadData(musicScore);
      this.initScorePage();
    }

    render() {
      const { midi } = this.state;
      return (
        <div>
          <ScoreProvider value={this.state}>
            <WrappedComponent />
          </ScoreProvider>
          <MusicPlayer midi={midi} />
        </div>
      );
    }
  }

  return ScoreWrapper;
};

export default Wrapper()(ScoreView);
