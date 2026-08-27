import {
  ipcMain
} from "electron";


import fs from "fs";


import {
  runWhisperX,
  WhisperController
} from "../../runtime/python/spawn";


// ============================================================
// CURRENT WHISPERX PROCESS
// ============================================================

let currentWhisper: WhisperController | null = null;


// ============================================================
// REGISTER AI IPC
// ============================================================

export function registerAIIPC() {


  // ==========================================================
  // GENERATE LYRICS
  // ==========================================================

  ipcMain.handle(

    "ai:generateLyrics",

    async (

      event,

      data: {
        audioFile: string;
      }

    ) => {


      console.log(
        "========================================"
      );

      console.log(
        "[AI IPC] Start WhisperX:"
      );

      console.log(
        "[AI IPC] Audio:",
        data.audioFile
      );

      console.log(
        "========================================"
      );


      // ======================================================
      // CHECK FILE
      // ======================================================

      if (
        !fs.existsSync(
          data.audioFile
        )
      ) {

        console.log(
          "[AI IPC] Audio not found:",
          data.audioFile
        );


        return {

          started: false,

          error:
            "Audio file not found"

        };

      }


      // ======================================================
      // CANCEL OLD PROCESS
      // ======================================================

      if (
        currentWhisper
      ) {

        console.log(
          "[AI IPC] Existing WhisperX found."
        );

        console.log(
          "[AI IPC] Cancelling old process..."
        );


        currentWhisper.cancel();


        currentWhisper =
          null;

      }


      // ======================================================
      // START WHISPERX
      // ======================================================

      currentWhisper =
        runWhisperX(

          data.audioFile,


          (result) => {


            console.log(
              "[AI IPC] Python:",
              result
            );


            // ==================================================
            // PROGRESS
            // ==================================================

            if (
              result.type ===
              "progress"
            ) {

              event.sender.send(

                "ai:progress",

                result

              );

            }


            // ==================================================
            // RESULT
            // ==================================================

            if (
              result.type ===
              "result"
            ) {

              console.log(
                "[AI IPC] RESULT FROM PYTHON:"
              );


              console.dir(
                result,
                {
                  depth: null
                }
              );


              event.sender.send(

                "lyrics-result",

                result.lyrics

              );

            }

          }

        );


      // ======================================================
      // FAILED TO START
      // ======================================================

      if (
        !currentWhisper
      ) {

        console.error(
          "[AI IPC] WhisperX failed to start."
        );


        return {

          started: false,

          error:
            "Không thể khởi động WhisperX."

        };

      }


      // ======================================================
      // RETURN
      // ======================================================

      return {

        started: true

      };

    }

  );


  // ==========================================================
  // CANCEL WHISPERX
  // ==========================================================

  ipcMain.handle(

    "ai:cancel",

    async () => {


      console.log(
        "========================================"
      );

      console.log(
        "[AI IPC] Cancel WhisperX requested"
      );


      if (
        !currentWhisper
      ) {

        console.log(
          "[AI IPC] No WhisperX process running."
        );


        console.log(
          "========================================"
        );


        return {

          success: false,

          message:
            "Không có tiến trình AI đang chạy."

        };

      }


      // ======================================================
      // CANCEL
      // ======================================================

      currentWhisper.cancel();


      // ======================================================
      // CLEAR CURRENT PROCESS
      // ======================================================

      currentWhisper =
        null;


      console.log(
        "[AI IPC] WhisperX cancelled."
      );


      console.log(
        "========================================"
      );


      return {

        success: true

      };

    }

  );

}