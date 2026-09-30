import {
    app,
    dialog,
    ipcMain,
    BrowserWindow,
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

    // Width được đo bằng Chromium Canvas
    measuredWidth?: number;

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
    imageFile?: string;

    width?: number;

    height?: number;

    fps?: number;

    accessToken?: string;

};


// ============================================================
// CONSTANTS
// ============================================================

const CANVAS_WIDTH = 1920;

const CANVAS_HEIGHT = 1080;

// Preview của bạn là 640x360.
// Export là 1920x1080.
const PREVIEW_SCALE = 3;


// ============================================================
// WORD GAP
//
// KHÔNG ĐO SPACE.
// Mỗi word cách nhau bằng GAP cố định.
//
// Nếu Preview CSS của bạn đang dùng gap: 12px
// thì để 12 ở đây.
//
// ============================================================

const WORD_GAP = 12;


// ============================================================
// HELPERS
// ============================================================

function escapeXml(
    value: string
) {

    return String(value ?? "")

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
// SAFE SVG ID
// ============================================================

function makeSvgId(
    value: string,
    fallback: string
) {

    const safe =
        String(value ?? "")
            .replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            );

    return safe || fallback;

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
//
// START / END = TIMING
//
// Width chữ KHÔNG liên quan đến timing.
// ============================================================

function getWordPercent(

    word: LyricWord,

    currentTime: number

) {

    if (
        !Number.isFinite(
            word.start
        ) ||
        !Number.isFinite(
            word.end
        )
    ) {

        return 0;

    }


    if (
        word.end <= word.start
    ) {

        return currentTime >= word.end
            ? 100
            : 0;

    }


    if (
        currentTime <= word.start
    ) {

        return 0;

    }


    if (
        currentTime >= word.end
    ) {

        return 100;

    }


    const percent =
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
        100;


    return clamp(
        percent,
        0,
        100
    );

}


// ============================================================
// BUILD TEXT STYLE
// ============================================================

function buildTextStyle(

    style: LyricStyle

) {

    const fontSize =
        (
            style.fontSize ??
            40
        )
        *
        PREVIEW_SCALE;


    const outlineWidth =
        (
            style.outlineWidth ??
            0
        )
        *
        PREVIEW_SCALE;


    const stroke =
        outlineWidth > 0

            ? `
stroke="${escapeXml(
    style.outline ??
    "#000000"
)}"
stroke-width="${outlineWidth}"
stroke-linejoin="round"
paint-order="stroke fill"
`

            : "";


    const filter =
        style.shadow

            ? `filter="url(#shadow)"`

            : "";


    return {

        fontSize,

        outlineWidth,

        stroke,

        filter,

    };

}


// ============================================================
// CHROMIUM TEXT MEASURER
//
// Đây là CÁCH B.
//
// Electron tạo một BrowserWindow ẩn.
// BrowserWindow = Chromium.
// CanvasRenderingContext2D.measureText()
// = font measurement thật.
//
// Không dùng:
// - fontSize * 0.58
// - fontSize * 0.9
// - estimateCharWidth
// - đo ký tự thủ công
//
// ============================================================

let measureWindow:
    BrowserWindow | null = null;


async function getMeasureWindow() {

    if (
        measureWindow &&
        !measureWindow.isDestroyed()
    ) {

        return measureWindow;

    }


    measureWindow =
        new BrowserWindow({

            show: false,

            width: 300,

            height: 200,

            webPreferences: {

                sandbox:
                    false,

            },

        });


    await measureWindow.loadURL(
        "data:text/html,<html><body></body></html>"
    );


    return measureWindow;

}


// ============================================================
// MEASURE TEXT WITH CHROMIUM
// ============================================================

async function measureTextWithChromium(

    text: string,

    fontFamily: string,

    fontSize: number,

    fontWeight: number

) {

    const window =
        await getMeasureWindow();


    const result =
        await window.webContents.executeJavaScript(

            `(() => {

                const canvas =
                    document.createElement("canvas");

                const ctx =
                    canvas.getContext("2d");

                if (!ctx) {
                    return 0;
                }

                ctx.font =
                    ${JSON.stringify(
                        `${fontWeight} ${fontSize}px "${fontFamily}"`
                    )};

                const metrics =
                    ctx.measureText(
                        ${JSON.stringify(text)}
                    );

                return metrics.width;

            })()`

        );


    if (
        !Number.isFinite(
            result
        )
    ) {

        return 0;

    }


    return Number(
        result
    );

}


// ============================================================
// MEASURE ALL WORDS
//
// Chỉ đo mỗi word một lần.
// Không đo lại ở từng frame.
//
// ============================================================

async function prepareMeasuredLyrics(

    lyrics: LyricLine[]

) {

    const cache =
        new Map<string, number>();


    for (
        const line of lyrics
    ) {

        const style: LyricStyle = {

            ...getDefaultStyle(),

            ...(line.style ?? {}),

        };


        const fontFamily =
            style.fontFamily ??
            "Arial";


        const fontSize =
            style.fontSize ??
            40;


        const fontWeight =
            700;


        for (
            const word of line.words ?? []
        ) {

            const text =
                word.word ?? "";


            const cacheKey =
                JSON.stringify({

                    text,

                    fontFamily,

                    fontSize,

                    fontWeight,

                });


            if (
                cache.has(
                    cacheKey
                )
            ) {

                word.measuredWidth =
                    cache.get(
                        cacheKey
                    ) ?? 0;

                continue;

            }


            const measuredWidth =
                await measureTextWithChromium(

                    text,

                    fontFamily,

                    fontSize,

                    fontWeight

                );


            cache.set(
                cacheKey,
                measuredWidth
            );


            word.measuredWidth =
                measuredWidth;


            console.log(
                "[MEASURE]",

                JSON.stringify(
                    text
                ),

                "font:",
                fontFamily,

                fontSize,

                "width:",
                measuredWidth
            );

        }

    }


    return lyrics;

}


// ============================================================
// GET WORD WIDTH
//
// measuredWidth là px của Preview.
//
// Export nhân PREVIEW_SCALE.
// ============================================================

function getWordWidth(

    word: LyricWord,

    scale: number

) {

    const measured =
        Number(
            word.measuredWidth ?? 0
        );


    if (
        measured <= 0
    ) {

        return 0;

    }


    return (
        measured *
        PREVIEW_SCALE *
        scale
    );

}


// ============================================================
// BUILD SVG FRAME
//
// KHÔNG còn <tspan> tự layout.
//
// Từng word có vị trí X riêng.
//
// Vị trí dựa trên:
//     measuredWidth
//     WORD_GAP
//
// Timing dựa trên:
//     start
//     end
//
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


    let content =
        "";


    let defs =
        "";


    // ========================================================
    // LINES
    // ========================================================

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


        const scale =
            style.scale ?? 1;


        const textStyle =
            buildTextStyle(
                style
            );


        // ====================================================
        // WORD WIDTHS
        // ====================================================

        const wordWidths =
            words.map(

                word =>

                    getWordWidth(
                        word,
                        scale
                    )

            );


        const gap =
            WORD_GAP *
            PREVIEW_SCALE *
            scale;


        // ====================================================
        // TOTAL LINE WIDTH
        //
        // width1 + gap + width2 + gap + width3
        // ====================================================

        const totalWidth =
            wordWidths.reduce(

                (
                    total,
                    wordWidth
                ) =>

                    total +
                    wordWidth,

                0

            )
            +
            Math.max(
                0,
                words.length - 1
            )
            *
            gap;


        // ====================================================
        // BASE X
        //
        // style.x là tọa độ Preview.
        // ====================================================

        const centerX =
            (
                style.x ??
                330
            )
            *
            PREVIEW_SCALE;


        let startX =
            centerX;


        if (
            style.align === "center"
        ) {

            startX =
                centerX -
                totalWidth / 2;

        }

        else if (
            style.align === "right"
        ) {

            startX =
                centerX -
                totalWidth;

        }


        // ====================================================
        // Y
        // ====================================================

        const y =
            (
                style.y ??
                180
            )
            *
            PREVIEW_SCALE;


        // ====================================================
        // FONT
        // ====================================================

        const fontFamily =
            escapeXml(
                style.fontFamily ??
                "Arial"
            );


        // ====================================================
        // BUILD WORDS
        // ====================================================

        let currentX =
            startX;


        for (
            let i = 0;
            i < words.length;
            i++
        ) {

            const word =
                words[i];


            const wordWidth =
                wordWidths[i];


            const text =
                word.word ?? "";


            const safeText =
                escapeXml(
                    text
                );


            const percent =
                getWordPercent(

                    word,

                    currentTime

                );


            // =================================================
            // WORD ID
            // =================================================

            const safeWordId =
                makeSvgId(

                    word.id,

                    `word-${i}`

                );


            // =================================================
            // NORMAL TEXT
            // =================================================

            const baseText = `

<text
    x="${currentX}"
    y="${y}"
    dominant-baseline="middle"
    text-anchor="start"
    font-family="${fontFamily}"
    font-size="${textStyle.fontSize}px"
    font-weight="700"
    fill="${escapeXml(
        style.color ??
        "#ffffff"
    )}"
    ${textStyle.stroke}
    ${textStyle.filter}
>
    ${safeText}
</text>

`;


            // =================================================
            // ACTIVE TEXT
            //
            // 0%:
            // Không render.
            //
            // 100%:
            // Full active.
            //
            // Partial:
            // clipPath bằng pixel thật.
            // =================================================

            let activeText =
                "";


            if (
                percent >= 100
            ) {

                activeText = `

<text
    x="${currentX}"
    y="${y}"
    dominant-baseline="middle"
    text-anchor="start"
    font-family="${fontFamily}"
    font-size="${textStyle.fontSize}px"
    font-weight="700"
    fill="${escapeXml(
        style.activeColor ??
        "#00ff66"
    )}"
    ${textStyle.stroke}
    ${textStyle.filter}
>
    ${safeText}
</text>

`;

            }

            else if (
                percent > 0 &&
                wordWidth > 0
            ) {

                // =============================================
                // CLIP WIDTH
                //
                // Không dùng objectBoundingBox.
                //
                // Đây là tọa độ SVG thật.
                // =============================================

                const clipWidth =
                    wordWidth *
                    (
                        percent /
                        100
                    );


                const clipId =
                    `clip-${safeWordId}-${i}-${Math.round(
                        percent * 100
                    )}`;


                defs += `

<clipPath
    id="${clipId}"
    clipPathUnits="userSpaceOnUse"
>

    <rect
        x="${currentX}"
        y="${y - textStyle.fontSize}"
        width="${clipWidth}"
        height="${textStyle.fontSize * 2}"
    />

</clipPath>

`;


                activeText = `

<text
    x="${currentX}"
    y="${y}"
    dominant-baseline="middle"
    text-anchor="start"
    font-family="${fontFamily}"
    font-size="${textStyle.fontSize}px"
    font-weight="700"
    fill="${escapeXml(
        style.activeColor ??
        "#00ff66"
    )}"
    clip-path="url(#${clipId})"
    ${textStyle.stroke}
    ${textStyle.filter}
>
    ${safeText}
</text>

`;

            }


            // =================================================
            // WORD
            // =================================================

            content += `

<g>

    ${baseText}

    ${activeText}

</g>

`;


            // =================================================
            // NEXT WORD
            //
            // width thật + GAP
            // =================================================

            currentX +=
                wordWidth;


            if (
                i <
                words.length - 1
            ) {

                currentX +=
                    gap;

            }

        }

    }


    // ========================================================
    // SVG
    // ========================================================

    return `

<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
>

    <defs>

        <!-- ================================================
             SHADOW
        ================================================= -->

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


        <!-- ================================================
             WORD CLIPS
        ================================================= -->

        ${defs}

    </defs>


    ${content}

</svg>

`;

}


