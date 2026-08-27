import { app } from "electron";
import path from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs";

import {
  getAIPath,
  getToolsPath
} from "../../electron/ai-manager";


// ============================================================
// TYPES
// ============================================================

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


// ============================================================
// CONTROLLER
// ============================================================

export interface WhisperController {

  cancel: () => void;

  process: ReturnType<typeof spawn>;

}


// ============================================================
// RUN WHISPERX
// ============================================================

export function runWhisperX(
  audio: string,
  onData: (
    data: WhisperProgress | WhisperResult
  ) => void
): WhisperController | null {


  // ============================================================
  // AI ROOT
  // ============================================================

  const aiRoot = app.isPackaged

    ? getAIPath()

    : path.join(
        process.cwd(),
        "runtime",
        "python"
      );


  // ============================================================
  // TOOLS ROOT
  // ============================================================

  const toolsRoot = app.isPackaged

    ? getToolsPath()

    : path.join(
        process.cwd(),
        "runtime",
        "tools"
      );


  // ============================================================
  // PYTHON
  // ============================================================

  const pythonPath = path.join(
    aiRoot,
    "venv",
    "Scripts",
    "python.exe"
  );


  // ============================================================
  // WHISPERX SCRIPT
  // ============================================================

  const scriptPath = path.join(
    aiRoot,
    "main.py"
  );


  // ============================================================
  // FFMPEG
  // ============================================================

  const ffmpegDir = path.join(
    toolsRoot,
    "ffmpeg",
    "bin"
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
    pythonPath
  );

  console.log(
    "[WhisperX] SCRIPT:",
    scriptPath
  );

  console.log(
    "[WhisperX] TOOLS ROOT:",
    toolsRoot
  );

  console.log(
    "[WhisperX] FFMPEG:",
    ffmpegDir
  );

  console.log(
    "[WhisperX] AUDIO:",
    audio
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

  if (!fs.existsSync(pythonPath)) {

    console.error(
      "[WhisperX] Python NOT FOUND:",
      pythonPath
    );

    onData({
      type: "progress",
      progress: 0,
      message:
        "Không tìm thấy AI runtime."
    });

    return null;
  }


  // ============================================================
  // CHECK MAIN.PY
  // ============================================================

  if (!fs.existsSync(scriptPath)) {

    console.error(
      "[WhisperX] main.py NOT FOUND:",
      scriptPath
    );

    onData({
      type: "progress",
      progress: 0,
      message:
        "Không tìm thấy WhisperX."
    });

    return null;
  }


  // ============================================================
  // CHECK FFMPEG
  // ============================================================

  const ffmpegExe = path.join(
    ffmpegDir,
    "ffmpeg.exe"
  );


  if (!fs.existsSync(ffmpegExe)) {

    console.error(
      "[WhisperX] FFmpeg NOT FOUND:",
      ffmpegExe
    );

    onData({
      type: "progress",
      progress: 0,
      message:
        "Không tìm thấy FFmpeg runtime."
    });

    return null;
  }


  // ============================================================
  // ENVIRONMENT
  // ============================================================

  const env = {

    ...process.env,

    PYTHONIOENCODING: "utf-8",

    PYTHONUTF8: "1",

    PATH:
      ffmpegDir +
      ";" +
      (process.env.PATH ?? "")

  };


  // ============================================================
  // START PYTHON
  // ============================================================

  const python = spawn(

    pythonPath,

    [
      scriptPath,
      audio
    ],

    {

      cwd: aiRoot,

      windowsHide: true,

      env

    }

  );


  // ============================================================
  // CANCEL
  // ============================================================

  const cancel = () => {

    console.log(
      "[WhisperX] CANCEL REQUESTED"
    );

    console.log(
      "[WhisperX] PID:",
      python.pid
    );


    if (!python.pid) {

      console.log(
        "[WhisperX] No PID to terminate"
      );

      return;

    }


    // ==========================================================
    // WINDOWS
    // ==========================================================

    if (
      process.platform === "win32"
    ) {

      console.log(
        "[WhisperX] Killing process tree..."
      );


      const killer = spawn(

        "taskkill",

        [
          "/pid",
          String(python.pid),
          "/T",
          "/F"
        ],

        {
          windowsHide: true
        }

      );


      killer.stdout.on(
        "data",
        data => {

          console.log(
            "[WhisperX taskkill]",
            data.toString()
          );

        }
      );


      killer.stderr.on(
        "data",
        data => {

          console.error(
            "[WhisperX taskkill ERROR]",
            data.toString()
          );

        }
      );


      killer.on(
        "close",
        code => {

          console.log(
            "[WhisperX] taskkill exited:",
            code
          );

        }
      );


    }

    // ==========================================================
    // MAC / LINUX
    // ==========================================================

    else {

      try {

        python.kill(
          "SIGTERM"
        );

      }

      catch (error) {

        console.error(
          "[WhisperX] Kill error:",
          error
        );

      }

    }

  };


  // ============================================================
  // STDOUT
  // ============================================================

  let buffer = "";


  python.stdout.on(

    "data",

    (chunk: Buffer) => {

      buffer +=
        chunk.toString("utf8");


      const lines =
        buffer.split("\n");


      buffer =
        lines.pop() ?? "";


      for (
        const line of lines
      ) {

        const text =
          line.trim();


        if (!text) {

          continue;

        }


        try {

          const json =
            JSON.parse(text);


          if (

            json.type === "progress" ||

            json.type === "result"

          ) {

            onData(json);

          }

          else {

            console.log(

              "[WhisperX] Unknown message:",

              json

            );

          }

        }

        catch {

          console.log(

            "[WhisperX]",

            text

          );

        }

      }

    }

  );


  // ============================================================
  // STDERR
  // ============================================================

  python.stderr.on(

    "data",

    (data: Buffer) => {

      console.error(

        "[WhisperX STDERR]",

        data.toString("utf8")

      );

    }

  );


  // ============================================================
  // ERROR
  // ============================================================

  python.on(

    "error",

    (err) => {

      console.error(

        "[WhisperX ERROR]",

        err

      );


      onData({

        type: "progress",

        progress: 0,

        message:
          `Không thể khởi động AI: ${err.message}`

      });

    }

  );


  // ============================================================
  // CLOSE
  // ============================================================

  python.on(

    "close",

    (code) => {

      console.log(

        "[WhisperX] Python exited:",

        code

      );

    }

  );


  // ============================================================
  // RETURN CONTROLLER
  // ============================================================

  return {

    cancel,

    process: python

  };

}