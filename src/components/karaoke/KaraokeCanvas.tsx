"use client";

import "./KaraokeCanvas.css";

import SubtitleLine from "../editor/Preview/SubtitleLine";

import {
    useLyricsStore
} from "@/stores/lyrics.store";


import {
    useEditorStore
} from "@/stores/editor.store";



export default function KaraokeCanvas(){


    const lyrics =
        useLyricsStore(
            state => state.lyrics
        );


    const currentTime =
        useEditorStore(
            state => state.currentTime
        );



    const currentLine =
        lyrics.find(

            line =>

                currentTime >= line.start &&
                currentTime <= line.end

        );



    return (

        <div className="karaoke-canvas">


            {
                !currentLine && (

                    <div className="waiting-text">

                        Waiting lyric...

                    </div>

                )
            }



            {
                currentLine && (

                    <SubtitleLine

                        line={currentLine}

                        currentTime={currentTime}

                        color="#ffffff"

                        activeColor="#00ff66"

                    />

                )
            }



        </div>

    );

}