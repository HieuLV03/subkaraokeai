import {
  app,
  BrowserWindow
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

function createWindow() {

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

}


// =========================================================
// AUTO UPDATE
// =========================================================

function setupAutoUpdater() {

  autoUpdater.logger = log;


  // Không tự tải ngay khi phát hiện update
  autoUpdater.autoDownload = false;

  // Khi app thoát → cài bản đã tải
  autoUpdater.autoInstallOnAppQuit = true;


  // =======================================================
  // CHECKING
  // =======================================================

  autoUpdater.on(
    "checking-for-update",
    () => {

      log.info(
        "[AUTO UPDATE] Đang kiểm tra bản cập nhật..."
      );

    }
  );


  // =======================================================
  // UPDATE AVAILABLE
  // =======================================================

  autoUpdater.on(
    "update-available",
    (info) => {

      log.info(
        "[AUTO UPDATE] Có phiên bản mới:",
        info.version
      );


      // Tự động download
      autoUpdater.downloadUpdate();

    }
  );


  // =======================================================
  // UPDATE NOT AVAILABLE
  // =======================================================

  autoUpdater.on(
    "update-not-available",
    (info) => {

      log.info(
        "[AUTO UPDATE] Đang dùng phiên bản mới nhất:",
        info.version
      );

    }
  );


  // =======================================================
  // DOWNLOAD PROGRESS
  // =======================================================

  autoUpdater.on(
    "download-progress",
    (progress) => {

      log.info(
        `[AUTO UPDATE] Download: ${progress.percent.toFixed(1)}%`
      );

    }
  );


  // =======================================================
  // UPDATE DOWNLOADED
  // =======================================================

  autoUpdater.on(
    "update-downloaded",
    (info) => {

      log.info(
        "[AUTO UPDATE] Đã tải xong:",
        info.version
      );


      // Cài update
      // và restart app
      autoUpdater.quitAndInstall();

    }
  );


  // =======================================================
  // ERROR
  // =======================================================

  autoUpdater.on(
    "error",
    (error) => {

      log.error(
        "[AUTO UPDATE] ERROR:",
        error
      );

    }
  );

}


// =========================================================
// APP READY
// =========================================================

app.whenReady()
.then(async () => {


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
  // WINDOW
  // =======================================================

  createWindow();


  // =======================================================
  // AUTO UPDATE
  // =======================================================

  if (!VITE_DEV_SERVER_URL) {

    setupAutoUpdater();


    // Đợi app khởi động xong rồi mới check
    setTimeout(() => {

      autoUpdater.checkForUpdates();

    }, 3000);

  }

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