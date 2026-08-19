"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useLyricsStore,
} from "@/stores/lyrics.store";

import {
    useEditorStore,
} from "@/stores/editor.store";

import {
    useProjectStore,
} from "@/stores/project.store";


interface ExportResult {

    canceled?: boolean;

    outputPath?: string;

}


interface ExportProgress {

    progress?: number;

    stage?:
        | "frames"
        | "ffmpeg"
        | "done";

    current?: number;

    total?: number;

    message?: string;

}


export default function ExportPage() {

    // =========================================================
    // LYRICS
    // =========================================================

    const lyrics =
        useLyricsStore(
            state =>
                state.lyrics
        );


    // =========================================================
    // PROJECT
    // =========================================================

    const project =
        useProjectStore(
            state =>
                state.project
        );


    // =========================================================
    // AUDIO
    // =========================================================

    const audioRef =
        useEditorStore(
            state =>
                state.audioRef
        );

const setWorkspace =
    useEditorStore(
        state =>
            state.setWorkspace
    );
    // =========================================================
    // STATE
    // =========================================================

    const [exporting, setExporting] =
        useState(false);


    const [progress, setProgress] =
        useState(0);


    const [message, setMessage] =
        useState("");


    const [outputPath, setOutputPath] =
        useState("");


    // =========================================================
    // DURATION
    // =========================================================

    const duration =
        audioRef?.duration ?? 0;


    // =========================================================
    // FILES
    // =========================================================

    const videoFile =
        project?.videoFile;


    const audioFile =
        project?.audioFile;


    // =========================================================
    // WORD COUNT
    // =========================================================

    const wordCount =
        useMemo(

            () => {

                return lyrics.reduce(

                    (
                        total,
                        line
                    ) => {

                        return (
                            total +
                            line.words.length
                        );

                    },

                    0

                );

            },

            [lyrics]

        );


    // =========================================================
    // CAN EXPORT
    // =========================================================

    const canExport =
        lyrics.length > 0 &&

        duration > 0 &&

        !!videoFile &&

        !!audioFile &&

        !exporting;


    // =========================================================
    // PROGRESS LISTENER
    // =========================================================

    useEffect(() => {

        const removeListener =
            window.electronAPI.on<ExportProgress>(

                "export:progress",

                data => {

                    if (
                        typeof data?.progress ===
                        "number"
                    ) {

                        setProgress(

                            Math.max(

                                0,

                                Math.min(

                                    100,

                                    Math.round(
                                        data.progress
                                    )

                                )

                            )

                        );

                    }


                    if (
                        data?.stage ===
                        "frames"
                    ) {

                        if (

                            typeof data.current ===
                            "number" &&

                            typeof data.total ===
                            "number"

                        ) {

                            setMessage(

                                `Đang tạo lyric frame ${data.current}/${data.total}...`

                            );

                        }

                        else {

                            setMessage(
                                "Đang tạo lyric frames..."
                            );

                        }

                    }


                    if (
                        data?.stage ===
                        "ffmpeg"
                    ) {

                        setMessage(
                            "Đang ghép video + audio + lyrics..."
                        );

                    }


                    if (
                        data?.stage ===
                        "done"
                    ) {

                        setProgress(100);

                        setMessage(
                            "Export hoàn tất."
                        );

                    }


                    if (
                        data?.message
                    ) {

                        setMessage(
                            data.message
                        );

                    }

                }

            );


        return () => {

            removeListener?.();

        };

    }, []);


    // =========================================================
    // EXPORT
    // =========================================================

    async function handleExport() {

        if (!canExport) {

            return;

        }


        setExporting(true);

        setProgress(0);

        setMessage(
            "Đang chuẩn bị export..."
        );

        setOutputPath("");


        try {

            console.log(
                "EXPORT PROJECT:",
                {

                    videoFile,

                    audioFile,

                    duration,

                    lyrics:
                        lyrics.length,

                }

            );


            const result =
                await window.electronAPI.invoke<ExportResult>(

                    "export:video",

                    {

                        // ================================
                        // VIDEO BACKGROUND
                        // ================================

                        videoFile:


                            videoFile!,


                        // ================================
                        // AUDIO / VOCAL
                        // ================================

                        audioFile:


                            audioFile!,


                        // ================================
                        // LYRICS
                        // ================================

                        lyrics,


                        // ================================
                        // DURATION
                        // ================================

                        duration,


                        // ================================
                        // CANVAS
                        // ================================

                        width:
                            1920,

                        height:
                            1080,

                        fps:
                            30,

                    }

                );


            // =================================================
            // CANCEL
            // =================================================

            if (
                result?.canceled
            ) {

                setProgress(0);

                setMessage(
                    "Đã hủy export."
                );

                return;

            }


            // =================================================
            // SUCCESS
            // =================================================

            if (
                result?.outputPath
            ) {

                setOutputPath(
                    result.outputPath
                );

                setProgress(100);

                setMessage(
                    "Export hoàn tất."
                );

                return;

            }


            throw new Error(
                "Export không trả về outputPath."
            );

        }


        catch (error) {

            console.error(
                "EXPORT ERROR:",
                error
            );


            setProgress(0);


            setMessage(

                error instanceof Error

                    ? error.message

                    : "Export thất bại."

            );

        }


        finally {

            setExporting(false);

        }

    }


    // =========================================================
    // UI
    // =========================================================

    return (

        <div
            style={{

                padding:
                    24,

                maxWidth:
                    700,

                margin:
                    "0 auto",

            }}
        >

            <h2>
                Export Karaoke Video
            </h2>


            <p>
                Xuất video karaoke hoàn chỉnh
                với video nền, audio và lyrics.
            </p>


            {/* =================================================
                PROJECT INFO
            ================================================= */}

            <div
                style={{

                    marginTop:
                        20,

                    padding:
                        20,

                    border:
                        "1px solid #333",

                    borderRadius:
                        10,

                }}
            >

                {/* VIDEO */}

                <div>

                    <strong>
                        Video Background
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            wordBreak:
                                "break-all",
                        }}
                    >

                        {videoFile
                            ? videoFile
                            : "❌ Chưa chọn video"}

                    </div>

                </div>


                {/* AUDIO */}

                <div
                    style={{
                        marginTop: 16,
                    }}
                >

                    <strong>
                        Audio / Vocal
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            wordBreak:
                                "break-all",
                        }}
                    >

                        {audioFile
                            ? audioFile
                            : "❌ Chưa chọn audio"}

                    </div>

                </div>


                {/* FORMAT */}

                <div
                    style={{
                        marginTop: 16,
                    }}
                >

                    <strong>
                        Format
                    </strong>

                    <div>
                        MP4 / H.264 + AAC
                    </div>

                </div>


                {/* RESOLUTION */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >

                    <strong>
                        Resolution
                    </strong>

                    <div>
                        1920 × 1080
                    </div>

                </div>


                {/* FPS */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >

                    <strong>
                        FPS
                    </strong>

                    <div>
                        30 FPS
                    </div>

                </div>


                {/* LYRICS */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >

                    <strong>
                        Lyrics
                    </strong>

                    <div>

                        {lyrics.length}
                        {" lines · "}
                        {wordCount}
                        {" words"}

                    </div>

                </div>


                {/* DURATION */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >

                    <strong>
                        Duration
                    </strong>

                    <div>

                        {duration > 0

                            ? `${duration.toFixed(2)} seconds`

                            : "Chưa có audio"}

                    </div>

                </div>

            </div>


            {/* =================================================
                WARNING
            ================================================= */}

            {!videoFile && (

                <div
                    style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 8,
                    }}
                >

                    ⚠️ Bạn chưa import
                    video nền.

                </div>

            )}


            {!audioFile && (

                <div
                    style={{
                        marginTop: 8,
                        padding: 12,
                        borderRadius: 8,
                    }}
                >

                    ⚠️ Bạn chưa import
                    audio / vocal.

                </div>

            )}

{/* =================================================
    ACTION BUTTONS
================================================= */}

<div
    style={{
        display: "flex",
        gap: 10,
        marginTop: 20,
    }}
>

    {/* PREVIOUS */}

    <button
        type="button"
        onClick={() =>
            setWorkspace(
                "style"
            )
        }
        style={{
            flex: 1,
            padding: "14px 20px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 700,
        }}
    >
        ← Previous
    </button>


    {/* EXPORT */}

    <button
        type="button"
        onClick={
            handleExport
        }
        disabled={
            !canExport
        }
        style={{
            flex: 2,
            padding: "14px 20px",
            borderRadius: 8,
            border: "none",
            cursor:
                canExport
                    ? "pointer"
                    : "not-allowed",
            opacity:
                canExport
                    ? 1
                    : 0.5,
            fontWeight: 700,
        }}
    >
        {exporting
            ? "Exporting..."
            : "Export Karaoke Video"}
    </button>

</div>

            {/* =================================================
                PROGRESS
            ================================================= */}

            {exporting && (

                <div
                    style={{
                        marginTop: 20,
                    }}
                >

                    <div
                        style={{

                            display:
                                "flex",

                            justifyContent:
                                "space-between",

                            marginBottom:
                                8,

                        }}
                    >

                        <span>
                            {message}
                        </span>

                        <span>
                            {progress}%
                        </span>

                    </div>


                    <div
                        style={{

                            width:
                                "100%",

                            height:
                                8,

                            background:
                                "#222",

                            borderRadius:
                                999,

                            overflow:
                                "hidden",

                        }}
                    >

                        <div
                            style={{

                                width:
                                    `${progress}%`,

                                height:
                                    "100%",

                                background:
                                    "#00ff66",

                                transition:
                                    "width 0.15s",

                            }}
                        />

                    </div>

                </div>

            )}


            {/* =================================================
                MESSAGE
            ================================================= */}

            {!exporting &&
                message && (

                    <div
                        style={{

                            marginTop:
                                20,

                            padding:
                                12,

                            borderRadius:
                                8,

                            background:
                                "#181818",

                        }}
                    >

                        {message}

                    </div>

                )}


            {/* =================================================
                OUTPUT
            ================================================= */}

            {outputPath && (

                <div
                    style={{

                        marginTop:
                            12,

                        padding:
                            12,

                        fontSize:
                            13,

                        wordBreak:
                            "break-all",

                        border:
                            "1px solid #333",

                        borderRadius:
                            8,

                    }}
                >

                    <strong>
                        File:
                    </strong>

                    <br />

                    {outputPath}

                </div>

            )}

        </div>

    );

}