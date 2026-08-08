import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";
import { importAudio } from "@/services/audio.service";
import { useNavigate } from "react-router-dom";
export default function HomePage() {
  const appName = useAppStore((state) => state.appName);
const navigate = useNavigate();
  const project = useProjectStore((state) => state.project);
const setAudioFile = useProjectStore(
  state => state.setAudioFile
);
  const createProject = useProjectStore(
    (state) => state.createProject
  );

  return (
    <div className="home-page">

      <header className="home-header">
        <h1>{appName}</h1>

        <p>
          AI Karaoke Production System
        </p>
      </header>

      {/* Chưa có project */}

   {!project && (
  <div className="welcome">

    <button
      className="card"
      onClick={() => {
        createProject("New Karaoke Project");
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
      {/* Đã có project */}

      {project && (
        <div className="workspace">

          <div className="workspace-header">

            <h2>
              {project.name}
            </h2>

          </div>

          {/* Preview */}

          <div className="preview">

            <div className="preview-inner">

              1920 × 1080 Preview

            </div>

          </div>

          {/* Waveform */}

          <div className="waveform">

            Audio Waveform

          </div>

          {/* Lyrics */}

          <div className="lyrics">

            Lyrics will appear here...

          </div>

          {/* Toolbar */}

          <div className="dashboard">

 <button
  className="card"
  onClick={async () => {

    const file = await importAudio();

    if (!file) return;


    setAudioFile(file);


    navigate("/processing");

  }}
>
  🎵 Import Song
</button>
          </div>

        </div>
      )}

    </div>
  );
}