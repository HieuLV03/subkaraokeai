import {
  app,
  BrowserWindow
} from "electron";


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



function createWindow() {

  win = new BrowserWindow({

    width:1280,
    height:800,

    show:false,


    webPreferences:{

      preload:path.join(
        __dirname,
        "preload.js"
      ),

      contextIsolation:true,

      nodeIntegration:false,

      sandbox:false,

    }

  });



  win.once(
    "ready-to-show",
    ()=>{
      win?.show();
    }
  );



  if(VITE_DEV_SERVER_URL){

    win.loadURL(
      VITE_DEV_SERVER_URL
    );

    win.webContents.openDevTools();

  }
  else{

    win.loadFile(
      path.join(
        RENDERER_DIST,
        "index.html"
      )
    );

  }

}





app.whenReady()
.then(async()=>{


  // start localhost media server
const mediaRoot =
  process.env.APP_ROOT!;


  await startMediaServer(
    mediaRoot
  );



  registerAudioIPC();
registerVideoIPC();


  registerAIIPC();

registerProjectIPC();
registerExportIPC();

  createWindow();


});





app.on(
 "window-all-closed",
 ()=>{

  if(
    process.platform !== "darwin"
  ){

    app.quit();

    win=null;

  }

 }
);