import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";

import { importAudio } from "@/services/audio.service";
import { importVideo } from "@/services/video.service";

import { useNavigate } from "react-router-dom";

import "./ProjectPage.css";

export default function ProjectPage() {

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


  // ============================================================
  // IMPORT VIDEO
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
  // IMPORT AUDIO
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

  };


  // ============================================================
  // START AI
  // ============================================================

  const handleStartAI = () => {

    if (!project) return;

    if (!project.videoFile) {
      return;
    }

    if (!project.audioFile) {
      return;
    }

    console.log(
      "========================================"
    );

    console.log(
      "[AI] START"
    );

    console.log(
      "[AI] Model: WhisperX Medium"
    );

    console.log(
      "[AI] Video:",
      project.videoFile
    );

    console.log(
      "[AI] Audio:",
      project.audioFile
    );

    console.log(
      "========================================"
    );


    navigate(
      "/processing"
    );

  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {

    navigate("/new-project");

  };


  // ============================================================
  // NO PROJECT
  // ============================================================

  if (!project) {

    navigate("/");

    return null;

  }


  return (

    <div className="project-page">


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
              Project
            </span>

          </div>

        </div>


        {/* CENTER */}

        <div className="home-toolbar-center">

          <button
            className="toolbar-btn active"
            onClick={
              handleBack
            }
          >
            🏠 Home
          </button>

        </div>


        {/* RIGHT */}

        <div className="home-toolbar-right">

          <button
            className="toolbar-profile-btn"
            onClick={() =>
              navigate("/profile")
            }
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
          WORKSPACE
      ====================================================== */}

      <div className="workspace">


        {/* ==================================================
            PROJECT HEADER
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


          {/* VIDEO */}

          <div
            className={
              project.videoFile
                ? "workflow-step completed"
                : "workflow-step active"
            }
          />


          {/* AUDIO */}

          <div
            className={
              project.audioFile
                ? "workflow-step completed"
                : project.videoFile
                  ? "workflow-step active"
                  : "workflow-step disabled"
            }
          />


          {/* AI */}

          <div
            className={
              project.audioFile
                ? "workflow-step active"
                : "workflow-step disabled"
            }
          />

        </div>


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        <div className="dashboard">


          {/* =================================================
              VIDEO
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
              AUDIO
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


          {/* =================================================
              START AI
          ================================================= */}

          <button
            className="card start-ai-card"
            disabled={
              !project.videoFile ||
              !project.audioFile
            }
            onClick={
              handleStartAI
            }
          >

            {!project.videoFile

              ? "🔒 Chọn Video trước"

              : !project.audioFile

                ? "🔒 Chọn Nhạc trước"

                : "🚀 Bắt đầu AI"

            }

          </button>


        </div>


        {/* ==================================================
            FLOW MESSAGE
        ================================================== */}

        {!project.videoFile && (

          <p className="workflow-message">

            👆 Bước 1: Import video background.

          </p>

        )}


        {project.videoFile &&
          !project.audioFile && (

          <p className="workflow-message">

            ✅ Video đã sẵn sàng.
            Bước 2: Import vocal/song.

          </p>

        )}


        {project.videoFile &&
          project.audioFile && (

          <p className="workflow-message">

            ✅ Video + Audio đã sẵn sàng.
            Bước 3: Bắt đầu tạo lời bài hát bằng AI.

          </p>

        )}

      </div>

    </div>

  );

}