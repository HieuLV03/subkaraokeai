import {
  app,
  BrowserWindow,
  ipcMain
} from "electron";

import {
  ensureRuntimeInstalled
} from "./ai-manager";

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


// =========================================================
// PATH
// =========================================================

const __dirname =
  path.dirname(
    fileURLToPath(import.meta.url)
  );


process.env.APP_ROOT =
  path.join(
    __dirname,
    ".."
  );


export const VITE_DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL;


export const RENDERER_DIST =
  path.join(
    process.env.APP_ROOT,
    "dist"
  );


// =========================================================
// WINDOW
// =========================================================

let win:
  BrowserWindow | null = null;


// =========================================================
// UPDATE STATE
// =========================================================

let isUpdating = false;

let updaterInitialized = false;


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


  // =======================================================
  // SHOW WINDOW
  // =======================================================

  win.once(
    "ready-to-show",
    () => {

      win?.show();

    }
  );


  // =======================================================
  // DEV
  // =======================================================

  if (VITE_DEV_SERVER_URL) {

    win.loadURL(
      VITE_DEV_SERVER_URL
    );

    win.webContents.openDevTools();

  }


  // =======================================================
  // PRODUCTION
  // =======================================================

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
// SEND UPDATE EVENT
// =========================================================

function sendUpdate(
  channel: string,
  data?: unknown
) {

  if (
    !win ||
    win.isDestroyed()
  ) {

    return;

  }


  win.webContents.send(
    channel,
    data
  );

}


// =========================================================
// AUTO UPDATER
// =========================================================

