// @flow
import React, { Component } from "react";
import { Meter, Stack } from "grommet";

import {
  PlayFill,
  PauseFill,
  Volume,
  VolumeLow,
  VolumeMute,
} from "grommet-icons";
import MIDISounds from "midi-sounds-react";
import MIDIFile from "../../MIDIFile";
import { MusicPlayerProvider, MusicPlayerConsumer } from "../../context";

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const findFirstIns = (player: Object, nn: Object): ?number => {
  for (let i = 0; i < player.loader.instrumentKeys().length; i++) {
    if (nn === 1 * player.loader.instrumentKeys()[i].substring(0, 3)) {
      return i;
    }
  }
};

type Props = {
  midi: ?string,
};

type State = {
  currentSongTime: number,
  reverberator: ?Object,
  isPlayed: boolean,
  leftTime: number,
  nextPositionTime: number,
  nextStepTime: number,
  playMode: string,
  player: any,
  playing: boolean,
  progress: number,
  song: {
    beats: Array<Object>,
    duration: number,
    tracks: Array<Object>,
  },
  songStart: number,
  volume: number,
};

class MusicPlayer extends Component<Props, State> {
  state = {
    currentSongTime: 0,
    reverberator: {},
    isPlayed: false,
    leftTime: 0,
    nextPositionTime: 0,
    nextStepTime: 0,
    playMode: "loop",
    player: {},
    playing: false,
    progress: 0,
    song: {
      beats: [],
      duration: 0,
      tracks: [],
    },
    songStart: 0,
    volume: 1,
  };

  audioContextFunc: window = window.AudioContext || window.webkitAudioContext;

  audioContext: Object = new this.audioContextFunc();

  midiFile: Object = new MIDIFile();

  midiSoundsRef: Object = React.createRef();

  scrubberRef: ?Object = React.createRef();

  stepDuration: number = 44 / 1000;

