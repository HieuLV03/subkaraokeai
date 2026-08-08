"use client";

import "./KaraokeCanvas.css";

import SubtitleLine from "../editor/Preview/SubtitleLine";

import { useLyricsStore } from "@/stores/lyrics.store";
import { useEditorStore } from "@/stores/editor.store";

export default function KaraokeCanvas() {

    const lyrics = useLyricsStore(
        (state) => state.lyrics
    );

    const currentTime = useEditorStore(
        (state) => state.currentTime
    );


    // Lấy TẤT CẢ line đang nằm trong khoảng thời gian hiện tại
    const currentLines = lyrics.filter(
        (line) =>
            currentTime >= line.start &&
            currentTime <= line.end
    );


    return (
        <div className="karaoke-canvas">

            {currentLines.length === 0 && (
                <div className="waiting-text">
                    Waiting lyric...
                </div>
            )}


            {currentLines.map((line) => (

                <SubtitleLine
                    key={line.id}

                    line={line}

                    currentTime={currentTime}

                    color="#ffffff"

                    activeColor="#00ff66"
                />

            ))}

        </div>
    );
}