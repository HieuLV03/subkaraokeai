import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

// ============================================================
// RUNTIME VERSION
// ============================================================

interface RuntimeConfig {
    ai: string;
    tools: string;
}


// ============================================================
// READ APP PACKAGE
// ============================================================

function getRuntimeConfig(): RuntimeConfig {

    const packageFile = path.join(
        app.isPackaged
            ? process.resourcesPath
            : process.cwd(),
        "app.asar",
        "package.json"
    );

    const normalPackageFile = path.join(
        app.isPackaged
            ? process.resourcesPath
            : process.cwd(),
        "package.json"
    );

    let packagePath = normalPackageFile;

    // Production: package.json nằm bên trong app.asar
    if (
        app.isPackaged &&
        fs.existsSync(packageFile)
    ) {

        packagePath = packageFile;

    }

    if (!fs.existsSync(packagePath)) {

        throw new Error(
            "package.json not found: " +
            packagePath
        );

    }

    const packageJson = JSON.parse(
        fs.readFileSync(
            packagePath,
            "utf8"
        )
    );

    if (
        !packageJson.runtime ||
        !packageJson.runtime.ai ||
        !packageJson.runtime.tools
    ) {

        throw new Error(
            "Runtime version configuration not found in package.json"
        );

    }

    return {
        ai: String(
            packageJson.runtime.ai
        ),

        tools: String(
            packageJson.runtime.tools
        )
    };

}


// ============================================================
// PATH
// ============================================================

export function getAIPath() {

    return path.join(
        app.getPath("userData"),
        "ai"
    );

}


export function getToolsPath() {

    return path.join(
        app.getPath("userData"),
        "tools"
    );

}


// ============================================================
// VERSION FILE
// ============================================================

function getVersionFile() {

    return path.join(
        app.getPath("userData"),
        "runtime-version.json"
    );

}


// ============================================================
// READ INSTALLED VERSION
// ============================================================

function readRuntimeVersion() {

    const versionFile =
        getVersionFile();

    if (
        !fs.existsSync(
            versionFile
        )
    ) {

        return {
            ai: null,
            tools: null
        };

    }

    try {

        const data =
            JSON.parse(
                fs.readFileSync(
                    versionFile,
                    "utf8"
                )
            );

        return {
            ai:
                data.ai ?? null,

            tools:
                data.tools ?? null
        };

    } catch {

        return {
            ai: null,
            tools: null
        };

    }

}


// ============================================================
// WRITE VERSION
// ============================================================

function writeRuntimeVersion(
    aiVersion: string,
    toolsVersion: string
) {

    fs.writeFileSync(
        getVersionFile(),
        JSON.stringify(
            {
                ai: aiVersion,
                tools: toolsVersion
            },
            null,
            2
        ),
        "utf8"
    );

}


// ============================================================
// CHECK AI
// ============================================================

function isAIInstalled() {

    const pythonExe =
        path.join(
            getAIPath(),
            "venv",
            "Scripts",
            "python.exe"
        );

    const mainPy =
        path.join(
            getAIPath(),
            "main.py"
        );

    return (
        fs.existsSync(
            pythonExe
        ) &&
        fs.existsSync(
            mainPy
        )
    );

}


// ============================================================
// CHECK TOOLS
// ============================================================

function isToolsInstalled() {

    const ffmpegExe =
        path.join(
            getToolsPath(),
            "ffmpeg",
            "bin",
            "ffmpeg.exe"
        );

    return fs.existsSync(
        ffmpegExe
    );

}


// ============================================================
// COPY DIRECTORY SAFELY
// ============================================================

function replaceDirectory(
    source: string,
    destination: string
) {

    console.log(
        "[RUNTIME] Replacing:",
        destination
    );

    // Xóa runtime cũ
    if (
        fs.existsSync(
            destination
        )
    ) {

        fs.rmSync(
            destination,
            {
                recursive: true,
                force: true
            }
        );

    }

    // Tạo thư mục
    fs.mkdirSync(
        destination,
        {
            recursive: true
        }
    );

    // Copy runtime mới
    fs.cpSync(
        source,
        destination,
        {
            recursive: true
        }
    );

}


