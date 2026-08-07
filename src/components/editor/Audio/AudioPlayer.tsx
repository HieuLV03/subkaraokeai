import { useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/stores/editor.store";
import { useProjectStore } from "@/stores/project.store";

export default function AudioPlayer() {

  const audioRef = useRef<HTMLAudioElement>(null);

  const [audioSrc, setAudioSrc] = useState("");

  const audioFile = useProjectStore(
    state => state.project?.audioFile
  );

  const playing = useEditorStore(
    state => state.playing
  );

  const currentTime = useEditorStore(
    state => state.currentTime
  );

  const playbackRate = useEditorStore(
    state => state.playbackRate
  );

  const volume = useEditorStore(
    state => state.volume
  );

  const setCurrentTime = useEditorStore(
    state => state.setCurrentTime
  );

  const setDuration = useEditorStore(
    state => state.setDuration
  );
const setAudioRef = useEditorStore(
    state => state.setAudioRef
);
  // ==========================
  // File path -> file://
  // ==========================
useEffect(()=>{

  setAudioRef(
    audioRef.current
  );


  return ()=>{

    setAudioRef(null);

  };


},[]);
  useEffect(() => {

    if (!audioFile) {

      setAudioSrc("");

      return;

    }
const filename = audioFile
  .split(/[\\/]/)
  .pop()!;

const url =
  `http://127.0.0.1:38555/imports/${filename}`;
console.log("audioFile =", audioFile);
console.log("audioSrc =", url);

setAudioSrc(url);

  }, [audioFile]);



  // ==========================
  // Loaded
  // ==========================

  useEffect(() => {

    const audio = audioRef.current;

    if (!audio) return;

    const loaded = () => {

      console.log("duration =", audio.duration);

      setDuration(audio.duration);

    };

    audio.addEventListener("loadedmetadata", loaded);

    return () => {

      audio.removeEventListener("loadedmetadata", loaded);

    };

  }, []);




  // ==========================
  // Play / Pause
  // ==========================

  useEffect(() => {

    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {

      audio.play().catch(console.error);

    } else {

      audio.pause();

    }

  }, [playing]);




  // ==========================
  // Seek
  // ==========================

  useEffect(() => {

    const audio = audioRef.current;

    if (!audio) return;

    if (

      Math.abs(audio.currentTime - currentTime)

      > 0.03

    ) {

      audio.currentTime = currentTime;

    }

  }, [currentTime]);




  // ==========================
  // Playback Rate
  // ==========================

  useEffect(() => {

    if (audioRef.current) {

      audioRef.current.playbackRate = playbackRate;

    }

  }, [playbackRate]);




  // ==========================
  // Volume
  // ==========================

  useEffect(() => {

    if (audioRef.current) {

      audioRef.current.volume = volume;

    }

  }, [volume]);




  // ==========================
  // Sync currentTime
  // ==========================

  useEffect(() => {

    const audio = audioRef.current;

    if (!audio) return;

    let raf = 0;

    const update = () => {

      setCurrentTime(audio.currentTime);

      raf = requestAnimationFrame(update);

    };

    update();

    return () => cancelAnimationFrame(raf);

  }, []);




  return (

    <audio
      ref={audioRef}
      src={audioSrc}
      preload="auto"
    />

  );

}