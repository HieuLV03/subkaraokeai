import {
    app,
    dialog,
    ipcMain,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import sharp from "sharp";


// ============================================================
// TYPES
// ============================================================

type LyricWord = {

    id: string;

    word: string;

    start: number;

    end: number;

    synced?: boolean;

};


type LyricStyle = {

    fontFamily: string;

    fontSize: number;

    color: string;

    activeColor: string;

    outline: string;

    outlineWidth: number;

    shadow: boolean;

    x: number;

    y: number;

    scale?: number;

    align:
        | "left"
        | "center"
        | "right";

};


type LyricLine = {

    id: string;

    start: number;

    end: number;

    text: string;

    words: LyricWord[];

    style?: LyricStyle;

};


type ExportData = {

    lyrics: LyricLine[];

    duration: number;

    videoFile: string;

    audioFile: string;

    width?: number;

    height?: number;

    fps?: number;

};


// ============================================================
// CONSTANTS
// ============================================================

const CANVAS_WIDTH = 1920;

const CANVAS_HEIGHT = 1080;

const PREVIEW_SCALE = 3;

const PREVIEW_WORD_GAP = 8;

const EXPORT_WORD_GAP =
    PREVIEW_WORD_GAP *
    PREVIEW_SCALE;


// ============================================================
// HELPERS
// ============================================================

function escapeXml(
    value: string
) {

    return value

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&apos;"
        );

}


