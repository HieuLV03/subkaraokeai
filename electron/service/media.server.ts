
import express from "express";

import {
  createServer
} from "node:http";

import path from "node:path";

import {
  app
} from "electron";


let server: any;


export function startMediaServer(
  root: string
) {

  return new Promise<number>((resolve) => {

    const expressApp =
      express();


    // =========================================================
    // USER DATA
    // =========================================================

    const userData =
      app.getPath("userData");


    // =========================================================
    // AUDIO
    // =========================================================

    const importsPath =
      path.join(
        userData,
        "imports"
      );


    // =========================================================
    // VIDEO
    // =========================================================

    const videosPath =
      path.join(
        userData,
        "import_videos"
      );


    // =========================================================
    // IMAGE
    // =========================================================

    const imagesPath =
      path.join(
        userData,
        "import_images"
      );


    // =========================================================
    // LOG
    // =========================================================

    console.log(
      "[Media Server] USER DATA:",
      userData
    );


    console.log(
      "[Media Server] IMPORTS PATH:",
      importsPath
    );


    console.log(
      "[Media Server] VIDEOS PATH:",
      videosPath
    );


    console.log(
      "[Media Server] IMAGES PATH:",
      imagesPath
    );


    // =========================================================
    // AUDIO
    //
    // http://127.0.0.1:38555/imports/xxx.mp3
    // =========================================================

    expressApp.use(
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

    expressApp.use(
      "/import_videos",
      express.static(
        videosPath
      )
    );


    // =========================================================
    // IMAGE
    //
    // http://127.0.0.1:38555/import_images/xxx.jpg
    // =========================================================

    expressApp.use(
      "/import_images",
      express.static(
        imagesPath
      )
    );


    // =========================================================
    // SERVER
    // =========================================================

    server =
      createServer(
        expressApp
      );


    server.listen(
      38555,
      "127.0.0.1",
      () => {

        console.log(
          "[Media Server] Running:"
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


        console.log(
          "Image:",
          "http://127.0.0.1:38555/import_images/"
        );


        resolve(
          38555
        );

      }
    );

  });

}
