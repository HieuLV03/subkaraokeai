import { spawn } from "node:child_process";
import path from "node:path";

export function runWhisperX(
    audioFile: string,
    onMessage: (data: any) => void
) {

    const pythonExe = path.join(
        process.cwd(),
        "python",
        "venv",
        "Scripts",
        "python.exe"
    );

    const script = path.join(
        process.cwd(),
        "python",
        "main.py"
    );

    const processAI = spawn(
        pythonExe,
        [script, audioFile],
        {
            cwd: path.join(process.cwd(), "python")
        }
    );

    let buffer = "";

    processAI.stdout.on("data", chunk => {

        buffer += chunk.toString();

        const lines = buffer.split("\n");

        buffer = lines.pop() ?? "";

        for (const line of lines) {

            if (!line.trim()) continue;

            try {

                onMessage(
                    JSON.parse(line)
                );

            } catch {

                console.log(line);

            }

        }

    });

    processAI.stderr.on("data", err => {

        console.error(
            err.toString()
        );

    });

    processAI.on("close", code => {

        console.log(
            "WhisperX Exit:",
            code
        );

    });

}