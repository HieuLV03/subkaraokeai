"use client";

import { useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/stores/editor.store";
import { useProjectStore } from "@/stores/project.store";

export default function AudioPlayer() {

    const audioRef =
        useRef<HTMLAudioElement | null>(null);

    const [audioSrc, setAudioSrc] =
        useState("");


    // =========================================================
    // PROJECT
    // =========================================================

    const audioFile =
        useProjectStore(
            state => state.project?.audioFile
        );


    // =========================================================
    // EDITOR STATE
    // =========================================================

    const playing =
        useEditorStore(
            state => state.playing
        );

    const currentTime =
        useEditorStore(
            state => state.currentTime
        );

    const playbackRate =
        useEditorStore(
            state => state.playbackRate
        );

    const volume =
        useEditorStore(
            state => state.volume
        );


    const pause =
        useEditorStore(
            state => state.pause
        );

    const setCurrentTime =
        useEditorStore(
            state => state.setCurrentTime
        );

    const setDuration =
        useEditorStore(
            state => state.setDuration
        );

    const setAudioRef =
        useEditorStore(
            state => state.setAudioRef
        );


    // =========================================================
    // AUDIO REF
    // =========================================================

    useEffect(() => {

        setAudioRef(
            audioRef.current
        );

        return () => {

            setAudioRef(null);

        };

    }, [setAudioRef]);


    // =========================================================
    // AUDIO FILE
    // =========================================================

    useEffect(() => {

        // =====================================================
        // MANUAL MODE
        //
        // Không có audio
        // AudioPlayer không làm MASTER
        // Preview/video sẽ tự chạy.
        // =====================================================

        if (!audioFile) {

            setAudioSrc("");

            return;

        }


        // =====================================================
        // AI MODE / AUDIO MODE
        // =====================================================

        const filename =
            audioFile
                .split(/[\\/]/)
                .pop();

        if (!filename) {

            setAudioSrc("");

            return;

        }


        const url =
            `http://127.0.0.1:38555/imports/${encodeURIComponent(
                filename
            )}`;


        console.log(
            "audioFile =",
            audioFile
        );

        console.log(
            "audioSrc =",
            url
        );


        // =====================================================
        // AUDIO MỚI
        // =====================================================

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


    // =========================================================
    // LOADED METADATA
    // =========================================================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }


        // Không có audio
        if (!audioSrc) {
            return;
        }


        const loaded = () => {

            console.log(
                "Audio duration =",
                audio.duration
            );


            audio.currentTime = 0;

            setCurrentTime(0);

            setDuration(
                audio.duration
            );


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
        audioSrc,
        setCurrentTime,
        setDuration,
        pause
    ]);


    // =========================================================
    // PLAY / PAUSE
    //
    // CHỈ AUDIO MODE MỚI ĐƯỢC AUDIOPLAYER ĐIỀU KHIỂN
    // =========================================================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }


        // =====================================================
        // MANUAL MODE
        //
        // Không có audio => bỏ qua hoàn toàn.
        // Không gọi audio.play()
        // =====================================================

        if (!audioSrc) {

            return;

        }


        // =====================================================
        // AUDIO MODE
        // =====================================================

        if (playing) {

            audio
                .play()
                .catch(error => {

                    console.error(
                        "Audio play error:",
                        error
                    );

                    pause();

                });

        }
        else {

            audio.pause();

        }

    }, [
        playing,
        audioSrc,
        pause
    ]);


    // =========================================================
    // SEEK
    //
    // CHỈ SEEK AUDIO KHI CÓ AUDIO
    // =========================================================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }


        if (!audioSrc) {
            return;
        }


        if (
            Math.abs(
                audio.currentTime -
                currentTime
            ) > 0.03
        ) {

            try {

                audio.currentTime =
                    currentTime;

            }
            catch {

                // Audio chưa ready

            }

        }

    }, [
        currentTime,
        audioSrc
    ]);


    // =========================================================
    // PLAYBACK RATE
    // =========================================================

    useEffect(() => {

        if (!audioRef.current) {
            return;
        }

        audioRef.current.playbackRate =
            playbackRate;

    }, [
        playbackRate
    ]);


    // =========================================================
    // VOLUME
    // =========================================================

    useEffect(() => {

        if (!audioRef.current) {
            return;
        }

        audioRef.current.volume =
            volume;

    }, [
        volume
    ]);


    // =========================================================
    // CURRENT TIME
    //
    // AUDIO LÀ MASTER CHỈ KHI CÓ AUDIO
    // =========================================================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }


        if (!audioSrc) {
            return;
        }


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

    }, [
        audioSrc,
        setCurrentTime
    ]);


    // =========================================================
    // AUDIO ENDED
    // =========================================================

    useEffect(() => {

        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }


        if (!audioSrc) {
            return;
        }


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
        audioSrc,
        pause,
        setCurrentTime
    ]);


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <audio
            ref={audioRef}
            src={audioSrc}
            preload="auto"
            muted
        />

    );

}