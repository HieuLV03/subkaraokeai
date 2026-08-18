"use client";

import { useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/stores/editor.store";
import { useProjectStore } from "@/stores/project.store";

export default function AudioPlayer() {

    const audioRef =
        useRef<HTMLAudioElement | null>(null);

    const [audioSrc, setAudioSrc] = useState("");


    // ==========================
    // PROJECT
    // ==========================

    const audioFile = useProjectStore(
        state => state.project?.audioFile
    );


    // ==========================
    // EDITOR STORE
    // ==========================

    const playing = useEditorStore(
        state => state.playing
    );

    const currentTime = useEditorStore(
        state => state.currentTime
    );

    const playbackRate = useEditorStore(
        state => state.playbackRate
    );

    const volume = useEditorStore(
        state => state.volume
    );


    const play = useEditorStore(
        state => state.play
    );

    const pause = useEditorStore(
        state => state.pause
    );


    const setCurrentTime = useEditorStore(
        state => state.setCurrentTime
    );

    const setDuration = useEditorStore(
        state => state.setDuration
    );

    const setAudioRef = useEditorStore(
        state => state.setAudioRef
    );


    // ==========================
    // AUDIO REF
    // ==========================

    useEffect(() => {

        setAudioRef(
            audioRef.current
        );

        return () => {

            setAudioRef(null);

        };

    }, [setAudioRef]);


    // ==========================
    // AUDIO FILE
    // ==========================

    useEffect(() => {

        if (!audioFile) {

            setAudioSrc("");

            setCurrentTime(0);

            setDuration(0);

            pause();

            return;
        }


        const filename =
            audioFile
                .split(/[\\/]/)
                .pop()!;


        const url =
            `http://127.0.0.1:38555/imports/${filename}`;


        console.log(
            "audioFile =",
            audioFile
        );

        console.log(
            "audioSrc =",
            url
        );


        /*
         * Audio mới:
         *
         * 1. Dừng
         * 2. Về đầu
         * 3. Load audio
         */

        pause();

        setCurrentTime(0);

        setDuration(0);

        setAudioSrc(url);

    }, [
        audioFile,
        pause,
        setCurrentTime,
        setDuration
    ]);


    // ==========================
    // LOADED METADATA
    // ==========================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) return;


        const loaded = () => {

            console.log(
                "duration =",
                audio.duration
            );


            /*
             * Luôn bắt đầu từ đầu
             */

            audio.currentTime = 0;

            setCurrentTime(0);

            setDuration(
                audio.duration
            );


            /*
             * Không tự chạy
             */

            audio.pause();

            pause();

        };


        audio.addEventListener(
            "loadedmetadata",
            loaded
        );


        return () => {

            audio.removeEventListener(
                "loadedmetadata",
                loaded
            );

        };

    }, [
        setCurrentTime,
        setDuration,
        pause
    ]);


    // ==========================
    // PLAY / PAUSE
    // ==========================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) return;


        if (playing) {

            audio
                .play()
                .catch(error => {

                    console.error(
                        "Audio play error:",
                        error
                    );

                    /*
                     * Browser từ chối play
                     * thì trả state về pause.
                     */

                    pause();

                });

        } else {

            audio.pause();

        }

    }, [
        playing,
        pause
    ]);


    // ==========================
    // SEEK
    // ==========================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) return;


        if (
            Math.abs(
                audio.currentTime -
                currentTime
            ) > 0.03
        ) {

            audio.currentTime =
                currentTime;

        }

    }, [currentTime]);


    // ==========================
    // PLAYBACK RATE
    // ==========================

    useEffect(() => {

        if (!audioRef.current) {
            return;
        }

        audioRef.current.playbackRate =
            playbackRate;

    }, [playbackRate]);


    // ==========================
    // VOLUME
    // ==========================

    useEffect(() => {

        if (!audioRef.current) {
            return;
        }

        audioRef.current.volume =
            volume;

    }, [volume]);


    // ==========================
    // CURRENT TIME
    // ==========================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) return;


        let animationFrame = 0;


        const update = () => {

            if (!audio.paused) {

                setCurrentTime(
                    audio.currentTime
                );

            }


            animationFrame =
                requestAnimationFrame(
                    update
                );

        };


        animationFrame =
            requestAnimationFrame(
                update
            );


        return () => {

            cancelAnimationFrame(
                animationFrame
            );

        };

    }, [setCurrentTime]);


    // ==========================
    // AUDIO ENDED
    // ==========================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) return;


        const handleEnded = () => {

            pause();

            setCurrentTime(
                audio.duration || 0
            );

        };


        audio.addEventListener(
            "ended",
            handleEnded
        );


        return () => {

            audio.removeEventListener(
                "ended",
                handleEnded
            );

        };

    }, [
        pause,
        setCurrentTime
    ]);


    return (

        <audio
            ref={audioRef}
            src={audioSrc}
            preload="auto"
            muted

        />

    );
}