// ============================================================
// FFMPEG PATH
// ============================================================

function findFfmpeg() {

    const ffmpeg =
        path.join(

            app.getPath(
                "userData"
            ),

            "tools",

            "ffmpeg",

            "bin",

            "ffmpeg.exe"

        );


    console.log(
        "[FFmpeg] Path:",
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
// SUPABASE AUTH
// ============================================================

const SUPABASE_URL =
    "https://iidgutuqgiynvacppwlq.supabase.co";


const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZGd1dHVxZ2l5bnZhY3Bwd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNzE3MDQsImV4cCI6MjEwMjc0NzcwNH0.0fpKn0q9Eu-YQCWJPErQ_SSUwT1bBFlLE0jM9mHzmg0";

// ============================================================
// VERIFY SUPABASE USER
// ==============================================
// ==============

async function verifySupabaseUser(

    accessToken: string

) {

    if (
        !accessToken
    ) {

        throw new Error(
            "Bạn phải đăng nhập trước khi export."
        );

    }


    try {

        const response =
            await fetch(

                `${SUPABASE_URL}/auth/v1/user`,

                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${accessToken}`,

                        apikey:
                            SUPABASE_ANON_KEY,

                    },

                }

            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
            );

        }


        const user =
            await response.json();


        if (
            !user?.id
        ) {

            throw new Error(
                "Không xác định được tài khoản đăng nhập."
            );

        }


        console.log(
            "[AUTH] Export user:",
            {

                id:
                    user.id,

                email:
                    user.email,

            }
        );


        return user;

    }

    catch (
        error
    ) {

        console.error(
            "[AUTH] Verify failed:",
            error
        );


        if (
            error instanceof Error
        ) {

            throw error;

        }


        throw new Error(
            "Không thể xác thực tài khoản."
        );

    }

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

            // =================================================
            // AUTH
            // =================================================

            const user =
                await verifySupabaseUser(

                    data.accessToken ??
                    ""

                );


            console.log(
                "[EXPORT] Authenticated:",
                user.email
            );


            // =================================================
            // SETTINGS
            // =================================================

            const width =
                data.width ??
                CANVAS_WIDTH;


            const height =
                data.height ??
                CANVAS_HEIGHT;


            const fps =
                data.fps ??
                21;


            const duration =
                Math.max(

                    0,

                    data.duration ??
                    0

                );


            // =================================================
            // VALIDATE
            // =================================================

      // =================================================
// VALIDATE BACKGROUND
// =================================================

const isImageMode =
    !!data.imageFile;


if (
    !isImageMode &&
    !data.videoFile
) {

    throw new Error(
        "Chưa có video hoặc ảnh nền."
    );

}


// =================================================
// VALIDATE LYRICS
// =================================================

if (
    !data.lyrics?.length
) {

    throw new Error(
        "Không có lyrics để export."
    );

}


// =================================================
// VALIDATE DURATION
// =================================================

if (
    duration <= 0
) {

    throw new Error(
        "Duration không hợp lệ."
    );

}


// =================================================
// VALIDATE IMAGE
// =================================================

if (
    isImageMode
) {

    try {

        await fs.access(
            data.imageFile!
        );

    }

    catch {

        throw new Error(

            `Không tìm thấy ảnh nền:\n${data.imageFile}`

        );

    }

}


// =================================================
// VALIDATE VIDEO
//
// Image Mode vẫn có thể có video timing.
// Video Mode bắt buộc phải có video.
// =================================================

if (
    data.videoFile
) {

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
                // 1. MEASURE FONT
                //
                // Đây là bước mới.
                //
                // Chromium Canvas đo mỗi word bằng font thật.
                // =============================================

                console.log(
                    "[EXPORT] Measuring words with Chromium..."
                );


                const measuredLyrics =
                    await prepareMeasuredLyrics(

                        data.lyrics

                    );


                console.log(
                    "[EXPORT] Font measurement complete."
                );


                // =============================================
                // 2. GENERATE FRAMES
                // =============================================

                const totalFrames =
                    Math.ceil(
                        duration * fps
                    );


                console.log(
                    "[EXPORT] Generating frames:",
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

                            measuredLyrics,

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

                        Buffer.from(
                            svg
                        )

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


                // =============================================
                // 3. FFMPEG
                // =============================================

            // =============================================
// 3. FFMPEG
// =============================================

const inputPattern =
    path.join(
        frameDir,
        "frame-%07d.png"
    );


// ============================================================
// MODE
//
// IMAGE MODE:
// imageFile có → ảnh là background.
// videoFile chỉ dùng làm audio/timing source.
//
// VIDEO MODE:
// imageFile không có → videoFile là background.
// ============================================================

const isImageMode =
    !!data.imageFile;


console.log(
    "[EXPORT] ==============================="
);

console.log(
    "[EXPORT] MODE:",
    isImageMode
        ? "IMAGE BACKGROUND"
        : "VIDEO BACKGROUND"
);

console.log(
    "[EXPORT] Video:",
    data.videoFile
);

console.log(
    "[EXPORT] Image:",
    data.imageFile
);

console.log(
    "[EXPORT] Output:",
    outputPath
);

console.log(
    "[EXPORT] ==============================="
);


let ffmpegArgs: string[];


// ============================================================
// IMAGE MODE
//
// imageFile = background
//
// videoFile = audio source
//
// Video KHÔNG được render.
// ============================================================

if (isImageMode) {

    ffmpegArgs = [

        "-y",


        // ==========================================
        // INPUT 0
        // STATIC IMAGE BACKGROUND
        // ==========================================

        "-loop",
        "1",

        "-i",
        data.imageFile!,


        // ==========================================
        // INPUT 1
        // LYRIC PNG FRAMES
        // ==========================================

        "-framerate",
        String(fps),

        "-i",
        inputPattern,


        // ==========================================
        // INPUT 2
        // TIMING VIDEO / AUDIO SOURCE
        //
        // Video này KHÔNG dùng làm background.
        // Chỉ lấy audio.
        // ==========================================

        "-stream_loop",
        "-1",

        "-i",
        data.videoFile,


        // ==========================================
        // FILTER
        // ==========================================

        "-filter_complex",

        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[bg];` +

        `[1:v]format=rgba[lyrics];` +

        `[bg][lyrics]overlay=0:0:format=auto[outv]`,


        // ==========================================
        // VIDEO OUTPUT
        // ==========================================

        "-map",
        "[outv]",


        // ==========================================
        // AUDIO
        //
        // Lấy audio từ video timing.
        // ==========================================

        "-map",
        "2:a?",


        // ==========================================
        // VIDEO CODEC
        // ==========================================

        "-c:v",
        "libx264",

        "-preset",
        "medium",

        "-crf",
        "18",

        "-pix_fmt",
        "yuv420p",


        // ==========================================
        // AUDIO CODEC
        // ==========================================

        "-c:a",
        "aac",

        "-b:a",
        "192k",


        // ==========================================
        // FPS
        // ==========================================

        "-r",
        String(fps),


        // ==========================================
        // DURATION
        // ==========================================

        "-t",
        String(duration),


        // ==========================================
        // MP4
        // ==========================================

        "-movflags",
        "+faststart",


        outputPath,

    ];

}


// ============================================================
// VIDEO MODE
//
// videoFile = background
//
// imageFile không tồn tại.
//
// Giữ nguyên chức năng video nền hiện tại.
// ============================================================

else {

    ffmpegArgs = [

        "-y",


        // ==========================================
        // INPUT 0
        // VIDEO BACKGROUND
        // ==========================================

        "-stream_loop",
        "-1",

        "-i",
        data.videoFile,


        // ==========================================
        // INPUT 1
        // LYRIC PNG FRAMES
        // ==========================================

        "-framerate",
        String(fps),

        "-i",
        inputPattern,


        // ==========================================
        // FILTER
        // ==========================================

        "-filter_complex",

        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[bg];` +

        `[1:v]format=rgba[lyrics];` +

        `[bg][lyrics]overlay=0:0:format=auto[outv]`,


        // ==========================================
        // VIDEO OUTPUT
        // ==========================================

        "-map",
        "[outv]",


        // ==========================================
        // AUDIO
        //
        // Giữ audio của video nền.
        // ==========================================

        "-map",
        "0:a?",


        // ==========================================
        // VIDEO CODEC
        // ==========================================

        "-c:v",
        "libx264",

        "-preset",
        "medium",

        "-crf",
        "18",

        "-pix_fmt",
        "yuv420p",


        // ==========================================
        // AUDIO CODEC
        // ==========================================

        "-c:a",
        "aac",

        "-b:a",
        "192k",


        // ==========================================
        // FPS
        // ==========================================

        "-r",
        String(fps),


        // ==========================================
        // DURATION
        // ==========================================

        "-t",
        String(duration),


        // ==========================================
        // MP4
        // ==========================================

        "-movflags",
        "+faststart",


        outputPath,

    ];

}


// ============================================================
// RUN FFMPEG
// ============================================================

await runFfmpeg(

    ffmpegArgs,

    time => {

        const progress =
            50 +

            clamp(

                (
                    time /
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
                    "[EXPORT] SUCCESS:",
                    outputPath
                );


                return {

                    canceled:
                        false,

                    outputPath,

                };

            }


            finally {

                // =============================================
                // CLEAN TEMP FRAMES
                // =============================================

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