"use client";

import {
    useEffect,
    useRef
} from "react";

import {
    useEditorStore
} from "@/stores/editor.store";

import {
    useLyricsStore
} from "@/stores/lyrics.store";


export default function SyncRecorder(){


    const holding =
        useRef(false);


    const startTime =
        useRef(0);



    const audio =
        useEditorStore(
            state => state.audioRef
        );



    useEffect(()=>{


        function keyDown(
            e:KeyboardEvent
        ){


            if(
                e.code !== "Space"
            )
                return;


            if(
                holding.current
            )
                return;



            e.preventDefault();



            if(!audio)
                return;



            const state =
                useLyricsStore.getState();

const line = state.lyrics.find(
    line =>
        (line.words ?? []).some(
            word => !word.synced
        )
);


            if(!line)
                return;



            holding.current = true;



            startTime.current =
                audio.currentTime;



            console.log(
                "SYNC START",
                startTime.current
            );


        }




        function keyUp(
            e:KeyboardEvent
        ){


            if(
                e.code !== "Space"
            )
                return;


            if(
                !holding.current
            )
                return;



            e.preventDefault();



            if(!audio)
                return;



            const end =
                audio.currentTime;



            const state =
                useLyricsStore.getState();



            const line =
                state.lyrics.find(
                    line =>
                    line.words.some(
                        word =>
                        !word.synced
                    )
                );



            if(!line)
                return;


        const word =
    line.words?.find(
        word => !word.synced
    );

            if(!word)
                return;



            state.updateWord(

                line.id,

                word.id,

                {

                    start:
                    startTime.current,


                    end,


                    synced:true

                }

            );



            console.log(
                "SYNC WORD",
                {
                    word:word.word,
                    start:startTime.current,
                    end
                }
            );



            holding.current=false;


        }



        window.addEventListener(
            "keydown",
            keyDown
        );


        window.addEventListener(
            "keyup",
            keyUp
        );



        return ()=>{


            window.removeEventListener(
                "keydown",
                keyDown
            );


            window.removeEventListener(
                "keyup",
                keyUp
            );


        };


    },[audio]);



    return null;

}