// ============================================================
// ENSURE RUNTIME
// ============================================================

export function ensureRuntimeInstalled() {

    const userData =
        app.getPath(
            "userData"
        );


    // ========================================================
    // LOAD REQUIRED RUNTIME VERSION
    // ========================================================

    const runtimeConfig =
        getRuntimeConfig();

    const AI_VERSION =
        runtimeConfig.ai;

    const TOOLS_VERSION =
        runtimeConfig.tools;


    // ========================================================
    // RUNTIME SOURCE
    // ========================================================

    const runtimeSource =
        app.isPackaged

            ? path.join(
                process.resourcesPath,
                "runtime"
            )

            : path.join(
                process.cwd(),
                "runtime"
            );


    const pythonSource =
        path.join(
            runtimeSource,
            "python"
        );


    const toolsSource =
        path.join(
            runtimeSource,
            "tools"
        );


    const aiPath =
        getAIPath();


    const toolsPath =
        getToolsPath();


    // ========================================================
    // READ INSTALLED VERSION
    // ========================================================

    const installed =
        readRuntimeVersion();


    // ========================================================
    // LOG
    // ========================================================

    console.log(
        "========================================"
    );

    console.log(
        "[RUNTIME] USER DATA:",
        userData
    );

    console.log(
        "[RUNTIME] SOURCE:",
        runtimeSource
    );

    console.log(
        "[RUNTIME] AI:",
        aiPath
    );

    console.log(
        "[RUNTIME] TOOLS:",
        toolsPath
    );

    console.log(
        "[RUNTIME] Installed AI:",
        installed.ai
    );

    console.log(
        "[RUNTIME] Required AI:",
        AI_VERSION
    );

    console.log(
        "[RUNTIME] Installed Tools:",
        installed.tools
    );

    console.log(
        "[RUNTIME] Required Tools:",
        TOOLS_VERSION
    );

    console.log(
        "========================================"
    );


    // ========================================================
    // AI
    // ========================================================

    const aiNeedsUpdate =
        !isAIInstalled() ||
        installed.ai !== AI_VERSION;


    if (
        aiNeedsUpdate
    ) {

        console.log(
            "[RUNTIME] AI needs installation/update"
        );

        console.log(
            "[RUNTIME] AI:",
            installed.ai,
            "→",
            AI_VERSION
        );


        if (
            !fs.existsSync(
                pythonSource
            )
        ) {

            throw new Error(
                "Python AI runtime not found: " +
                pythonSource
            );

        }


        replaceDirectory(
            pythonSource,
            aiPath
        );


        console.log(
            "[RUNTIME] AI READY"
        );

    } else {

        console.log(
            "[RUNTIME] AI already up to date"
        );

    }


    // ========================================================
    // TOOLS
    // ========================================================

    const toolsNeedsUpdate =
        !isToolsInstalled() ||
        installed.tools !== TOOLS_VERSION;


    if (
        toolsNeedsUpdate
    ) {

        console.log(
            "[RUNTIME] Tools needs installation/update"
        );

        console.log(
            "[RUNTIME] Tools:",
            installed.tools,
            "→",
            TOOLS_VERSION
        );


        if (
            !fs.existsSync(
                toolsSource
            )
        ) {

            throw new Error(
                "Tools runtime not found: " +
                toolsSource
            );

        }


        replaceDirectory(
            toolsSource,
            toolsPath
        );


        console.log(
            "[RUNTIME] Tools READY"
        );

    } else {

        console.log(
            "[RUNTIME] Tools already up to date"
        );

    }


    // ========================================================
    // SAVE VERSION
    // ========================================================

    writeRuntimeVersion(
        AI_VERSION,
        TOOLS_VERSION
    );


    // ========================================================
    // READY
    // ========================================================

    console.log(
        "========================================"
    );

    console.log(
        "[RUNTIME] READY"
    );

    console.log(
        "[RUNTIME] AI VERSION:",
        AI_VERSION
    );

    console.log(
        "[RUNTIME] TOOLS VERSION:",
        TOOLS_VERSION
    );

    console.log(
        "========================================"
    );

}