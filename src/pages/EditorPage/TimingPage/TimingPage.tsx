"use client";
import { useEditorStore } from "@/stores/editor.store";
import { useLyricsStore } from "@/stores/lyrics.store";
import "./TimingPage.css";

export default function TimingPage() {
        console.count("TimingPage render");

    const resetAllTiming = useLyricsStore(
    state => state.resetAllTiming
);

const resetLastTiming = useLyricsStore(
    state => state.resetLastTiming
);
const setWorkspace = useEditorStore(
    state => state.setWorkspace
);
    const lyrics = useLyricsStore(
        state => state.lyrics
    );

    const updateLine = useLyricsStore(
        state => state.updateLine
    );

    const updateWord = useLyricsStore(
        state => state.updateWord
    );

  return (

    <div className="timing-page">

        <div className="timing-content">

            {

                lyrics.map(line => (

                    <div
                        key={line.id}
                        className="timing-line"
                    >

                        {/* LINE */}

                        <div className="timing-line-title">

                            {line.text}

                        </div>

                        {/* LINE TIME */}

                        <div className="timing-line-time">

                            <label>

                                Start

                                <input
                                    type="number"
                                    step="0.001"
                                    value={line.start}
                                    onChange={e => {

                                        updateLine(

                                            line.id,

                                            {

                                                start: Number(
                                                    e.target.value
                                                )

                                            }

                                        );

                                    }}
                                />

                            </label>

                            <label>

                                End

                                <input
                                    type="number"
                                    step="0.001"
                                    value={line.end}
                                    onChange={e => {

                                        updateLine(

                                            line.id,

                                            {

                                                end: Number(
                                                    e.target.value
                                                )

                                            }

                                        );

                                    }}
                                />

                            </label>

                            <span>

                                Duration :

                                {

                                    (
                                        line.end -
                                        line.start
                                    ).toFixed(3)

                                }

                                s

                            </span>

                        </div>

                        {/* WORD */}

                        <div className="timing-words">

                            {

                                line.words.map(word => (

                                    <div
                                        key={word.id}
                                        className="timing-word"
                                    >

                                        <div className="word-text">

                                            {word.word}

                                        </div>

                                        <input
                                            type="number"
                                            step="0.001"
                                            value={word.start}
                                            onChange={e => {

                                                updateWord(

                                                    line.id,

                                                    word.id,

                                                    {

                                                        start: Number(
                                                            e.target.value
                                                        )

                                                    }

                                                );

                                            }}
                                        />

                                        <input
                                            type="number"
                                            step="0.001"
                                            value={word.end}
                                            onChange={e => {

                                                updateWord(

                                                    line.id,

                                                    word.id,

                                                    {

                                                        end: Number(
                                                            e.target.value
                                                        )

                                                    }

                                                );

                                            }}
                                        />

                                        <span
                                            className={
                                                word.synced
                                                    ? "synced"
                                                    : "unsynced"
                                            }
                                        >

                                            {

                                                word.synced
                                                    ? "✓"
                                                    : "○"

                                            }

                                        </span>

                                    </div>

                                ))

                            }

                        </div>

                    </div>

                ))

            }

        </div>

     <div className="timing-footer">

    <button
        className="timing-btn"
        onClick={() => setWorkspace("line")}
    >
        ← Previous
    </button>


    <div className="timing-actions">

        <button
            className="timing-btn reset"
            onClick={() => {
                resetLastTiming();
            }}
        >
            Reset Last
        </button>


        <button
            className="timing-btn reset-all"
            onClick={() => {
                resetAllTiming();
            }}
        >
            Reset All
        </button>


        <button
            className="timing-btn"
            onClick={() => setWorkspace("style")}
        >
            Next →
        </button>

    </div>

</div>
    </div>

);

}