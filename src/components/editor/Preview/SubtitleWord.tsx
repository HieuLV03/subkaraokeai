"use client";

import "./Preview.css";

type Props = {
    word: any;
    currentTime: number;
    color: string;
    activeColor: string;
};

export default function SubtitleWord({

    word,
    currentTime,
    color,
    activeColor

}: Props) {

    let percent = 0;

    if (
        word.start != null &&
        word.end != null &&
        word.end > word.start
    ) {

        if (currentTime >= word.end) {

            percent = 100;

        } else if (currentTime >= word.start) {

            percent =
                ((currentTime - word.start) /
                    (word.end - word.start)) * 100;

        }

    }

    percent = Math.max(0, Math.min(100, percent));

    console.log(
        word.word,
        "start:", word.start,
        "end:", word.end,
        "time:", currentTime,
        "percent:", percent
    );

    return (

        <span className="subtitle-word">

            <span
                className="subtitle-normal"
                style={{ color }}
            >
                {word.word}&nbsp;
            </span>

            <span
                className="subtitle-fill"
                style={{
                    width: `${percent}%`,
                    color: activeColor
                }}
            >
                {word.word}&nbsp;
            </span>

        </span>

    );

}