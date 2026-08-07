export interface LyricWord {
  id: string;
  text: string;
  start: number;
  end: number;
}

export interface LyricLine {
  id: string;
  start: number;
  end: number;
  text: string;
  words: LyricWord[];
}

export interface KaraokeProject {
  id: string;

  name: string;

  audioFile: string | null;

  videoFile: string | null;

  vocalFile: string | null;

  instrumentalFile: string | null;

  lyricFile: string | null;

  outputFolder: string | null;

  duration: number;

  lyrics: LyricLine[];

  createdAt: Date;

  updatedAt: Date;
}