  handleAdjustPlay: () => void = this.handleAdjustPlay.bind(this);

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { song, playing } = this.state;
    const { midi } = this.props;
    if (midi !== prevProps.midi) {
      this.parseMIDISong();
    }
    if (song !== prevState.song) {
      this.startLoad();
    }
    if (playing !== prevState.playing) {
      playing && this.startPlay();
    }
  }

  startPlay = () => {
    const { isPlayed, song, progress } = this.state;

    if (isPlayed) {
      const next = (song.duration * progress) / 100;
      this.setState(prevState => ({
        songStart: prevState.songStart - (next - prevState.currentSongTime),
        currentSongTime: next,
      }));
    } else {
      this.setState(prevState => ({
        isPlayed: !prevState.isPlayed,
        currentSongTime: 0,
        songStart: this.audioContext.currentTime,
        nextStepTime: this.audioContext.currentTime,
      }));
    }
    return this.tick();
  };

  handleAdjustVolume = () => {
    this.setState(prevState => ({
      volume: prevState.volume === 2 ? 0 : prevState.volume + 1,
    }));
  };

  tick = () => {
    const { currentSongTime, nextStepTime, song, playing } = this.state;
    if (!playing || !song) {
      return;
    }
    if (this.audioContext.currentTime > nextStepTime - this.stepDuration) {
      this.sendNotes(currentSongTime, currentSongTime + this.stepDuration);
      this.setState((prevState: State) => ({
        progress: Math.round(
          (100 * prevState.currentSongTime) / prevState.song.duration
        ),
        currentSongTime: prevState.currentSongTime + this.stepDuration,
        nextStepTime: prevState.nextStepTime + this.stepDuration,
      }));

      // end Song
      if (currentSongTime > song.duration) {
        this.setState({
          progress: 0,
          playing: false,
          isPlayed: false,
          currentSongTime: 0,
          songStart: 0,
        });
      }
    }

    window.requestAnimationFrame(() => {
      this.tick();
    });
  };

  sendNotes = (start: number, end: number) => {
    const { song, songStart, reverberator, player } = this.state;
    // console.log(song.tracks);

    if (!song) {
      return;
    }

    for (let t = 0; t < song.tracks.length; t++) {
      const track = song.tracks[t];
      for (let i = 0; i < track.notes.length; i++) {
        if (track.notes[i].when >= start && track.notes[i].when < end) {
          const when = songStart + track.notes[i].when;
          let { duration } = track.notes[i];
          if (duration > 3) {
            duration = 3;
          }
          const instr = track.info.variable;
          const v = track.volume / 7;
          player &&
            player.queueWaveTable(
              this.audioContext,
              reverberator,
              window[instr],
              when,
              track.notes[i].pitch,
              duration,
              v,
              track.notes[i].slides
            );
        }
      }
    }

    for (let b = 0; b < song.beats.length; b++) {
      const beat = song.beats[b];
      for (let i = 0; i < beat.notes.length; i++) {
        if (beat.notes[i].when >= start && beat.notes[i].when < end) {
          const when = songStart + beat.notes[i].when;
          const duration = 1.5;
          const instr = beat.info.variable;
          const v = beat.volume / 2;
          player &&
            player.queueWaveTable(
              this.audioContext,
              reverberator,
              window[instr],
              when,
              beat.n,
              duration,
              v
            );
        }
      }
    }
  };

  seek = e => {
    if (this.scrubberRef) {
      const scrubberRect = this.scrubberRef.getBoundingClientRect();
      const percent =
        ((e.clientX - scrubberRect.left) / scrubberRect.width) * 100;
      const { player, song } = this.state;
      this.setState({ progress: percent });
      player.cancelQueue(this.audioContext);
      const next = (song.duration * percent) / 100;
      this.setState((prevState: State) => ({
        playing: true,
        songStart: prevState.songStart - (next - prevState.currentSongTime),
        currentSongTime: next,
      }));
    }
  };

  parseMIDISong = () => {
    const { midi } = this.props;
    if (midi) {
      const arrayBuffer = base64ToArrayBuffer(midi);
      const midiFile = new MIDIFile(arrayBuffer);
      const song = midiFile.parseSong();
      this.setState({ song });
    }
  };

  startLoad = () => {
    this.midiSoundsRef.current &&
      this.setState({ player: this.midiSoundsRef.current.player }, () => {
        const { song, player } = this.state;
        const reverberator = player.createReverberator(this.audioContext);
        reverberator.output.connect(this.audioContext.destination);
        this.setState({ reverberator: reverberator.input });
        // set Instrument to every track
        for (let i = 0; i < song.tracks.length; i++) {
          const nn = findFirstIns(player, song.tracks[i].program);
          const info = player.loader.instrumentInfo(nn);
          song.tracks[i].info = info;
          song.tracks[i].id = nn;
          player.loader.startLoad(this.audioContext, info.url, info.variable);
        }
      });
  };

  handleAdjustPlay() {
    this.setState(prevState => ({
      playing: !prevState.playing,
    }));
  }

  render() {
    return (
      <MusicPlayerProvider value={this.state}>
        <PlayButton onClick={this.handleAdjustPlay} />
        <VolumeButton onClick={() => this.handleAdjustVolume()} />
        <Stack>
          <div
            ref={e => {
              this.scrubberRef = e;
            }}
          >
            <AudioProgressBar onClick={this.seek} />
          </div>
        </Stack>
        <MIDISounds appElementName="root" ref={this.midiSoundsRef} />
      </MusicPlayerProvider>
    );
  }
}

const PlayButton = ({ onClick }) => (
  <MusicPlayerConsumer>
    {({ playing }) =>
      playing ? <PauseFill onClick={onClick} /> : <PlayFill onClick={onClick} />
    }
  </MusicPlayerConsumer>
);

const VolumeButton = ({ onClick }) => {
  const icons = [
    <VolumeMute onClick={onClick} />,
    <VolumeLow onClick={onClick} />,
    <Volume onClick={onClick} />,
  ];
  return (
    <MusicPlayerConsumer>{({ volume }) => icons[volume]}</MusicPlayerConsumer>
  );
};

const AudioProgressBar = ({ onClick }) => (
  <MusicPlayerConsumer>
    {({ progress }) => (
      <Stack>
        <Meter
          aria-label="Audio progress"
          type="bar"
          size="full"
          onClick={onClick}
          thickness="small"
          values={[
            {
              color: "accent-1",
              value: progress,
            },
          ]}
        />
      </Stack>
    )}
  </MusicPlayerConsumer>
);

export default MusicPlayer;
