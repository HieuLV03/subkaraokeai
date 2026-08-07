import {
    ipcMain,
    app
} from "electron";

import fs from "node:fs";
import path from "node:path";


export interface KaraokeProject {

    id:string;

    name:string;

    audioFile:string | null;

    videoFile:string | null;

    vocalFile:string | null;

    instrumentalFile:string | null;

    lyricFile:string | null;

    outputFolder:string | null;

    duration:number;

    lyrics:any[];

    createdAt:string;

    updatedAt:string;

}




export function registerProjectIPC(){



    // ===============================
    // CREATE PROJECT
    // ===============================


    ipcMain.handle(
        "project:create",
        async (_, name:string)=>{


            const projectRoot =
                path.join(
                    app.getPath("documents"),
                    "SubKaraokeAI",
                    "Projects"
                );


            const projectFolder =
                path.join(
                    projectRoot,
                    name
                );



            const imports =
                path.join(
                    projectFolder,
                    "imports"
                );


            const cache =
                path.join(
                    projectFolder,
                    "cache"
                );


            const output =
                path.join(
                    projectFolder,
                    "output"
                );



            // tạo folder

            fs.mkdirSync(
                imports,
                {
                    recursive:true
                }
            );


            fs.mkdirSync(
                cache,
                {
                    recursive:true
                }
            );


            fs.mkdirSync(
                output,
                {
                    recursive:true
                }
            );



            const project:KaraokeProject = {


                id:
                crypto.randomUUID(),


                name,


                audioFile:null,


                videoFile:null,


                vocalFile:null,


                instrumentalFile:null,


                lyricFile:null,


                outputFolder:
                output,


                duration:0,


                lyrics:[],


                createdAt:
                new Date()
                .toISOString(),


                updatedAt:
                new Date()
                .toISOString()


            };



            const projectFile =
                path.join(
                    projectFolder,
                    "project.ska"
                );



            fs.writeFileSync(

                projectFile,

                JSON.stringify(
                    project,
                    null,
                    2
                ),

                "utf-8"

            );



            return {

                success:true,

                path:projectFile,

                project

            };


        }
    );





    // ===============================
    // SAVE PROJECT
    // ===============================


    ipcMain.handle(
        "project:save",
        async (_, data)=>{


            fs.writeFileSync(

                data.path,

                JSON.stringify(
                    data.project,
                    null,
                    2
                ),

                "utf-8"

            );


            return true;

        }
    );






    // ===============================
    // OPEN PROJECT
    // ===============================


    ipcMain.handle(
        "project:open",
        async (_, filePath:string)=>{


            const json =
                fs.readFileSync(
                    filePath,
                    "utf-8"
                );


            return JSON.parse(json);


        }
    );



}