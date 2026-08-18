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

    synced: boolean;

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

    /*
     * Optional.
     *
     * Store hiện tại của bạn chưa cần scale,
     * nhưng giữ lại để tương thích project cũ.
     */
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

    width?: number;

    height?: number;

    fps?: number;

};


// ============================================================
// CONSTANTS
// ============================================================

/*
 * Canvas THẬT của project.
 *
 * Preview chỉ là bản thu nhỏ:
 *
 * 1920 × 1080
 *       ↓ scale 1/3
 * 640 × 360
 */

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


function escapeFileName(
    value: string
) {

    return value.replace(
        /[<>:"/\\|?*\x00-\x1F]/g,
        "_"
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

        /*
         * Canvas thật.
         *
         * Preview sẽ tự scale xuống 1/3.
         */
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

        /*
         * CENTER của canvas 1920 × 1080
         */
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
// WORD KARAOKE PERCENT
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
            (
                currentTime -
                word.start
            )
            /
            (
                word.end -
                word.start
            )
        )
        *
        100,

        0,

        100

    );

}


// ============================================================
// APPROX TEXT WIDTH
// ============================================================

/*
 * SVG không có DOM browser để lấy
 * getBoundingClientRect().
 *
 * Vì vậy cần ước lượng width.
 *
 * Quan trọng:
 *
 * Preview cũng đang dùng một chuỗi word
 * nối với nhau.
 *
 * Ta dùng cùng một quy tắc xuyên suốt
 * cho export.
 */

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

        const word =
            words[i];

        width +=
            getWordWidth(
                word.word ?? "",
                fontSize
            );

        /*
         * Preview:
         *
         * .subtitle-word {
         *     margin-right: 8px;
         * }
         *
         * Export:
         *
         * 8 × 3 = 24
         */

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


    /*
     * Stroke
     */

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


    /*
     * Shadow
     */

    const filter =
        shadow

            ? `filter="url(#shadow)"`

            : "";


    /*
     * Normal text
     */

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

    /*
     * ==========================================
     * CHỈ LẤY LINE ĐANG HIỆN TẠI
     * ==========================================
     */

    const activeLines =
        lyrics.filter(

            line =>

                currentTime >=
                    line.start

                &&

                currentTime <=
                    line.end

        );


    let content = "";


    /*
     * ==========================================
     * RENDER TỪNG LINE
     * ==========================================
     */

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


        /*
         * ======================================
         * STYLE
         * ======================================
         */



        /*
         * ======================================
         * LINE POSITION
         * ======================================
         *
         * x/y là CENTER của object.
         *
         * Giống Preview:
         *
         * left: x
         * top: y
         * transform:
         * translate(-50%, -50%)
         */
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


        /*
         * ======================================
         * WIDTH
         * ======================================
         */

        const lineWidth =
            getLineWidth(
                words,
                fontSize
            );


        /*
         * ======================================
         * START X
         * ======================================
         */

        let startX = 0;


        if (
            align ===
            "center"
        ) {

            startX =
                -lineWidth /
                2;

        }

        else if (
            align ===
            "right"
        ) {

            startX =
                -lineWidth;

        }


        /*
         * ======================================
         * WORDS
         * ======================================
         */

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


        /*
         * ======================================
         * OBJECT
         * ======================================
         *
         * x/y = center.
         *
         * Không phụ thuộc selectedLine.
         *
         * Không phụ thuộc Preview scale.
         */

    content += `
<g
    transform="translate(${x} ${y}) scale(${scale})"
>
    ${wordsSvg}
</g>
`;

    }


    /*
     * ==========================================
     * SVG
     * ==========================================
     *
     * Không có background.
     *
     * => Transparent.
     */

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
// FIND FFMPEG
// ============================================================

