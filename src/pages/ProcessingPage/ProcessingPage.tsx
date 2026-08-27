import {
  useEffect,
  useRef,
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useEditorStore
} from "@/stores/editor.store";

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

  // =========================================================
  // CANCEL REF
  // =========================================================

  const cancelledRef =
    useRef(false);


  // =========================================================
  // EDITOR STORE
  // =========================================================

  const play =
    useEditorStore(
      state => state.play
    );


  const setAudioFile =
    useEditorStore(
      state => state.setAudioFile
    );


  const setWorkspace =
    useEditorStore(
      state => state.setWorkspace
    );


  // =========================================================
  // NAVIGATE
  // =========================================================

  const navigate =
    useNavigate();


  // =========================================================
  // PROJECT
  // =========================================================

  const project =
    useProjectStore(
      state => state.project
    );


  const setLyrics =
    useProjectStore(
      state => state.setLyrics
    );


  // =========================================================
  // PROGRESS
  // =========================================================

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


  // =========================================================
  // CANCEL AI
  // =========================================================

  const cancelAI =
    async () => {

      console.log(
        "[Processing] Cancelling AI..."
      );


      // Đánh dấu đã hủy
      cancelledRef.current =
        true;


      try {

        await window.electronAPI.invoke(
          "ai:cancel"
        );


        console.log(
          "[Processing] AI cancelled."
        );

      }

      catch (error) {

        console.error(
          "[Processing] Cancel AI error:",
          error
        );

      }


      // Quay về trang trước
      navigate(-1);

    };


  // =========================================================
  // PROCESSING
  // =========================================================

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


    // Reset trạng thái
    cancelledRef.current =
      false;


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

          // Nếu đã hủy thì bỏ qua
          if (
            cancelledRef.current
          ) {
            return;
          }


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

          // ==================================================
          // QUAN TRỌNG
          // Nếu user đã quay về thì bỏ qua kết quả
          // ==================================================

          if (
            cancelledRef.current
          ) {

            console.log(
              "[Processing] AI result ignored because cancelled."
            );

            return;

          }


          // ================================================
          // MAP LYRICS
          // ================================================

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
          // RESET WORKSPACE VỀ LINE
          // ================================================

          setWorkspace(
            "line"
          );


          // ================================================
          // PLAY
          // ================================================

          play();


          // ================================================
          // ĐI VÀO EDITOR
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


      // ====================================================
      // Nếu ProcessingPage bị rời đi mà chưa cancel
      // thì dừng AI
      // ====================================================

      if (
        !cancelledRef.current
      ) {

        cancelledRef.current =
          true;


        window.electronAPI
          .invoke(
            "ai:cancel"
          )
          .catch(
            error => {

              console.error(
                "[Processing] Cleanup cancel error:",
                error
              );

            }
          );

      }

    };

  }, [
    project,
  ]);


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      className="processing-page"
    >

      {/* ===================================================
          BACK BUTTON
      =================================================== */}

      <button
        className="processing-back-button"
        onClick={cancelAI}
      >

        ← Quay về

      </button>


      {/* ===================================================
          PROCESSING BOX
      =================================================== */}

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