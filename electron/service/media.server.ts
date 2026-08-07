import express from "express";
import {
  createServer
} from "node:http";

import path from "node:path";


let server:any;


export function startMediaServer(
  root:string
){

  return new Promise<number>((resolve)=>{


    const app = express();


    const importsPath =
      path.join(
        root,
        "imports"
      );


    console.log(
      "MEDIA ROOT:",
      importsPath
    );


    app.use(
      "/imports",
      express.static(
        importsPath
      )
    );


    server =
      createServer(app);



    server.listen(
      38555,
      "127.0.0.1",
      ()=>{

        console.log(
          "Media server running:"
        );

        console.log(
          "http://127.0.0.1:38555"
        );


        resolve(38555);

      }
    );


  });

}