function setupAutoUpdater() {

  if (updaterInitialized) {

    return;

  }


  updaterInitialized = true;


  // =======================================================
  // LOGGER
  // =======================================================

  autoUpdater.logger =
    log;


  // =======================================================
  // CONFIG
  // =======================================================

  /*
   * QUAN TRỌNG:
   *
   * Không tự động download.
   *
   * Chỉ download khi người dùng
   * bấm nút "Cập nhật".
   */

  autoUpdater.autoDownload =
    false;


  /*
   * Không tự cài khi app đóng.
   *
   * Chúng ta sẽ chủ động
   * quitAndInstall().
   */

  autoUpdater.autoInstallOnAppQuit =
    false;


  // =======================================================
  // CHECKING
  // =======================================================

  autoUpdater.on(
    "checking-for-update",
    () => {

      log.info(
        "[AUTO UPDATE] Đang kiểm tra GitHub Releases..."
      );

      /*
       * KHÔNG gửi update:checking
       *
       * Vì chúng ta không muốn modal
       * "Đang kiểm tra cập nhật..."
       * xuất hiện trong app.
       */

    }
  );


  // =======================================================
  // UPDATE AVAILABLE
  // =======================================================

  autoUpdater.on(
    "update-available",
    (info) => {

      isUpdating = false;


      log.info(
        "[AUTO UPDATE] Có version mới:",
        info.version
      );


      /*
       * CHỈ báo cho React rằng
       * có version mới.
       *
       * KHÔNG download ở đây.
       */

      sendUpdate(
        "update:available",
        {

          version:
            info.version

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

      log.info(
        "[AUTO UPDATE] Đang dùng version mới nhất:",
        info.version
      );


      isUpdating = false;


      /*
       * Báo cho React đóng modal.
       */

      sendUpdate(
        "update:not-available"
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
        Math.round(
          progress.percent
        );


      log.info(
        `[AUTO UPDATE] Download: ${percent}%`
      );


      sendUpdate(
        "update:progress",
        {

          percent,

          message:
            "Đang tải bản cập nhật..."

        }
      );

    }
  );


  // =======================================================
  // DOWNLOAD COMPLETED
  // =======================================================

// =======================================================
// DOWNLOAD COMPLETED
// =======================================================

autoUpdater.on(
  "update-downloaded",
  (info) => {

    isUpdating = true;

    log.info(
      "[AUTO UPDATE] Đã tải xong:",
      info.version
    );

    sendUpdate(
      "update:downloaded",
      {
        version:
          info.version
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

      log.error(
        "[AUTO UPDATE] ERROR:",
        error
      );


      isUpdating = false;


      sendUpdate(
        "update:error",
        {

          message:
            error instanceof Error
              ? error.message
              : "Không thể cập nhật."

        }
      );

    }
  );

}


// =========================================================
// CHECK UPDATE
// =========================================================

async function checkForUpdate() {

  /*
   * DEV thì không check.
   */

  if (VITE_DEV_SERVER_URL) {

    log.info(
      "[AUTO UPDATE] DEV MODE - bỏ qua kiểm tra."
    );

    return;

  }


  /*
   * Kiểm tra GitHub Releases.
   */

  log.info(
    "[AUTO UPDATE] Kiểm tra GitHub Releases..."
  );


  try {

    await autoUpdater.checkForUpdates();

  }

  catch (error) {

    log.error(
      "[AUTO UPDATE] Check update error:",
      error
    );


    /*
     * Không khóa app nếu GitHub
     * không truy cập được.
     *
     * Người dùng vẫn sử dụng app bình thường.
     */

    isUpdating = false;

  }

}


// =========================================================
// USER CLICK "CẬP NHẬT"
// =========================================================

ipcMain.on(
  "update:download",
  async () => {

    if (isUpdating) {

      return;

    }


    isUpdating = true;


    log.info(
      "[AUTO UPDATE] Người dùng bấm Cập nhật."
    );


    sendUpdate(
      "update:downloading",
      {

        percent: 0,

        message:
          "Đang bắt đầu tải bản cập nhật..."

      }
    );


    try {

      await autoUpdater.downloadUpdate();

    }

    catch (error) {

      log.error(
        "[AUTO UPDATE] Download error:",
        error
      );


      isUpdating = false;


      sendUpdate(
        "update:error",
        {

          message:
            error instanceof Error
              ? error.message
              : "Không thể tải bản cập nhật."

        }
      );

    }

  }
);

ipcMain.on(
  "update:install",
  () => {

    log.info(
      "[AUTO UPDATE] Người dùng xác nhận đóng và mở lại."
    );

    autoUpdater.quitAndInstall(
      true,
      true
    );

  }
);
// =========================================================
// RETRY
// =========================================================

ipcMain.on(
  "update:retry",
  async () => {

    log.info(
      "[AUTO UPDATE] Người dùng yêu cầu thử lại."
    );


    isUpdating = false;


    await checkForUpdate();

  }
);


// =========================================================
// APP READY
// =========================================================

app.whenReady()
.then(
  async () => {

    // =====================================================
    // WINDOW
    // =====================================================

    createWindow();


    // =====================================================
    // AUTO UPDATE
    // =====================================================

    if (
      !VITE_DEV_SERVER_URL
    ) {

      setupAutoUpdater();


      /*
       * Đợi renderer load xong.
       *
       * Sau đó kiểm tra GitHub Releases.
       */

      setTimeout(
        () => {

          checkForUpdate();

        },
        2000
      );

    }


    // =====================================================
    // AI RUNTIME
    // =====================================================

    try {

      await ensureRuntimeInstalled();


      log.info(
        "[RUNTIME] Runtime READY"
      );

    }

    catch (error) {

      log.error(
        "[RUNTIME] ERROR:",
        error
      );

    }


    // =====================================================
    // MEDIA SERVER
    // =====================================================

    const mediaRoot =
      process.env.APP_ROOT!;


    await startMediaServer(
      mediaRoot
    );


    // =====================================================
    // IPC
    // =====================================================

    registerAudioIPC();

    registerVideoIPC();

    registerAIIPC();

    registerProjectIPC();

    registerExportIPC();

  }
);


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


// =========================================================
// MACOS
// =========================================================

app.on(
  "activate",
  () => {

    if (
      BrowserWindow.getAllWindows().length === 0
    ) {

      createWindow();

    }

  }
);