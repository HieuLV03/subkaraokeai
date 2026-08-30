
import {
  app,
  dialog,
  ipcMain,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";


// ============================================================
// IMAGE DIRECTORY
// ============================================================

function getImageDirectory() {

  return path.join(
    app.getPath("userData"),
    "import_images"
  );

}


// ============================================================
// REGISTER IMAGE IPC
// ============================================================

export function registerImageIPC() {

  ipcMain.handle(
    "dialog:importImage",
    async () => {

      try {

        // ------------------------------------------------------
        // OPEN FILE DIALOG
        // ------------------------------------------------------

        const result =
          await dialog.showOpenDialog({

            title:
              "Import Background Image",

            properties: [
              "openFile",
            ],

            filters: [
              {
                name:
                  "Image",

                extensions: [
                  "jpg",
                  "jpeg",
                  "png",
                  "webp",
                  "bmp",
                ],
              },
            ],

          });


        // ------------------------------------------------------
        // CANCEL
        // ------------------------------------------------------

        if (
          result.canceled
        ) {

          return null;

        }


        // ------------------------------------------------------
        // SOURCE FILE
        // ------------------------------------------------------

        const sourceFile =
          result.filePaths[0];


        if (!sourceFile) {

          return null;

        }


        // ------------------------------------------------------
        // CREATE IMPORT DIRECTORY
        // ------------------------------------------------------

        const importDir =
          getImageDirectory();


        await fs.mkdir(
          importDir,
          {
            recursive: true,
          }
        );


        // ------------------------------------------------------
        // FILE EXTENSION
        // ------------------------------------------------------

        const ext =
          path.extname(
            sourceFile
          ).toLowerCase();


        // ------------------------------------------------------
        // UNIQUE FILE NAME
        // ------------------------------------------------------

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}${ext}`;


        const destination =
          path.join(
            importDir,
            fileName
          );


        // ------------------------------------------------------
        // COPY IMAGE
        // ------------------------------------------------------

        await fs.copyFile(
          sourceFile,
          destination
        );


        // ------------------------------------------------------
        // LOG
        // ------------------------------------------------------

        console.log(
          "[Image IPC] Imported:"
        );

        console.log(
          "[Image IPC] Source:",
          sourceFile
        );

        console.log(
          "[Image IPC] Destination:",
          destination
        );


        // ------------------------------------------------------
        // RETURN FILE PATH
        // ------------------------------------------------------

        return destination;

      } catch (error) {

        console.error(
          "[Image IPC] Import failed:",
          error
        );

        return null;

      }

    }
  );

}
