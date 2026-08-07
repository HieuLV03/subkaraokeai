"use client";

import "./EditorPage.css";

import { useLyricsStore } from "@/stores/lyrics.store";
import { useEditorStore } from "@/stores/editor.store";

import Preview from "@/components/editor/Preview/Preview";
import AudioPlayer from "@/components/editor/Audio/AudioPlayer";
import AudioPanel from "@/components/editor/Audio/AudioPanel";
import SyncRecorder from "@/components/karaoke/SyncRecorder";

import EditLinePage from "./EditLinePage/EditLinePage";
import TimingPage from "./TimingPage/TimingPage";
import StylePage from "./StylePage/StylePage";

export default function EditorPage() {
    console.count("EditorPage render");

 const currentWorkspace = useEditorStore(
    state => state.currentWorkspace
);
    return (

        <div className="editor-page">

            {/* STEP */}

            <div className="editor-toolbar">

                <button
                    className={currentWorkspace === "line" ? "active" : ""}
                    disabled
                >
                    Edit Line
                </button>

                <button
                    className={currentWorkspace === "timing" ? "active" : ""}
                    disabled
                >
                    Timing
                </button>

                <button
                    className={currentWorkspace === "style" ? "active" : ""}
                    disabled
                >
                    Style
                </button>

                <button
                    className={currentWorkspace === "export" ? "active" : ""}
                    disabled
                >
                    Export
                </button>

            </div>

            {/* PREVIEW */}

            <div className="editor-top">

                <div className="editor-preview">

                    <Preview />

                </div>

            </div>

            {/* AUDIO */}

            <div className="editor-audio">

                <AudioPlayer />

                <SyncRecorder />

                <AudioPanel />

            </div>

            {/* WORKSPACE */}

            <div className="editor-lyrics">

                {currentWorkspace === "line" && (
                    <EditLinePage />
                )}

                {currentWorkspace === "timing" && (
                    <TimingPage />
                )}

                {currentWorkspace === "style" && (
                    <StylePage />
                )}

                {currentWorkspace === "export" && (
                    <div>
                        Export Page
                    </div>
                )}

            </div>

        </div>

    );

}