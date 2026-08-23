import {
  app,
  BrowserWindow,
    ipcMain,

} from "electron";

import {
  autoUpdater
} from "electron-updater";

import log from "electron-log";

import {
  registerAudioIPC
} from "./ipc/audio.ipc";

import {
  registerProjectIPC
} from "./ipc/project.ipc";

import {
  registerAIIPC
} from "./ipc/ai.ipc";

import {
  registerExportIPC
} from "./ipc/export.ipc";

import {
  startMediaServer
} from "../electron/service/media.server";

import {
  registerVideoIPC
} from "./ipc/video.ipc";

import {
  fileURLToPath
} from "node:url";

import path from "node:path";


const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);


process.env.APP_ROOT =
  path.join(__dirname, "..");


export const VITE_DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL;


export const RENDERER_DIST =
  path.join(
    process.env.APP_ROOT,
    "dist"
  );


let win: BrowserWindow | null = null;


// =========================================================
// CREATE WINDOW
// =========================================================

function createWindow(): Promise<void> {

  if (win && !win.isDestroyed()) {
    return Promise.resolve();
  }

  win = new BrowserWindow({

    width: 1280,
    height: 800,

    show: false,

    webPreferences: {

      preload: path.join(
        __dirname,
        "preload.js"
      ),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: false,

    }

  });


  win.once(
    "ready-to-show",
    () => {

      win?.show();

    }
  );


  if (VITE_DEV_SERVER_URL) {

    win.loadURL(
      VITE_DEV_SERVER_URL
    );

    win.webContents.openDevTools();

  }

  else {

    win.loadFile(
      path.join(
        RENDERER_DIST,
        "index.html"
      )
    );

  }


  return new Promise<void>((resolve) => {

    if (!win) {
      resolve();
      return;
    }

    if (win.webContents.isLoading()) {

      win.webContents.once(
        "did-finish-load",
        () => {
          resolve();
        }
      );

    }
    else {

      resolve();

    }

  });

}


// =========================================================
// AUTO UPDATE - BẮT BUỘC
// =========================================================

// =========================================================
// AUTO UPDATE - BẮT BUỘC
// =========================================================
// =========================================================
// AUTO UPDATE
// =========================================================

// =========================================================
// AUTO UPDATE
// =========================================================

function sendUpdateEvent(
  channel: string,
  data?: unknown
) {

  if (!win || win.isDestroyed()) {
    log.warn(
      `[AUTO UPDATE] Cannot send event "${channel}" - window not ready`
    );

    return;
  }

  win.webContents.send(
    channel,
    data
  );

}


// =========================================================
// SETUP AUTO UPDATER
// =========================================================

