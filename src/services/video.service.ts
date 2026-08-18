import { ipc } from "./ipc.service";


// ============================================================
// IMPORT VIDEO
// ============================================================

export async function importVideo() {

  return ipc.invoke<string | undefined>(
    "dialog:importVideo"
  );

}


// ============================================================
// EXTRACT AUDIO
// ============================================================

export async function extractAudioFromVideo(
  videoFile: string
) {

  return ipc.invoke<{
    audioFile?: string;
    error?: string;
  }>(
    "video:extractAudio",
    videoFile
  );

}