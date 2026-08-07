"use client";

import "./StylePage.css";
import { useEditorStore } from "@/stores/editor.store";

export default function StylePage() {

    const setWorkspace = useEditorStore(
        state => state.setWorkspace
    );

    return (

        <div className="style-page">

            <div className="style-content">

                <div className="style-card">

                    <h2>Style</h2>

                    <p>
                        Karaoke Style Settings
                    </p>

                </div>

                <div className="style-card">

                    <label>Font Size</label>

                    <input
                        type="range"
                        min="20"
                        max="120"
                        defaultValue="60"
                    />

                </div>

                <div className="style-card">

                    <label>Text Color</label>

                    <input
                        type="color"
                        defaultValue="#ffffff"
                    />

                </div>

                <div className="style-card">

                    <label>Highlight Color</label>

                    <input
                        type="color"
                        defaultValue="#ffd400"
                    />

                </div>

                <div className="style-card">

                    <label>Stroke Width</label>

                    <input
                        type="range"
                        min="0"
                        max="10"
                        defaultValue="3"
                    />

                </div>

                <div className="style-card">

                    <label>Position Y</label>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="80"
                    />

                </div>

            </div>

            <div className="style-footer">

                <button
                    className="style-btn"
                    onClick={() => setWorkspace("timing")}
                >
                    ← Previous
                </button>

                <button
                    className="style-btn"
                    onClick={() => setWorkspace("export")}
                >
                    Next →
                </button>

            </div>

        </div>

    );

}