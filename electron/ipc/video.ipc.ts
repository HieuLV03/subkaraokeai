import {
  app,
  dialog,
  ipcMain,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";


// ============================================================
// VIDEO DIRECTORY
// ============================================================

function getVideoDirectory() {

  return path.join(
    app.getPath("userData"),
    "import_videos"
  );

}


// ============================================================
// REGISTER VIDEO IPC
// ============================================================

export function registerVideoIPC() {

  ipcMain.handle(
    "dialog:importVideo",
    async () => {

      // --------------------------------------------------------
      // OPEN FILE DIALOG
      // --------------------------------------------------------

      const result =
        await dialog.showOpenDialog({

          title:
            "Import Video Background",

          properties: [
            "openFile",
          ],

          filters: [
            {
              name:
                "Video",

              extensions: [
                "mp4",
                "webm",
                "mov",
                "mkv",
                "avi",
              ],
            },
          ],

        });


      // --------------------------------------------------------
      // CANCEL
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // CREATE IMPORT DIRECTORY
      // --------------------------------------------------------

      const importDir =
        getVideoDirectory();


      await fs.mkdir(
        importDir,
        {
          recursive: true,
        }
      );


      // --------------------------------------------------------
      // FILE EXTENSION
      // --------------------------------------------------------

      const ext =
        path.extname(
          sourceFile
        ).toLowerCase();


      // --------------------------------------------------------
      // UNIQUE FILE NAME
      // --------------------------------------------------------

      const fileName =
        `${Date.now()}${ext}`;


      const destination =
        path.join(
          importDir,
          fileName
        );


      // --------------------------------------------------------
      // COPY VIDEO
      // --------------------------------------------------------

      await fs.copyFile(
        sourceFile,
        destination
      );


      console.log(
        "[Video IPC] Imported:",
        destination
      );


      // --------------------------------------------------------
      // RETURN FILE PATH
      // --------------------------------------------------------

      return destination;

    }
  );

}