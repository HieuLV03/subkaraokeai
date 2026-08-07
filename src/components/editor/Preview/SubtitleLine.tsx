"use client";

import "./Preview.css";
import SubtitleWord from "./SubtitleWord";

export default function SubtitleLine({
    line,
    currentTime,
    color,
    activeColor
}: any) {

    if (!line?.words) {
        return null;
    }

    return (
        <div className="subtitle-line">

            {line.words.map((word: any) => (

                <SubtitleWord
                    key={word.id}
                    word={word}
                    currentTime={currentTime}
                    color={color}
                    activeColor={activeColor}
                />

            ))}

        </div>
    );
}