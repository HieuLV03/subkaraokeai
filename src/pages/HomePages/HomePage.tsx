import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";
import { importAudio } from "@/services/audio.service";
import { importVideo } from "@/services/video.service";

import { useNavigate } from "react-router-dom";

import "./HomePage.css";

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

    navigate(
      "/processing"
    );

  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {

    navigate(-1);

  };


  return (

    <div className="home-page">


      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="home-toolbar">

        {/* LEFT */}

        <div className="home-toolbar-left">

          <button
            className="toolbar-back"
            onClick={
              handleBack
            }
          >
            ←
          </button>


          <div className="toolbar-title">

            <strong>
              {appName}
            </strong>

            <span>
              Home
            </span>

          </div>

        </div>


        {/* CENTER */}

        <div className="home-toolbar-center">

          <button
            className="toolbar-btn active"
            onClick={() =>
              navigate("/")
            }
          >
            🏠 Home
          </button>


          {project && (

            <>

              <button
                className="toolbar-btn"
                onClick={
                  handleImportVideo
                }
              >
                🎬 Video
              </button>


              <button
                className="toolbar-btn"
                disabled={
                  !project.videoFile
                }
                onClick={
                  handleImportAudio
                }
              >
                🎵 Audio
              </button>

            </>

          )}

        </div>


        {/* RIGHT */}

        <div className="home-toolbar-right">


<button
    className="toolbar-profile-btn"
    onClick={() => {
        console.log("PROFILE CLICK");

        navigate("/profile");
    }}
>
    <span className="toolbar-profile-icon">
        👤
    </span>

    <span className="toolbar-profile-text">
        Profile
    </span>
</button>

        </div>

      </div>



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
            />

            <div
              className={
                project.audioFile
                  ? "workflow-step completed"
                  : project.videoFile
                    ? "workflow-step active"
                    : "workflow-step disabled"
              }
            />

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
              DASHBOARD
          ================================================== */}

          <div className="dashboard">


            {/* =================================================
                STEP 1
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
                STEP 2
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