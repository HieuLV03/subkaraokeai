import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useEditorStore } from "@/stores/editor.store";

import {
  generateLyrics,
  onAIProgress,
  onAICompleted,
} from "@/services/ai.service";

import {
  useProjectStore,
} from "@/stores/project.store";

import {
  useAppStore,
} from "@/stores/app.store";


export default function ProcessingPage() {

  const play =
    useEditorStore(
      state => state.play
    );


  const setAudioFile =
    useEditorStore(
      state => state.setAudioFile
    );


  const navigate =
    useNavigate();


  const project =
    useProjectStore(
      state => state.project
    );


  const setLyrics =
    useProjectStore(
      state => state.setLyrics
    );


  const progress =
    useAppStore(
      state => state.progress
    );


  const message =
    useAppStore(
      state => state.progressMessage
    );


  const setProgress =
    useAppStore(
      state => state.setProgress
    );


  useEffect(() => {

    if (!project) return;


    const audioFile =
      project.audioFile;


    if (!audioFile) {

      setProgress(
        0,
        "No audio file found."
      );

      return;

    }


    console.log(
      "AI audio:",
      audioFile
    );


    // ======================================================
    // AI PROGRESS
    // ======================================================

    const unsubscribeProgress =
      onAIProgress(
        event => {

          setProgress(
            event.progress,
            event.message
          );

        }
      );


    // ======================================================
    // AI COMPLETED
    // ======================================================

    const unsubscribeCompleted =
      onAICompleted(
        lyrics => {


          const mappedLyrics =
            lyrics.map(
              line => ({

                id:
                  crypto.randomUUID(),

                start:
                  line.start,

                end:
                  line.end,

                text:
                  line.text,

                words:
                  line.words.map(
                    word => ({

                      id:
                        crypto.randomUUID(),

                      text:
                        word.word,

                      start:
                        word.start,

                      end:
                        word.end,

                    })
                  ),

              })
            );


          // ================================================
          // SAVE LYRICS
          // ================================================

          setLyrics(
            mappedLyrics
          );


          // ================================================
          // SET AUDIO
          // ================================================

          setAudioFile(
            audioFile
          );


          // ================================================
          // PLAY
          // ================================================

          play();


          // ================================================
          // EDITOR
          // ================================================

          navigate(
            "/editor"
          );

        }
      );


    // ======================================================
    // START WHISPERX
    // ======================================================

    generateLyrics({

      audioFile,

    });


    // ======================================================
    // CLEANUP
    // ======================================================

    return () => {

      unsubscribeProgress();

      unsubscribeCompleted();

    };

  }, [
    project,
  ]);


  return (

    <div
      className="processing-page"
    >

      <div
        className="processing-box"
      >

        <h1>
          AI Processing
        </h1>


        <p>
          {message}
        </p>


        <div
          className="progress-bar"
        >

          <div
            className="progress-fill"
            style={{
              width:
                `${progress}%`,
            }}
          />

        </div>


        <h2>
          {progress}%
        </h2>


        <p>
          Please wait while AI
          analyzes your song...
        </p>

      </div>

    </div>

  );

}