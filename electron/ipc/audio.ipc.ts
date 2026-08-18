import {
  app,
  ipcMain,
  dialog,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";


export function registerAudioIPC() {

  ipcMain.handle(
    "dialog:importAudio",
    async () => {

      const result =
        await dialog.showOpenDialog({

          title:
            "Import Audio",

          properties: [
            "openFile",
          ],

          filters: [
            {
              name:
                "Audio",

              extensions: [
                "mp3",
                "wav",
                "m4a",
                "flac",
              ],
            },
          ],

        });


      if (
        result.canceled
      ) {

        return null;

      }


      const sourceFile =
        result.filePaths[0];


      if (!sourceFile) {

        return null;

      }


      // ============================================================
      // USER DATA
      // ============================================================

      const importDir =
        path.join(
          app.getPath("userData"),
          "imports"
        );


      // ============================================================
      // CREATE DIRECTORY
      // ============================================================

      await fs.mkdir(
        importDir,
        {
          recursive: true,
        }
      );


      // ============================================================
      // EXTENSION
      // ============================================================

      const ext =
        path.extname(
          sourceFile
        ).toLowerCase();


      // ============================================================
      // DESTINATION
      // ============================================================

      const destination =
        path.join(
          importDir,
          `${Date.now()}${ext}`
        );


      // ============================================================
      // COPY
      // ============================================================

      await fs.copyFile(
        sourceFile,
        destination
      );


      console.log(
        "[Audio IPC] Imported:",
        destination
      );


      return destination;

    }
  );

}