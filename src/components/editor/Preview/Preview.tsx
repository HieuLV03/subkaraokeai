"use client";

import "./Preview.css";

import KaraokeCanvas from "../../karaoke/KaraokeCanvas";


export default function Preview(){

    return (

        <div className="preview">

            <div className="youtube-frame">

                <div className="video-area">

                    <KaraokeCanvas />

                </div>

            </div>

        </div>

    );

}