function setupAutoUpdater() {

  autoUpdater.logger = log;

  // Không tự động tải.
  // Người dùng phải bấm "Cập nhật".
  autoUpdater.autoDownload = false;
autoUpdater.disableDifferentialDownload = true;
autoUpdater.disableWebInstaller = true;
  // Sau khi download xong,
  // cho phép installer chạy khi app restart.
  autoUpdater.autoInstallOnAppQuit = true;

  // Không nhận beta/prerelease.
  autoUpdater.allowPrerelease = false;


  log.info("========================================");
  log.info("[AUTO UPDATE] SETUP");
  log.info("[AUTO UPDATE] App version:", app.getVersion());
  log.info("[AUTO UPDATE] Packaged:", app.isPackaged);
  log.info(
    "[AUTO UPDATE] autoDownload:",
    autoUpdater.autoDownload
  );
  log.info("========================================");


  // =======================================================
  // CHECKING
  // =======================================================

  autoUpdater.on(
    "checking-for-update",
    () => {

      log.info(
        "[AUTO UPDATE] CHECKING FOR UPDATE..."
      );

      sendUpdateEvent(
        "update:checking"
      );

    }
  );


  // =======================================================
  // UPDATE AVAILABLE
  // =======================================================

  autoUpdater.on(
    "update-available",
    (info) => {

      log.info("========================================");

      log.info(
        "[AUTO UPDATE] UPDATE AVAILABLE"
      );

      log.info(
        "[AUTO UPDATE] Current:",
        app.getVersion()
      );

      log.info(
        "[AUTO UPDATE] New:",
        info.version
      );

      log.info(
        "[AUTO UPDATE] WAITING FOR USER..."
      );

      log.info("========================================");


      sendUpdateEvent(
        "update:available",
        {
          version: info.version,

          releaseDate:
            info.releaseDate,

          releaseNotes:
            info.releaseNotes,
        }
      );

    }
  );


  // =======================================================
  // NO UPDATE
  // =======================================================

  autoUpdater.on(
    "update-not-available",
    (info) => {

      log.info("========================================");

      log.info(
        "[AUTO UPDATE] NO UPDATE"
      );

      log.info(
        "[AUTO UPDATE] Current:",
        app.getVersion()
      );

      log.info(
        "[AUTO UPDATE] Latest:",
        info.version
      );

      log.info("========================================");


      sendUpdateEvent(
        "update:not-available",
        {
          version: info.version,
        }
      );

    }
  );


  // =======================================================
  // DOWNLOAD PROGRESS
  // =======================================================

  autoUpdater.on(
    "download-progress",
    (progress) => {

      const percent =
        Number(
          progress.percent.toFixed(1)
        );


      log.info(
        `[AUTO UPDATE] DOWNLOADING ${percent}%`
      );


      sendUpdateEvent(
        "update:progress",
        {
          percent,

          transferred:
            progress.transferred,

          total:
            progress.total,

          bytesPerSecond:
            progress.bytesPerSecond,
        }
      );

    }
  );


  // =======================================================
  // DOWNLOAD COMPLETE
  // =======================================================

  autoUpdater.on(
    "update-downloaded",
    (info) => {

      log.info("========================================");

      log.info(
        "[AUTO UPDATE] DOWNLOAD COMPLETE"
      );

      log.info(
        "[AUTO UPDATE] Version:",
        info.version
      );

      log.info(
        "[AUTO UPDATE] WAITING FOR USER RESTART"
      );

      log.info("========================================");


      sendUpdateEvent(
        "update:downloaded",
        {
          version: info.version,
        }
      );

    }
  );


  // =======================================================
  // ERROR
  // =======================================================

  autoUpdater.on(
    "error",
    (error) => {

      const message =
        error instanceof Error
          ? error.message
          : String(error);


      log.error("========================================");

      log.error(
        "[AUTO UPDATE] ERROR:",
        message
      );

      log.error("========================================");


      sendUpdateEvent(
        "update:error",
        {
          message,
        }
      );

      // Không quit app.
      // Người dùng vẫn tiếp tục sử dụng
      // phiên bản hiện tại.

    }
  );


  // =======================================================
  // USER CLICK: CẬP NHẬT
  // =======================================================

  ipcMain.handle(
    "update:download",
    async () => {

      log.info(
        "[AUTO UPDATE] USER CLICKED UPDATE"
      );


      try {

        await autoUpdater.downloadUpdate();


        log.info(
          "[AUTO UPDATE] DOWNLOAD REQUEST FINISHED"
        );


        return {
          success: true,
        };

      }
      catch (error) {

        const message =
          error instanceof Error
            ? error.message
            : String(error);


        log.error(
          "[AUTO UPDATE] DOWNLOAD FAILED:",
          message
        );


        return {
          success: false,

          error: message,
        };

      }

    }
  );


  // =======================================================
  // USER CLICK: KHỞI ĐỘNG LẠI
  // =======================================================

  ipcMain.handle(
    "update:install",
    () => {

      log.info(
        "[AUTO UPDATE] USER CLICKED RESTART & INSTALL"
      );


      autoUpdater.quitAndInstall(
        false,
        true
      );


      return {
        success: true,
      };

    }
  );

}


// =========================================================
// APP READY
// =========================================================

app.whenReady()
.then(async () => {

  log.info("========================================");

  log.info(
    "[MAIN] APP START"
  );

  log.info(
    "[MAIN] VERSION:",
    app.getVersion()
  );

  log.info(
    "[MAIN] PACKAGED:",
    app.isPackaged
  );

  log.info(
    "[MAIN] LOG FILE:",
    log.transports.file.getFile().path
  );

  log.info("========================================");


  // =======================================================
  // MEDIA SERVER
  // =======================================================

  const mediaRoot =
    process.env.APP_ROOT!;


  await startMediaServer(
    mediaRoot
  );


  // =======================================================
  // IPC
  // =======================================================

  registerAudioIPC();

  registerVideoIPC();

  registerAIIPC();

  registerProjectIPC();

  registerExportIPC();


  // =======================================================
  // DEVELOPMENT
  // =======================================================

  if (!app.isPackaged) {

    log.info(
      "[MAIN] DEVELOPMENT MODE"
    );


    createWindow();

    return;

  }


  // =======================================================
  // PRODUCTION
  // =======================================================

  log.info(
    "[MAIN] PRODUCTION MODE"
  );


  // -------------------------------------------------------
  // QUAN TRỌNG
  // -------------------------------------------------------
  // Phải tạo window TRƯỚC khi check update.
  //
  // Nếu không:
  //
  // update-available
  //        ↓
  // sendUpdateEvent()
  //        ↓
  // win === null
  //        ↓
  // React không nhận được event
  // -------------------------------------------------------
setupAutoUpdater();

await createWindow();

setTimeout(async () => {

  try {

    log.info(
      "[AUTO UPDATE] CALLING checkForUpdates()..."
    );

    await autoUpdater.checkForUpdates();

    log.info(
      "[AUTO UPDATE] checkForUpdates() FINISHED"
    );

  }
  catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    log.error(
      "[AUTO UPDATE] CHECK FAILED:",
      message
    );

    sendUpdateEvent(
      "update:error",
      {
        message,
      }
    );

  }

}, 1500);

});


// =========================================================
// WINDOW ALL CLOSED
// =========================================================

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !== "darwin"
    ) {

      app.quit();

      win = null;

    }

  }
);