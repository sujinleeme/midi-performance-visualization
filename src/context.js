import React from "react";

const Score = React.createContext({});
const MusicPlayer = React.createContext({});

export const ScoreProvider = Score.Provider;
export const ScoreConsumer = Score.Consumer;

export const MusicPlayerProvider = MusicPlayer.Provider;
export const MusicPlayerConsumer = MusicPlayer.Consumer;
