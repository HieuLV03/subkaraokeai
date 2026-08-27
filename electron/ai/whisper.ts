import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { app } from "electron";

export function runWhisperX(
    audioFile: string,
    onMessage: (data: any) => void
) {

    // ============================================================
    // AI ROOT
    // ============================================================

    const aiRoot = app.isPackaged
        ? path.join(
            app.getPath("userData"),
            "ai"
        )
        : path.join(
            process.cwd(),
            "runtime",
            "python"
        );


    // ============================================================
    // PYTHON
    // ============================================================

    const pythonExe = path.join(
        aiRoot,
        "venv",
        "Scripts",
        "python.exe"
    );


    // ============================================================
    // WHISPERX SCRIPT
    // ============================================================

    const script = path.join(
        aiRoot,
        "main.py"
    );


    // ============================================================
    // LOG
    // ============================================================

    console.log(
        "========================================"
    );

    console.log(
        "[WhisperX] START"
    );

    console.log(
        "[WhisperX] PACKAGED:",
        app.isPackaged
    );

    console.log(
        "[WhisperX] AI ROOT:",
        aiRoot
    );

    console.log(
        "[WhisperX] PYTHON:",
        pythonExe
    );

    console.log(
        "[WhisperX] SCRIPT:",
        script
    );

    console.log(
        "[WhisperX] AUDIO:",
        audioFile
    );

    console.log(
        "[WhisperX] CWD:",
        aiRoot
    );

    console.log(
        "========================================"
    );


    // ============================================================
    // CHECK PYTHON
    // ============================================================

    if (!fs.existsSync(pythonExe)) {

        console.error(
            "[WhisperX] Python not found:",
            pythonExe
        );

        onMessage({
            type: "error",
            message:
                "WhisperX Python runtime không tồn tại: " +
                pythonExe
        });

        return;
    }


    // ============================================================
    // CHECK MAIN.PY
    // ============================================================

    if (!fs.existsSync(script)) {

        console.error(
            "[WhisperX] main.py not found:",
            script
        );

        onMessage({
            type: "error",
            message:
                "WhisperX main.py không tồn tại: " +
                script
        });

        return;
    }


    // ============================================================
    // START PYTHON
    // ============================================================

    const processAI = spawn(
        pythonExe,
        [
            script,
            audioFile
        ],
        {
            cwd: aiRoot,
            windowsHide: true
        }
    );


    // ============================================================
    // STDOUT
    // ============================================================

    let buffer = "";

    processAI.stdout.on(
        "data",
        chunk => {

            buffer += chunk.toString();

            const lines =
                buffer.split("\n");

            buffer =
                lines.pop() ?? "";

            for (
                const line of lines
            ) {

                if (!line.trim()) {
                    continue;
                }

                try {

                    const data =
                        JSON.parse(line);

                    onMessage(data);

                } catch {

                    console.log(
                        "[WhisperX STDOUT]",
                        line
                    );

                }

            }

        }
    );


    // ============================================================
    // STDERR
    // ============================================================

    processAI.stderr.on(
        "data",
        err => {

            console.error(
                "[WhisperX STDERR]",
                err.toString()
            );

        }
    );


    // ============================================================
    // ERROR
    // ============================================================

    processAI.on(
        "error",
        error => {

            console.error(
                "[WhisperX ERROR]",
                error
            );

            onMessage({
                type: "error",
                message:
                    error.message
            });

        }
    );


    // ============================================================
    // CLOSE
    // ============================================================

    processAI.on(
        "close",
        code => {

            console.log(
                "[WhisperX] EXIT:",
                code
            );

            onMessage({
                type: "exit",
                code
            });

        }
    );

}