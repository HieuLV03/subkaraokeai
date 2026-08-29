
"use client";

import "./Preview.css";

import KaraokeCanvas from "../../karaoke/KaraokeCanvas";

import {
    useProjectStore,
} from "@/stores/project.store";

import {
    useEditorStore,
} from "@/stores/editor.store";

import {
    useEffect,
    useRef,
} from "react";


export default function Preview() {

    // =========================================================
    // VIDEO FILE
    // =========================================================

    const videoFile =
        useProjectStore(
            state => state.project?.videoFile
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

    const setCurrentTime =
        useEditorStore(
            state => state.setCurrentTime
        );

    const setDuration =
        useEditorStore(
            state => state.setDuration
        );

    const play =
        useEditorStore(
            state => state.play
        );

    const pause =
        useEditorStore(
            state => state.pause
        );

    const playbackRate =
        useEditorStore(
            state => state.playbackRate
        );

    const volume =
        useEditorStore(
            state => state.volume
        );


    // =========================================================
    // VIDEO REF
    // =========================================================

    const videoRef =
        useRef<HTMLVideoElement | null>(
            null
        );


    // =========================================================
    // VIDEO NAME
    // =========================================================

    const videoName =
        videoFile
            ? videoFile
                .split(/[\\/]/)
                .pop()
            : null;


    // =========================================================
    // VIDEO URL
    // =========================================================

    const videoSrc =
        videoName
            ? `http://127.0.0.1:38555/import_videos/${encodeURIComponent(
                videoName
            )}`
            : null;


    // =========================================================
    // LOAD VIDEO
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        if (!videoSrc) {

            video.pause();

            video.removeAttribute(
                "src"
            );

            video.load();

            setCurrentTime(0);

            setDuration(0);

            pause();

            return;
        }


        console.log(
            "Loading preview video:",
            videoSrc
        );


        video.src =
            videoSrc;

        video.load();

    }, [
        videoSrc,
        setCurrentTime,
        setDuration,
        pause
    ]);


    // =========================================================
    // PLAY / PAUSE
    //
    // VIDEO LÀ MASTER
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video || !videoSrc) {
            return;
        }


        if (playing) {

            video
                .play()
                .catch(error => {

                    console.error(
                        "Preview video play error:",
                        error
                    );

                    pause();

                });

        }
        else {

            video.pause();

        }

    }, [
        playing,
        videoSrc,
        pause
    ]);


    // =========================================================
    // PLAYBACK RATE
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }

        video.playbackRate =
            playbackRate;

    }, [
        playbackRate
    ]);


    // =========================================================
    // VOLUME
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }

        video.volume =
            volume;

    }, [
        volume
    ]);


    // =========================================================
    // VIDEO → CURRENT TIME
    //
    // Dùng requestAnimationFrame
    // để time chạy mượt như AudioPlayer cũ.
    //
    // VIDEO LÀ MASTER CLOCK.
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video || !videoSrc) {
            return;
        }


        let animationFrame = 0;


        const updateTime = () => {

            if (!video.paused) {

                setCurrentTime(
                    video.currentTime
                );

            }


            animationFrame =
                requestAnimationFrame(
                    updateTime
                );

        };


        animationFrame =
            requestAnimationFrame(
                updateTime
            );


        return () => {

            cancelAnimationFrame(
                animationFrame
            );

        };

    }, [
        videoSrc,
        setCurrentTime
    ]);


    // =========================================================
    // VIDEO METADATA
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video || !videoSrc) {
            return;
        }


        const handleLoadedMetadata =
            () => {

                console.log(
                    "Preview video loaded"
                );

                console.log(
                    "Video duration:",
                    video.duration
                );


                setDuration(
                    video.duration
                );

                video.currentTime =
                    0;

                setCurrentTime(
                    0
                );

            };


        video.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );


        return () => {

            video.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );

        };

    }, [
        videoSrc,
        setDuration,
        setCurrentTime
    ]);


    // =========================================================
    // VIDEO ENDED
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video || !videoSrc) {
            return;
        }


        const handleEnded =
            () => {

                setCurrentTime(
                    video.duration || 0
                );

                pause();

            };


        video.addEventListener(
            "ended",
            handleEnded
        );


        return () => {

            video.removeEventListener(
                "ended",
                handleEnded
            );

        };

    }, [
        videoSrc,
        setCurrentTime,
        pause
    ]);


    // =========================================================
    // STORE CURRENT TIME → VIDEO
    //
    // Dùng cho:
    // -5s
    // +5s
    // kéo timeline
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video || !videoSrc) {
            return;
        }


        if (
            !Number.isFinite(
                currentTime
            )
        ) {
            return;
        }


        const difference =
            Math.abs(
                video.currentTime -
                currentTime
            );


        // Khi người dùng seek,
        // currentTime thay đổi đáng kể.
        //
        // Không seek liên tục trong lúc video
        // đang chạy vì video đã là MASTER.

        if (
            difference > 0.15
        ) {

            try {

                video.currentTime =
                    currentTime;

            }
            catch {

                // Video chưa ready

            }

        }

    }, [
        currentTime,
        videoSrc
    ]);


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="preview">

            <div className="youtube-frame">

                <div className="video-area">


                    {/* =================================================
                        VIDEO

                        Video chứa luôn audio.
                        Video là MASTER.
                    ================================================= */}

                    {videoSrc && (

                        <video
                            ref={videoRef}

                            className="preview-video"

                            playsInline

                            preload="auto"
                        />

                    )}


                    {/* =================================================
                        KARAOKE LYRICS
                    ================================================= */}

                    <div className="karaoke-overlay">

                        <KaraokeCanvas />

                    </div>


                    {/* =================================================
                        NO VIDEO
                    ================================================= */}

                    {!videoSrc && (

                        <div className="preview-empty">

                            🎬

                            <div>
                                Import Video Background
                            </div>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}
