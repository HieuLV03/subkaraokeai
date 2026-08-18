import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";

import { importAudio } from "@/services/audio.service";
import { importVideo } from "@/services/video.service";

import { useNavigate } from "react-router-dom";

export default function HomePage() {

  const appName =
    useAppStore(
      state => state.appName
    );

  const navigate =
    useNavigate();

  const project =
    useProjectStore(
      state => state.project
    );

  const setVideoFile =
    useProjectStore(
      state => state.setVideoFile
    );

  const setAudioFile =
    useProjectStore(
      state => state.setAudioFile
    );

  const createProject =
    useProjectStore(
      state => state.createProject
    );


  // ============================================================
  // IMPORT VIDEO BACKGROUND
  // ============================================================

  const handleImportVideo = async () => {

    if (!project) return;

    const file =
      await importVideo();

    if (!file) return;

    console.log(
      "Video background:",
      file
    );

    setVideoFile(file);

  };


  // ============================================================
  // IMPORT VOCAL / SONG
  // ============================================================

  const handleImportAudio = async () => {

    if (!project) return;

    // ----------------------------------------------------------
    // BẮT BUỘC PHẢI CÓ VIDEO TRƯỚC
    // ----------------------------------------------------------

    if (!project.videoFile) {

      return;

    }


    const file =
      await importAudio();

    if (!file) return;


    console.log(
      "Vocal / Song:",
      file
    );


    setAudioFile(file);


    // ----------------------------------------------------------
    // SAU KHI CÓ VIDEO + AUDIO
    // → AI PROCESSING
    // ----------------------------------------------------------

    navigate(
      "/processing"
    );

  };


  return (

    <div className="home-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="home-header">

        <h1>
          {appName}
        </h1>

        <p>
          AI Karaoke Production System
        </p>

      </header>


      {/* ======================================================
          NO PROJECT
      ====================================================== */}

      {!project && (

        <div className="welcome">

          <button
            className="card"
            onClick={() => {

              createProject(
                "New Karaoke Project"
              );

            }}
          >
            ➕ New Project
          </button>


          <button
            className="card"
          >
            📂 Open Project
          </button>

        </div>

      )}


      {/* ======================================================
          PROJECT
      ====================================================== */}

      {project && (

        <div className="workspace">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="workspace-header">

            <h2>
              {project.name}
            </h2>

          </div>


          {/* ==================================================
              STEP INDICATOR
          ================================================== */}

          <div className="workflow">

            <div
              className={
                project.videoFile
                  ? "workflow-step completed"
                  : "workflow-step active"
              }
            >

              <strong>
                1
              </strong>

              <span>
                Video Background
              </span>

            </div>


            <div
              className={
                project.audioFile
                  ? "workflow-step completed"
                  : project.videoFile
                    ? "workflow-step active"
                    : "workflow-step disabled"
              }
            >

              <strong>
                2
              </strong>

              <span>
                Vocal / Song
              </span>

            </div>


            <div
              className="workflow-step disabled"
            >

              <strong>
                3
              </strong>

              <span>
                AI Lyrics
              </span>

            </div>


            <div
              className="workflow-step disabled"
            >

              <strong>
                4
              </strong>

              <span>
                Editor
              </span>

            </div>

          </div>


          {/* ==================================================
              PREVIEW
          ================================================== */}

          <div className="preview">

            <div className="preview-inner">

              {project.videoFile ? (

                <>
                  🎬

                  <br />

                  Video Background Ready

                  <br />

                  <small>
                    {project.videoFile}
                  </small>
                </>

              ) : (

                <>
                  1920 × 1080 Preview

                  <br />

                  <small>
                    Please import a video background
                  </small>
                </>

              )}

            </div>

          </div>


          {/* ==================================================
              WAVEFORM
          ================================================== */}

          <div className="waveform">

            {project.audioFile ? (

              <>
                🎵 Audio Imported
              </>

            ) : (

              <>
                Audio Waveform
              </>

            )}

          </div>


          {/* ==================================================
              LYRICS
          ================================================== */}

          <div className="lyrics">

            {project.audioFile
              ? "AI lyrics will be generated..."
              : "Lyrics will appear here..."
            }

          </div>


          {/* ==================================================
              TOOLBAR
          ================================================== */}

          <div className="dashboard">


            {/* =================================================
                STEP 1 — VIDEO BACKGROUND
            ================================================= */}

            <button
              className="card"
              onClick={
                handleImportVideo
              }
            >

              {project.videoFile
                ? "🔄 Change Video Background"
                : "🎬 Import Video Background"
              }

            </button>


            {/* =================================================
                STEP 2 — VOCAL / SONG
            ================================================= */}

            <button
              className="card"
              disabled={
                !project.videoFile
              }
              onClick={
                handleImportAudio
              }
            >

              {!project.videoFile
                ? "🔒 Import Vocal / Song"
                : project.audioFile
                  ? "🔄 Change Vocal / Song"
                  : "🎵 Import Vocal / Song"
              }

            </button>


          </div>


          {/* ==================================================
              FLOW MESSAGE
          ================================================== */}

          {!project.videoFile && (

            <p className="workflow-message">

              👆 Please import a video background first.

            </p>

          )}


          {project.videoFile &&
            !project.audioFile && (

            <p className="workflow-message">

              ✅ Video background ready.
              Now import the vocal/song.

            </p>

          )}


          {project.videoFile &&
            project.audioFile && (

            <p className="workflow-message">

              ✅ Video + Audio ready.
              AI processing started...

            </p>

          )}


        </div>

      )}

    </div>

  );

}