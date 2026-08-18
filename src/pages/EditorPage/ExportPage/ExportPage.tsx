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

interface ExportResult {
    canceled?: boolean;
    outputPath?: string;
}

interface ExportProgress {
    progress?: number;
    stage?: "frames" | "ffmpeg" | "done";
    current?: number;
    total?: number;
    message?: string;
}

export default function ExportPage() {

    const lyrics = useLyricsStore(
        state => state.lyrics
    );

    const audioRef = useEditorStore(
        state => state.audioRef
    );

    const [exporting, setExporting] =
        useState(false);

    const [progress, setProgress] =
        useState(0);

    const [message, setMessage] =
        useState("");

    const [outputPath, setOutputPath] =
        useState("");

    /*
     * =========================
     * AUDIO DURATION
     * =========================
     */

    const duration =
        audioRef?.duration ?? 0;

    /*
     * =========================
     * CAN EXPORT
     * =========================
     */

    const canExport =
        lyrics.length > 0 &&
        duration > 0 &&
        !exporting;

    /*
     * =========================
     * WORD COUNT
     * =========================
     */

    const wordCount = useMemo(
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

    /*
     * =========================
     * EXPORT PROGRESS
     * =========================
     */

    useEffect(() => {

        const removeListener =
            window.electronAPI.on<ExportProgress>(
                "export:progress",
                (data) => {

                    /*
                     * Progress %
                     */

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

                    /*
                     * Frame rendering
                     */

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
                                `Đang tạo frame ${data.current}/${data.total}...`
                            );

                        }
                        else {

                            setMessage(
                                "Đang tạo frame..."
                            );

                        }
                    }

                    /*
                     * FFmpeg
                     */

                    if (
                        data?.stage ===
                        "ffmpeg"
                    ) {

                        setMessage(
                            "FFmpeg đang tạo video..."
                        );
                    }

                    /*
                     * Done
                     */

                    if (
                        data?.stage ===
                        "done"
                    ) {

                        setProgress(100);

                        setMessage(
                            "Export hoàn tất."
                        );
                    }

                    /*
                     * Custom message
                     */

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

    /*
     * =========================
     * EXPORT
     * =========================
     */

    async function handleExport() {

        if (!canExport) {
            return;
        }

        /*
         * Reset UI
         */

        setExporting(true);

        setProgress(0);

        setMessage(
            "Đang chuẩn bị export..."
        );

        setOutputPath("");

        try {

            /*
             * =========================
             * IPC EXPORT
             * =========================
             */

            const result =
                await window.electronAPI.invoke<ExportResult>(
                    "export:video",
                    {
                        lyrics,

                        duration,

                        width: 1920,

                        height: 1080,

                        fps: 30,
                    }
                );

            /*
             * =========================
             * CANCEL
             * =========================
             */

            if (
                result?.canceled
            ) {

                setProgress(0);

                setMessage(
                    "Đã hủy export."
                );

                return;
            }

            /*
             * =========================
             * SUCCESS
             * =========================
             */

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

            /*
             * Không có output
             */

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

    /*
     * =========================
     * UI
     * =========================
     */

    return (

        <div
            style={{
                padding: 24,
                maxWidth: 700,
                margin: "0 auto",
            }}
        >

            <h2>
                Export
            </h2>

            <p>
                Xuất lyric karaoke
                với nền trong suốt.
            </p>

            {/* =========================
                EXPORT INFO
            ========================= */}

            <div
                style={{
                    marginTop: 20,
                    padding: 20,
                    border: "1px solid #333",
                    borderRadius: 10,
                }}
            >

                <div>

                    <strong>
                        Format
                    </strong>

                    <div>
                        WebM / VP9 Alpha
                    </div>

                </div>


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


            {/* =========================
                EXPORT BUTTON
            ========================= */}

            <button
                type="button"
                onClick={
                    handleExport
                }
                disabled={!canExport}
                style={{
                    marginTop: 20,

                    width: "100%",

                    padding:
                        "14px 20px",

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
                    : "Export Transparent Video"}

            </button>


            {/* =========================
                PROGRESS
            ========================= */}

            {exporting && (

                <div
                    style={{
                        marginTop: 20,
                    }}
                >

                    <div
                        style={{
                            display: "flex",

                            justifyContent:
                                "space-between",

                            marginBottom: 8,
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
                            width: "100%",

                            height: 8,

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


            {/* =========================
                MESSAGE
            ========================= */}

            {!exporting &&
                message && (

                    <div
                        style={{
                            marginTop: 20,

                            padding: 12,

                            borderRadius: 8,

                            background:
                                "#181818",
                        }}
                    >

                        {message}

                    </div>

                )}


            {/* =========================
                OUTPUT FILE
            ========================= */}

            {outputPath && (

                <div
                    style={{
                        marginTop: 12,

                        padding: 12,

                        fontSize: 13,

                        wordBreak:
                            "break-all",

                        border:
                            "1px solid #333",

                        borderRadius: 8,
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
