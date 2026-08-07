import { app } from "electron";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = app.isPackaged
  ? process.resourcesPath
  : path.join(__dirname, "..");

export interface WhisperProgress {
  type: "progress";
  progress: number;
  message: string;
}

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperLine {
  start: number;
  end: number;
  text: string;
  words: WhisperWord[];
}

export interface WhisperResult {
  type: "result";
  lyrics: WhisperLine[];
}

export function runWhisperX(
  audio: string,
  onData: (
    data: WhisperProgress | WhisperResult
  ) => void
) {
  const pythonPath = path.join(
    ROOT,
    "python",
    "venv",
    "Scripts",
    "python.exe"
  );

  const scriptPath = path.join(
    ROOT,
    "python",
    "main.py"
  );

  const ffmpegDir = path.join(
    ROOT,
    "tools",
    "ffmpeg",
    "bin"
  );

  console.log("ROOT:", ROOT);
  console.log("PYTHON:", pythonPath);
  console.log("SCRIPT:", scriptPath);

  const python = spawn(
    pythonPath,
    [scriptPath, audio],
    {
      cwd: ROOT,

      env: {
        ...process.env,

        PYTHONIOENCODING: "utf-8",

        PYTHONUTF8: "1",

        PATH:
          ffmpegDir +
          ";" +
          process.env.PATH,
      },
    }
  );

  let buffer = "";

  python.stdout.on(
    "data",
    (chunk: Buffer) => {
      buffer += chunk.toString("utf8");

      const lines = buffer.split("\n");

      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const text = line.trim();

        if (!text) continue;

        try {
          const json = JSON.parse(text);

          if (
            json.type === "progress" ||
            json.type === "result"
          ) {
            onData(json);
          } else {
            console.log(
              "Unknown message:",
              json
            );
          }
        } catch {
          console.log("Python:", text);
        }
      }
    }
  );

  python.stderr.on(
    "data",
    (data: Buffer) => {
      console.error(
        "Python error:",
        data.toString("utf8")
      );
    }
  );

  python.on("close", (code) => {
    console.log(
      "Python exited:",
      code
    );
  });

  python.on("error", (err) => {
    console.error(
      "Spawn error:",
      err
    );
  });
}