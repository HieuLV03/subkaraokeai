import { create } from "zustand";

import {
  KaraokeProject,
  LyricLine,
} from "@/types/project";

interface ProjectState {
  project: KaraokeProject | null;

  createProject: (name: string) => void;

  setAudioFile: (audioFile: string) => void;

  setVideoFile: (videoFile: string) => void;

  setLyrics: (lyrics: LyricLine[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,

  createProject: (name) =>
    set({
      project: {
        id: crypto.randomUUID(),

        name,

        audioFile: null,

        videoFile: null,

        vocalFile: null,

        instrumentalFile: null,

        lyricFile: null,

        outputFolder: null,

        duration: 0,

        lyrics: [],

        createdAt: new Date(),

        updatedAt: new Date(),
      },
    }),

  setAudioFile: (audioFile) =>
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,

          audioFile,

          updatedAt: new Date(),
        },
      };
    }),

  setVideoFile: (videoFile) =>
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,

          videoFile,

          updatedAt: new Date(),
        },
      };
    }),

  setLyrics: (lyrics) =>
    set((state) => {
      if (!state.project) return state;

      return {
        project: {
          ...state.project,

          lyrics,

          updatedAt: new Date(),
        },
      };
    }),
}));