
import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";

import { useNavigate } from "react-router-dom";

import "./NewProjectPage.css";

export default function NewProjectPage() {

  const appName =
    useAppStore(
      state => state.appName
    );

  const navigate =
    useNavigate();

  const createProject =
    useProjectStore(
      state => state.createProject
    );


  // ============================================================
  // AI KARAOKE
  // ============================================================

  const handleAIProject = () => {

    createProject(
      "New Karaoke Project"
    );

    navigate("/project");

  };


  // ============================================================
  // MANUAL KARAOKE
  // ============================================================

  const handleManualProject = () => {

    createProject(
      "New Karaoke Project"
    );

    navigate("/project/manual");

  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {

    navigate("/");

  };


  return (

    <div className="new-project-page">


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
              New Project
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
          CONTENT
      ====================================================== */}

      <div className="new-project-workspace">


        <div className="new-project-header">

          <h2>
            Create New Project
          </h2>

          <p>
            Choose how you want to create your karaoke project.
          </p>

        </div>


        {/* ==================================================
            PROJECT OPTIONS
        ================================================== */}

        <div className="project-options">


          {/* =================================================
              AI KARAOKE
          ================================================= */}

          <button
            className="project-option-card ai-option"
            onClick={
              handleAIProject
            }
          >

            <div className="project-option-icon">
              🤖
            </div>


            <div className="project-option-content">

              <h3>
                AI Karaoke
              </h3>

              <p>
                Let AI automatically generate lyrics
                and timing from your vocal or song.
              </p>

              <span className="project-option-flow">

                Import Video
                {" → "}
                Import Vocal
                {" → "}
                AI Processing
                {" → "}
                Editor

              </span>

            </div>


            <div className="project-option-arrow">
              →
            </div>

          </button>


          {/* =================================================
              MANUAL KARAOKE
          ================================================= */}

          <button
            className="project-option-card manual-option"
            onClick={
              handleManualProject
            }
          >

            <div className="project-option-icon">
              ✏️
            </div>


            <div className="project-option-content">

              <h3>
                Manual Karaoke
              </h3>

              <p>
                Skip AI processing and go directly
                to the editor. You can add and sync
                lyrics manually.
              </p>

              <span className="project-option-flow">

                Import Video
                {" → "}
                Editor

              </span>

            </div>


            <div className="project-option-arrow">
              →
            </div>

          </button>


        </div>


        {/* ==================================================
            INFORMATION
        ================================================== */}

        <div className="new-project-info">

          <p>
            💡 You can choose AI or Manual mode for each
            project.
          </p>

        </div>


      </div>

    </div>

  );

}
