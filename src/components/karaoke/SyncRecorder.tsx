"use client";

import { useEffect, useRef } from "react";

import { useEditorStore } from "@/stores/editor.store";
import { useLyricsStore } from "@/stores/lyrics.store";

export default function SyncRecorder() {

    const audio =
        useEditorStore(
            state => state.audioRef
        );

    const holding =
        useRef(false);

    const raf =
        useRef<number | null>(null);

    const startTime =
        useRef(0);

    useEffect(() => {

        function updatePreview() {

            if (!holding.current) return;

            if (!audio) return;

            const state =
                useLyricsStore.getState();

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word => !word.synced
                        )
                );

            if (!line) return;

            const word =
                line.words.find(
                    word => !word.synced
                );

            if (!word) return;

            state.updateWord(
                line.id,
                word.id,
                {
                    end: audio.currentTime
                }
            );

            raf.current =
                requestAnimationFrame(
                    updatePreview
                );

        }

        function keyDown(
            e: KeyboardEvent
        ) {

            if (
                e.code !== "Space"
            )
                return;

            if (
                holding.current
            )
                return;

            e.preventDefault();

            if (!audio)
                return;

            const state =
                useLyricsStore.getState();

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word => !word.synced
                        )
                );

            if (!line)
                return;

            const word =
                line.words.find(
                    word => !word.synced
                );

            if (!word)
                return;

            holding.current = true;

            startTime.current =
                audio.currentTime;

            state.updateWord(
                line.id,
                word.id,
                {
                    start:
                        startTime.current,

                    end:
                        startTime.current,

                    synced: false
                }
            );

            updatePreview();

            console.log(
                "SYNC START",
                word.word,
                startTime.current
            );

        }

        function keyUp(
            e: KeyboardEvent
        ) {

            if (
                e.code !== "Space"
            )
                return;

            if (
                !holding.current
            )
                return;

            e.preventDefault();

            if (!audio)
                return;

            holding.current = false;

            if (raf.current) {

                cancelAnimationFrame(
                    raf.current
                );

                raf.current = null;

            }

            const end =
                audio.currentTime;

            const state =
                useLyricsStore.getState();

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word => !word.synced
                        )
                );

            if (!line)
                return;

            const word =
                line.words.find(
                    word => !word.synced
                );

            if (!word)
                return;

            state.updateWord(
                line.id,
                word.id,
                {
                    start:
                        startTime.current,

                    end,

                    synced: true
                }
            );

            console.log(
                "SYNC END",
                {
                    word: word.word,
                    start:
                        startTime.current,
                    end
                }
            );

        }

        window.addEventListener(
            "keydown",
            keyDown
        );

        window.addEventListener(
            "keyup",
            keyUp
        );

        return () => {

            window.removeEventListener(
                "keydown",
                keyDown
            );

            window.removeEventListener(
                "keyup",
                keyUp
            );

            if (raf.current) {

                cancelAnimationFrame(
                    raf.current
                );

            }

        };

    }, [audio]);

    return null;

}