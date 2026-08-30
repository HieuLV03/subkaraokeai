
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
    // PROJECT FILES
    // =========================================================

    const videoFile =
        useProjectStore(
            state => state.project?.videoFile
        );

    const imageFile =
        useProjectStore(
            state => state.project?.imageFile
        );
const isImageMode =
    Boolean(imageFile);

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
    //
    // Video chỉ dùng làm AUDIO + MASTER CLOCK
    // Không dùng hình ảnh video làm background.
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
    // IMAGE NAME
    // =========================================================

    const imageName =
        imageFile
            ? imageFile
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
    // IMAGE URL
    // =========================================================

    const imageSrc =
        imageName
            ? `http://127.0.0.1:38555/import_images/${encodeURIComponent(
                imageName
            )}`
            : null;


    // =========================================================
    // DEBUG
    // =========================================================

    useEffect(() => {

        console.log(
            "[Preview] Timing Video:",
            videoFile
        );

        console.log(
            "[Preview] Background Image:",
            imageFile
        );

        console.log(
            "[Preview] Video URL:",
            videoSrc
        );

        console.log(
            "[Preview] Image URL:",
            imageSrc
        );

    }, [
        videoFile,
        imageFile,
        videoSrc,
        imageSrc
    ]);


    // =========================================================
    // LOAD VIDEO
    //
    // Video vẫn được load để:
    //
    // - phát audio
    // - lấy duration
    // - làm master clock
    //
    // Nhưng KHÔNG hiển thị hình ảnh.
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
            "[Preview] Loading timing video:",
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
    // VIDEO = MASTER
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (
            !video ||
            !videoSrc
        ) {
            return;
        }


        if (playing) {

            video
                .play()
                .catch(error => {

                    console.error(
                        "[Preview] Video play error:",
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
    // VIDEO LÀ MASTER CLOCK
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (
            !video ||
            !videoSrc
        ) {
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

        if (
            !video ||
            !videoSrc
        ) {
            return;
        }


        const handleLoadedMetadata =
            () => {

                console.log(
                    "[Preview] Timing video loaded"
                );

                console.log(
                    "[Preview] Duration:",
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

        if (
            !video ||
            !videoSrc
        ) {
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
    //
    // - timeline
    // - -5s
    // - +5s
    // - seek
    // =========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (
            !video ||
            !videoSrc
        ) {
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
                    IMAGE MODE

                    Có imageFile:
                    - Image = background
                    - Video = audio + timing
                ================================================= */}

                {isImageMode && imageSrc && (

                    <img
                        src={imageSrc}
                        className="preview-background"
                        alt="Karaoke background"
                        draggable={false}
                    />

                )}


                {/* =================================================
                    VIDEO

                    VIDEO MODE:
                    → Hiển thị video

                    IMAGE MODE:
                    → Ẩn video, chỉ dùng audio + timing
                ================================================= */}

                {videoSrc && (

                    <video
                        ref={videoRef}

                        className={
                            isImageMode
                                ? "preview-timing-video"
                                : "preview-video"
                        }

                        playsInline
                        preload="auto"
                    />

                )}


                {/* =================================================
                    KARAOKE
                ================================================= */}

                <div className="karaoke-overlay">

                    <KaraokeCanvas />

                </div>


                {/* =================================================
                    EMPTY
                ================================================= */}

                {!videoSrc && !imageSrc && (

                    <div className="preview-empty">

                        🎬

                        <div>
                            Import Video or Background Image
                        </div>

                    </div>

                )}

            </div>

        </div>

    </div>

);


}
