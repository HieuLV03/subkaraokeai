import {
  ipcMain,
  dialog
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";

export function registerAudioIPC() {

  ipcMain.handle(
    "dialog:importAudio",
    async () => {

      const result = await dialog.showOpenDialog({

        title: "Import Audio",

        properties: ["openFile"],

        filters: [
          {
            name: "Audio",
            extensions: [
              "mp3",
              "wav",
              "m4a",
              "flac"
            ]
          }
        ]

      });

      if (result.canceled) {
        return null;
      }

      const sourceFile = result.filePaths[0];

      // ROOT của project
      const root = process.env.APP_ROOT!;

      // SubKaraokeAI/imports
      const importDir = path.join(
        root,
        "imports"
      );

      await fs.mkdir(
        importDir,
        {
          recursive: true
        }
      );

      const ext = path.extname(
        sourceFile
      );

      const destination = path.join(
        importDir,
        `${Date.now()}${ext}`
      );

      await fs.copyFile(
        sourceFile,
        destination
      );

      console.log(
        "Imported:",
        destination
      );

      return destination;

    }

  );

}