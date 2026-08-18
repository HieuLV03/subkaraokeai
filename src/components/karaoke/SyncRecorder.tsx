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

        /*
         * =========================
         * KIỂM TRA ĐANG NHẬP TEXT
         * =========================
         */

        function isTyping(
            e: KeyboardEvent
        ) {

            const target =
                e.target as HTMLElement | null;

            if (!target) {
                return false;
            }

            return (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            );
        }


        /*
         * =========================
         * UPDATE WORD PREVIEW
         * =========================
         */

        function updatePreview() {

            if (!holding.current)
                return;

            if (!audio)
                return;

            const state =
                useLyricsStore.getState();

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word =>
                                !word.synced
                        )
                );

            if (!line)
                return;

            const word =
                line.words.find(
                    word =>
                        !word.synced
                );

            if (!word)
                return;

            state.updateWord(
                line.id,
                word.id,
                {
                    end:
                        audio.currentTime
                }
            );

            raf.current =
                requestAnimationFrame(
                    updatePreview
                );
        }


        /*
         * =========================
         * SPACE DOWN
         * =========================
         */

        function keyDown(
            e: KeyboardEvent
        ) {

            /*
             * Không phải Space
             */

            if (
                e.code !== "Space"
            ) {
                return;
            }


            /*
             * ĐANG GÕ TEXT
             *
             * → Không sync
             * → Không preventDefault
             * → Space được textarea xử lý
             */

            if (isTyping(e)) {
                return;
            }


            /*
             * Đang giữ Space
             */

            if (
                holding.current
            ) {
                return;
            }


            /*
             * Từ đây trở xuống
             * Space mới là phím Sync
             */

            e.preventDefault();


            if (!audio)
                return;


            const state =
                useLyricsStore.getState();


            /*
             * Tìm line còn word chưa sync
             */

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word =>
                                !word.synced
                        )
                );

            if (!line)
                return;


            /*
             * Tìm word tiếp theo
             */

            const word =
                line.words.find(
                    word =>
                        !word.synced
                );

            if (!word)
                return;


            /*
             * Bắt đầu giữ Space
             */

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


        /*
         * =========================
         * SPACE UP
         * =========================
         */

        function keyUp(
            e: KeyboardEvent
        ) {

            /*
             * Không phải Space
             */

            if (
                e.code !== "Space"
            ) {
                return;
            }


            /*
             * ĐANG GÕ TEXT
             *
             * → Không sync
             * → Không preventDefault
             */

            if (isTyping(e)) {
                return;
            }


            /*
             * Không có word đang sync
             */

            if (
                !holding.current
            ) {
                return;
            }


            /*
             * Kết thúc sync
             */

            e.preventDefault();


            if (!audio)
                return;


            holding.current = false;


            /*
             * Dừng requestAnimationFrame
             */

            if (raf.current) {

                cancelAnimationFrame(
                    raf.current
                );

                raf.current = null;
            }


            /*
             * Thời gian kết thúc
             */

            const end =
                audio.currentTime;


            const state =
                useLyricsStore.getState();


            /*
             * Tìm line đang sync
             */

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word =>
                                !word.synced
                        )
                );

            if (!line)
                return;


            /*
             * Tìm word đang sync
             */

            const word =
                line.words.find(
                    word =>
                        !word.synced
                );

            if (!word)
                return;


            /*
             * Lưu timing
             */

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
                    word:
                        word.word,

                    start:
                        startTime.current,

                    end
                }
            );
        }


        /*
         * =========================
         * LISTENER
         * =========================
         */

        window.addEventListener(
            "keydown",
            keyDown
        );

        window.addEventListener(
            "keyup",
            keyUp
        );


        /*
         * =========================
         * CLEANUP
         * =========================
         */

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

                raf.current = null;
            }

        };

    }, [audio]);


    return null;
}