function clamp(
    value: number,
    min: number,
    max: number
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


// ============================================================
// DEFAULT STYLE
// ============================================================

function getDefaultStyle(): LyricStyle {

    return {

        fontFamily:
            "Arial",

        fontSize:
            120,

        color:
            "#ffffff",

        activeColor:
            "#00ff66",

        outline:
            "#000000",

        outlineWidth:
            6,

        shadow:
            true,

        x:
            960,

        y:
            540,

        scale:
            1,

        align:
            "center",

    };

}


// ============================================================
// WORD PERCENT
// ============================================================

function getWordPercent(

    word: LyricWord,

    currentTime: number

) {

    if (

        word.start == null ||

        word.end == null ||

        word.end <= word.start

    ) {

        return 0;

    }


    if (
        currentTime < word.start
    ) {

        return 0;

    }


    if (
        currentTime >= word.end
    ) {

        return 100;

    }


    return clamp(

        (
            currentTime -
            word.start
        )
        /
        (
            word.end -
            word.start
        )
        *
        100,

        0,

        100

    );

}


// ============================================================
// TEXT WIDTH
// ============================================================

function getCharWidthRatio(
    char: string
) {

    if (
        char === " " ||
        char === "\u00A0"
    ) {

        return 0.28;

    }


    if (
        "ilIjtfr".includes(char)
    ) {

        return 0.30;

    }


    if (
        "mwMW".includes(char)
    ) {

        return 0.85;

    }


    if (
        "ABCDEFGHKNOPQRSTUVXYZ".includes(char)
    ) {

        return 0.68;

    }


    if (
        "0123456789".includes(char)
    ) {

        return 0.56;

    }


    return 0.55;

}


function getWordWidth(
    word: string,
    fontSize: number
) {

    const text =
        `${word}\u00A0`;

    let width = 0;


    for (
        const char of text
    ) {

        width +=
            getCharWidthRatio(
                char
            ) *
            fontSize;

    }


    return Math.max(
        width,
        fontSize * 0.3
    );

}


function getLineWidth(
    words: LyricWord[],
    fontSize: number
) {

    let width = 0;


    for (
        let i = 0;
        i < words.length;
        i++
    ) {

        width +=
            getWordWidth(
                words[i].word ?? "",
                fontSize
            );


        if (
            i <
            words.length - 1
        ) {

            width +=
                EXPORT_WORD_GAP;

        }

    }


    return Math.max(
        width,
        fontSize
    );

}


// ============================================================
// BUILD WORD SVG
// ============================================================

function buildWordSvg(

    word: LyricWord,

    style: LyricStyle,

    currentTime: number,

    x: number,

    fontSize: number

) {

    const text =
        word.word ?? "";


    const safeText =
        escapeXml(text);


    const percent =
        getWordPercent(
            word,
            currentTime
        );


    const normalColor =
        style.color ??
        "#ffffff";


    const activeColor =
        style.activeColor ??
        "#00ff66";


    const outline =
        style.outline ??
        "#000000";


    const outlineWidth =
        (style.outlineWidth ?? 0) *
        PREVIEW_SCALE;


    const shadow =
        style.shadow ??
        false;


    const wordWidth =
        getWordWidth(
            text,
            fontSize
        );


    const stroke =
        outlineWidth > 0

            ? `
                stroke="${escapeXml(
                    outline
                )}"
                stroke-width="${outlineWidth}"
                paint-order="stroke fill"
            `

            : "";


    const filter =
        shadow

            ? `filter="url(#shadow)"`

            : "";


    const normal = `
<text
    x="${x}"
    y="0"
    dominant-baseline="middle"
    font-family="${escapeXml(
        style.fontFamily ?? "Arial"
    )}"
    font-size="${fontSize}px"
    font-weight="700"
    fill="${escapeXml(normalColor)}"
    ${stroke}
    ${filter}
>${safeText}&#160;</text>
`;


    const fillWidth =
        wordWidth *
        (
            percent /
            100
        );


    const clipId =
        `clip-${word.id.replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        )}`;


    const active = `
<clipPath id="${clipId}">
    <rect
        x="${x}"
        y="${-fontSize}"
        width="${fillWidth}"
        height="${fontSize * 2}"
    />
</clipPath>

<text
    x="${x}"
    y="0"
    dominant-baseline="middle"
    font-family="${escapeXml(
        style.fontFamily ?? "Arial"
    )}"
    font-size="${fontSize}px"
    font-weight="700"
    fill="${escapeXml(activeColor)}"
    ${stroke}
    ${filter}
    clip-path="url(#${clipId})"
>${safeText}&#160;</text>
`;


    return {

        svg:
            normal +
            active,

        width:
            wordWidth +
            EXPORT_WORD_GAP,

    };

}


// ============================================================
// BUILD SVG FRAME
// ============================================================

function buildSvgFrame(

    lyrics: LyricLine[],

    currentTime: number,

    width: number,

    height: number

) {

    const activeLines =
        lyrics.filter(

            line =>

                currentTime >= line.start &&

                currentTime <= line.end

        );


    let content = "";


    for (
        const line of activeLines
    ) {

        const style: LyricStyle = {

            ...getDefaultStyle(),

            ...(line.style ?? {}),

        };


        const words =
            line.words ?? [];


        if (
            !words.length
        ) {

            continue;

        }


        const fontSize =
            (style.fontSize ?? 40) *
            PREVIEW_SCALE;


        const scale =
            style.scale ??
            1;


        const align =
            style.align ??
            "center";


        const x =
            (style.x ?? 330) *
            PREVIEW_SCALE;


        const y =
            (style.y ?? 180) *
            PREVIEW_SCALE;


        const lineWidth =
            getLineWidth(
                words,
                fontSize
            );


        let startX = 0;


        if (
            align === "center"
        ) {

            startX =
                -lineWidth / 2;

        }

        else if (
            align === "right"
        ) {

            startX =
                -lineWidth;

        }


        let wordsSvg = "";


        let offsetX =
            startX;


        for (
            const word of words
        ) {

            const result =
                buildWordSvg(

                    word,

                    style,

                    currentTime,

                    offsetX,

                    fontSize

                );


            wordsSvg +=
                result.svg;


            offsetX +=
                result.width;

        }


        content += `
<g
    transform="translate(${x} ${y}) scale(${scale})"
>
    ${wordsSvg}
</g>
`;

    }


    return `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
>
    <defs>

        <filter
            id="shadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
        >

            <feDropShadow
                dx="3"
                dy="3"
                stdDeviation="3"
                flood-color="#000000"
                flood-opacity="0.8"
            />

        </filter>

    </defs>

    ${content}

</svg>
`;

}


// ============================================================
// FFMPEG PATH
// ============================================================

function findFfmpeg() {

    const root =
        process.env.APP_ROOT!;


    const ffmpeg =
        path.join(

            root,

            "tools",

            "ffmpeg",

            "bin",

            "ffmpeg.exe"

        );


    console.log(
        "FFmpeg:",
        ffmpeg
    );


    return ffmpeg;

}


// ============================================================
// RUN FFMPEG
// ============================================================

function runFfmpeg(

    args: string[],

    onProgress?: (
        value: number
    ) => void

) {

    return new Promise<void>(

        (
            resolve,
            reject
        ) => {

            const ffmpeg =
                spawn(

                    findFfmpeg(),

                    args,

                    {

                        windowsHide:
                            true,

                    }

                );


            let stderr =
                "";


            ffmpeg.stderr.on(

                "data",

                chunk => {

                    const text =
                        chunk.toString();


                    stderr +=
                        text;


                    const match =
                        text.match(
                            /time=(\d+):(\d+):([\d.]+)/
                        );


                    if (
                        match &&
                        onProgress
                    ) {

                        const hours =
                            Number(
                                match[1]
                            );


                        const minutes =
                            Number(
                                match[2]
                            );


                        const seconds =
                            Number(
                                match[3]
                            );


                        const time =
                            hours * 3600 +
                            minutes * 60 +
                            seconds;


                        onProgress(
                            time
                        );

                    }

                }

            );


            ffmpeg.on(

                "error",

                error => {

                    reject(
                        error
                    );

                }

            );


            ffmpeg.on(

                "close",

                code => {

                    if (
                        code === 0
                    ) {

                        resolve();

                        return;

                    }


                    reject(

                        new Error(

                            `FFmpeg failed (${code})\n${stderr}`

                        )

                    );

                }

            );

        }

    );

}


// ============================================================
// REGISTER IPC
// ============================================================

export function registerExportIPC() {

    ipcMain.handle(

        "export:video",

        async (

            event,

            data: ExportData

        ) => {

            const width =
                data.width ??
                CANVAS_WIDTH;


            const height =
                data.height ??
                CANVAS_HEIGHT;


            const fps =
                data.fps ??
                30;


            const duration =
                Math.max(
                    0,
                    data.duration ?? 0
                );


            // =================================================
            // VALIDATE
            // =================================================

            if (
                !data.videoFile
            ) {

                throw new Error(
                    "Chưa có video nền."
                );

            }


            if (
                !data.audioFile
            ) {

                throw new Error(
                    "Chưa có audio."
                );

            }


            if (
                !data.lyrics?.length
            ) {

                throw new Error(
                    "Không có lyrics để export."
                );

            }


            if (
                duration <= 0
            ) {

                throw new Error(
                    "Duration không hợp lệ."
                );

            }


            try {

                await fs.access(
                    data.videoFile
                );

            }

            catch {

                throw new Error(
                    `Không tìm thấy video:\n${data.videoFile}`
                );

            }


            try {

                await fs.access(
                    data.audioFile
                );

            }

            catch {

                throw new Error(
                    `Không tìm thấy audio:\n${data.audioFile}`
                );

            }


            // =================================================
            // SAVE DIALOG
            // =================================================

            const result =
                await dialog.showSaveDialog({

                    title:
                        "Export Karaoke Video",

                    defaultPath:
                        path.join(

                            app.getPath(
                                "videos"
                            ),

                            "karaoke-video.mp4"

                        ),

                    filters: [

                        {

                            name:
                                "MP4 Video",

                            extensions:
                                ["mp4"],

                        },

                    ],

                });


            if (

                result.canceled ||

                !result.filePath

            ) {

                return {

                    canceled:
                        true,

                };

            }


            const outputPath =
                result.filePath.endsWith(
                    ".mp4"
                )

                    ? result.filePath

                    : `${result.filePath}.mp4`;


            // =================================================
            // TEMP DIRECTORY
            // =================================================

            const exportRoot =
                path.join(

                    app.getPath(
                        "temp"
                    ),

                    "subkaraokeai-export"

                );


            const frameDir =
                path.join(

                    exportRoot,

                    `job-${Date.now()}`

                );


            await fs.mkdir(

                frameDir,

                {
                    recursive:
                        true,
                }

            );


            try {

                // =============================================
                // 1. GENERATE TRANSPARENT LYRIC FRAMES
                // =============================================

                const totalFrames =
                    Math.ceil(
                        duration * fps
                    );


                console.log(
                    "Generating frames:",
                    totalFrames
                );


                for (

                    let frame = 0;

                    frame < totalFrames;

                    frame++

                ) {

                    const currentTime =
                        frame / fps;


                    const svg =
                        buildSvgFrame(

                            data.lyrics,

                            currentTime,

                            width,

                            height

                        );


                    const framePath =
                        path.join(

                            frameDir,

                            `frame-${String(
                                frame
                            ).padStart(
                                7,
                                "0"
                            )}.png`

                        );


                    await sharp(
                        Buffer.from(svg)
                    )
                        .png()
                        .toFile(
                            framePath
                        );


                    event.sender.send(

                        "export:progress",

                        {

                            stage:
                                "frames",

                            progress:

                                (
                                    (frame + 1) /
                                    totalFrames
                                ) * 50,

                            current:
                                frame + 1,

                            total:
                                totalFrames,

                        }

                    );

                }


                // =============================================
                // 2. FFMPEG
                //
                // INPUT 0 = VIDEO BACKGROUND
                // INPUT 1 = AUDIO
                // INPUT 2 = TRANSPARENT LYRIC FRAMES
                // =============================================

                const inputPattern =
                    path.join(

                        frameDir,

                        "frame-%07d.png"

                    );


                console.log(
                    "Export video:",
                    data.videoFile
                );


                console.log(
                    "Export audio:",
                    data.audioFile
                );


                console.log(
                    "Export output:",
                    outputPath
                );


                /*
                 * Video:
                 *
                 * -stream_loop -1
                 *
                 * => video tự lặp nếu
                 *    ngắn hơn audio.
                 *
                 *
                 * Audio:
                 *
                 * => audio riêng của project.
                 *
                 *
                 * Lyrics:
                 *
                 * => transparent PNG sequence.
                 */


            await runFfmpeg(

    [

        "-y",


        // =====================================
        // VIDEO BACKGROUND
        // =====================================

        "-stream_loop",
        "-1",

        "-i",
        data.videoFile,


        // =====================================
        // LYRIC FRAMES
        // =====================================

        "-framerate",
        String(fps),

        "-i",
        inputPattern,


        // =====================================
        // FILTER
        // =====================================

        "-filter_complex",

        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[bg];` +

        `[1:v]format=rgba[lyrics];` +

        `[bg][lyrics]overlay=0:0:format=auto[outv]`,


        // =====================================
        // VIDEO
        // =====================================

        "-map",
        "[outv]",


        // =====================================
        // KHÔNG AUDIO
        // =====================================

        "-an",


        // =====================================
        // VIDEO CODEC
        // =====================================

        "-c:v",
        "libx264",

        "-preset",
        "medium",

        "-crf",
        "18",

        "-pix_fmt",
        "yuv420p",


        // =====================================
        // DURATION
        // =====================================

        "-t",
        String(duration),


        // =====================================
        // MOV / MP4
        // =====================================

        "-movflags",
        "+faststart",


        outputPath,

    ],


    time => {

        const progress =
            50 +

            clamp(

                (
                    time /
                    duration
                ) * 50,

                0,
                50

            );


        event.sender.send(

            "export:progress",

            {

                stage:
                    "ffmpeg",

                progress,

                time,

                duration,

            }

        );

    }

);


                // =============================================
                // DONE
                // =============================================

                event.sender.send(

                    "export:progress",

                    {

                        stage:
                            "done",

                        progress:
                            100,

                    }

                );


                console.log(
                    "EXPORT SUCCESS:",
                    outputPath
                );


                return {

                    canceled:
                        false,

                    outputPath,

                };

            }


            finally {

                await fs.rm(

                    frameDir,

                    {

                        recursive:
                            true,

                        force:
                            true,

                    }

                );

            }

        }

    );

}