function findFfmpeg() {

    /*
     * Dev:
     *
     * project/tools/ffmpeg/bin/ffmpeg.exe
     */

    return path.join(

        process.cwd(),

        "tools",

        "ffmpeg",

        "bin",

        "ffmpeg.exe"

    );

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


                    /*
                     * FFmpeg:
                     *
                     * time=00:00:03.12
                     */

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
                            hours *
                            3600

                            +

                            minutes *
                            60

                            +

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

            /*
             * ==========================================
             * CANVAS
             * ==========================================
             */

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

                    data.duration ??
                    0

                );


            /*
             * ==========================================
             * VALIDATE
             * ==========================================
             */

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


            /*
             * ==========================================
             * SAVE DIALOG
             * ==========================================
             */

            const result =
                await dialog.showSaveDialog(

                    {

                        title:
                            "Export Transparent Karaoke Video",


                        defaultPath:

                            path.join(

                                app.getPath(
                                    "videos"
                                ),

                                "karaoke-transparent.webm"

                            ),


                        filters: [

                            {

                                name:
                                    "Transparent WebM",

                                extensions:
                                    ["webm"],

                            },

                        ],

                    }

                );


            if (

                result.canceled

                ||

                !result.filePath

            ) {

                return {

                    canceled:
                        true,

                };

            }


            /*
             * ==========================================
             * OUTPUT
             * ==========================================
             */

            const outputPath =

                result.filePath.endsWith(
                    ".webm"
                )

                    ?

                    result.filePath

                    :

                    `${result.filePath}.webm`;


            /*
             * ==========================================
             * TEMP DIRECTORY
             * ==========================================
             */

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

                /*
                 * ======================================
                 * 1. GENERATE PNG FRAMES
                 * ======================================
                 */

                const totalFrames =
                    Math.ceil(

                        duration *
                        fps

                    );


                for (

                    let frame = 0;

                    frame <
                    totalFrames;

                    frame++

                ) {

                    /*
                     * Timeline chính xác.
                     *
                     * Không dùng real-time.
                     */

                    const currentTime =
                        frame /
                        fps;


                    /*
                     * Build SVG
                     */

                    const svg =
                        buildSvgFrame(

                            data.lyrics,

                            currentTime,

                            width,

                            height

                        );


                    /*
                     * PNG transparent
                     */

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
    .toFile(framePath);

const metadata = await sharp(
    framePath
).metadata();

console.log(
    "[EXPORT PNG]",
    {
        frame,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        format: metadata.format,
    }
);


                    /*
                     * Progress:
                     *
                     * Frame generation
                     * = 0 → 50%
                     */

                    event.sender.send(

                        "export:progress",

                        {

                            stage:
                                "frames",

                            progress:

                                (

                                    (frame + 1)

                                    /

                                    totalFrames

                                )

                                *

                                50,

                            current:
                                frame + 1,

                            total:
                                totalFrames,

                        }

                    );

                }


                /*
                 * ======================================
                 * 2. FFMPEG
                 * ======================================
                 */

                const inputPattern =
                    path.join(

                        frameDir,

                        "frame-%07d.png"

                    );


                await runFfmpeg(

                    [

                        "-y",


                        /*
                         * PNG sequence FPS
                         */

                        "-framerate",

                        String(
                            fps
                        ),


                        "-i",

                        inputPattern,


                        /*
                         * Pixel format RGBA
                         */

                        "-pix_fmt",

                        "yuva420p",


                        /*
                         * VP9
                         */

                        "-c:v",

                        "libvpx-vp9",


                        /*
                         * Quality
                         */

                        "-b:v",

                        "0",


                        "-crf",

                        "30",


                        /*
                         * Bật alpha transparency
                         */

                        "-auto-alt-ref",

                        "0",


                        /*
                         * Không audio
                         */

                        "-an",


                        outputPath,

                    ],


                    time => {

                        const progress =
                            50 +

                            clamp(

                                (

                                    time

                                    /

                                    duration

                                )

                                *

                                50,

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


                /*
                 * ======================================
                 * DONE
                 * ======================================
                 */

                event.sender.send(

                    "export:progress",

                    {

                        stage:
                            "done",

                        progress:
                            100,

                    }

                );


                return {

                    canceled:
                        false,

                    outputPath,

                };

            }

            finally {

                /*
                 * ======================================
                 * CLEAN TEMP FRAMES
                 * ======================================
                 */

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