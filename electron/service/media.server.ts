import express from "express";

import {
  createServer
} from "node:http";

import path from "node:path";


let server: any;


export function startMediaServer(
  root: string
) {

  return new Promise<number>((resolve) => {


    const app = express();


    // =========================================================
    // AUDIO / MEDIA
    // =========================================================

    const importsPath =
      path.join(
        root,
        "imports"
      );


    // =========================================================
    // VIDEO BACKGROUND
    // =========================================================

    const videosPath =
      path.join(
        root,
        "import_videos"
      );


    console.log(
      "MEDIA ROOT:",
      root
    );


    console.log(
      "IMPORTS PATH:",
      importsPath
    );


    console.log(
      "VIDEOS PATH:",
      videosPath
    );


    // =========================================================
    // AUDIO
    //
    // http://127.0.0.1:38555/imports/xxx.wav
    // =========================================================

    app.use(
      "/imports",
      express.static(
        importsPath
      )
    );


    // =========================================================
    // VIDEO
    //
    // http://127.0.0.1:38555/import_videos/xxx.mp4
    // =========================================================

    app.use(
      "/import_videos",
      express.static(
        videosPath
      )
    );


    // =========================================================
    // SERVER
    // =========================================================

    server =
      createServer(
        app
      );


    server.listen(
      38555,
      "127.0.0.1",
      () => {


        console.log(
          "Media server running:"
        );


        console.log(
          "http://127.0.0.1:38555"
        );


        console.log(
          "Audio:",
          "http://127.0.0.1:38555/imports/"
        );


        console.log(
          "Video:",
          "http://127.0.0.1:38555/import_videos/"
        );


        resolve(
          38555
        );

      }
    );


  });

}