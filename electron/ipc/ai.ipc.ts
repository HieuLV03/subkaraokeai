import {
  ipcMain
} from "electron";


import fs from "fs";


import {
  runWhisperX
} from "../../python/spawn";



export function registerAIIPC() {


  ipcMain.handle(

    "ai:generateLyrics",

    async (

      event,

      data:{
        audioFile:string;
      }

    )=>{


      console.log(
        "Start WhisperX:",
        data.audioFile
      );



      // check file

      if(
        !fs.existsSync(
          data.audioFile
        )
      ){

        console.log(
          "Audio not found:",
          data.audioFile
        );


        return {

          started:false,

          error:"Audio file not found"

        };

      }



      runWhisperX(

        data.audioFile,


        (result)=>{


          console.log(
            "Python:",
            result
          );



          // progress

          if(
            result.type==="progress"
          ){

            event.sender.send(

              "ai:progress",

              result

            );

          }



          // finished

       if (result.type === "result") {

    console.log("RESULT FROM PYTHON:");
    console.dir(result, { depth: null });

    event.sender.send(
        "lyrics-result",
        result.lyrics
    );

}


        }


      );



      return {

        started:true

      };


    }

  );


}