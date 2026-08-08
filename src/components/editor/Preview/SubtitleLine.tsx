"use client";

import "./Preview.css";
import SubtitleWord from "./SubtitleWord";

import { useLyricsStore } from "@/stores/lyrics.store";

export default function SubtitleLine({
    line,
    currentTime,
    color,
    activeColor,
}: any) {

    const selectLine = useLyricsStore(
        (state) => state.selectLine
    );

    const moveLine = useLyricsStore(
        (state) => state.moveLine
    );

    const selectedLineId = useLyricsStore(
        (state) => state.selectedLineId
    );


    if (!line?.words) {
        return null;
    }


    const style = line.style ?? {};

    const isSelected =
        selectedLineId === line.id;


    /*
     * Vị trí riêng của line
     */
    const x = style.x ?? 100;
    const y = style.y ?? 150;


    // ==========================
    // DRAG
    // ==========================

    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {

        e.preventDefault();
        e.stopPropagation();


        selectLine(line.id);


        const startMouseX =
            e.clientX;

        const startMouseY =
            e.clientY;


        const startX = x;
        const startY = y;


        const handleMouseMove = (
            event: MouseEvent
        ) => {

            const deltaX =
                event.clientX -
                startMouseX;

            const deltaY =
                event.clientY -
                startMouseY;


            moveLine(
                line.id,

                startX + deltaX,

                startY + deltaY
            );
        };


        const handleMouseUp = () => {

            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            window.removeEventListener(
                "mouseup",
                handleMouseUp
            );
        };


        window.addEventListener(
            "mousemove",
            handleMouseMove
        );

        window.addEventListener(
            "mouseup",
            handleMouseUp
        );

    };


    return (

        <div
            className={
                isSelected
                    ? "subtitle-drag-box subtitle-drag-box-selected"
                    : "subtitle-drag-box"
            }

            onMouseDown={
                handleMouseDown
            }

            style={{
                position: "relative",

                display: "inline-block",

                transform:
                    `translate(${x}px, ${y}px)`,

                cursor: "move",

                /*
                 * Chỉ chính wrapper nhận chuột.
                 */
                pointerEvents: "auto",

                userSelect: "none",

                zIndex: 10,
            }}
        >

            <div
                className="subtitle-line"
            >

                {line.words.map(
                    (word: any) => (

                        <SubtitleWord
                            key={word.id}

                            word={word}

                            currentTime={
                                currentTime
                            }

                            color={color}

                            activeColor={
                                activeColor
                            }
                        />

                    )
                )}

            </div>

        </div>

    );
}