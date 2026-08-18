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
                .split(/[/\\]/)
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


        // Không có video
        if (!videoSrc) {

            video.pause();

            video.removeAttribute(
                "src"
            );

            video.load();

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
        videoSrc
    ]);


    // =========================================================
    // PLAY / PAUSE
    //
    // AudioPlayer là MASTER
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        if (!videoSrc) {
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

                });

        }
        else {

            video.pause();

        }

    }, [
        playing,
        videoSrc
    ]);


    // =========================================================
    // SYNC VIDEO TIME
    //
    // AudioPlayer cập nhật currentTime
    // Video chạy theo currentTime
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        if (!videoSrc) {
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


        // Chỉ seek khi lệch đáng kể
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
    // VIDEO EVENTS
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
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

            };


        const handleError =
            () => {

                console.error(
                    "Preview video error:",
                    video.error
                );

            };


        video.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );

        video.addEventListener(
            "error",
            handleError
        );


        return () => {

            video.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );

            video.removeEventListener(
                "error",
                handleError
            );

        };

    }, [
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
                        VIDEO BACKGROUND
                    ================================================= */}

                    {videoSrc && (

                        <video
                            ref={videoRef}

                            className="preview-video"

                            playsInline

                            preload="auto"

                            /*
                             * KHÔNG autoPlay
                             *
                             * KHÔNG muted
                             *
                             * Nhưng AudioPlayer vẫn là nguồn âm thanh
                             * chính của project.
                             */

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