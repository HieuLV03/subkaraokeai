import {
  ipcMain,
  dialog,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";


function getVideoDirectory() {

  const root =
    process.env.APP_ROOT!;

  return path.join(
    root,
    "import_videos"
  );

}


export function registerVideoIPC() {

  ipcMain.handle(
    "dialog:importVideo",
    async () => {

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


      const importDir =
        getVideoDirectory();


      await fs.mkdir(
        importDir,
        {
          recursive: true,
        }
      );


      const ext =
        path.extname(
          sourceFile
        );


      const destination =
        path.join(
          importDir,
          `${Date.now()}${ext}`
        );


      await fs.copyFile(
        sourceFile,
        destination
      );


      console.log(
        "Imported video background:",
        destination
      );


      return destination;

    }
  );

}