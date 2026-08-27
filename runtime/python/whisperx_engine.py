import json
import os
import subprocess
import tempfile
import time
import sys
from pathlib import Path

import torch
import whisperx



# =========================
# UTF-8 OUTPUT WINDOWS
# =========================

sys.stdout.reconfigure(
    encoding="utf-8"
)

sys.stderr.reconfigure(
    encoding="utf-8"
)



# =========================
# PATH
# =========================

ROOT = Path(__file__).resolve().parent.parent


FFMPEG = (
    ROOT
    / "tools"
    / "ffmpeg"
    / "bin"
    / "ffmpeg.exe"
)


FFMPEG_DIR = str(
    FFMPEG.parent
)


os.environ["PATH"] = (
    FFMPEG_DIR
    + os.pathsep
    + os.environ.get("PATH", "")
)





# =========================
# PROGRESS
# =========================

def send_progress(
    progress:int,
    message:str
):

    print(
        json.dumps(
            {
                "type":"progress",
                "progress":progress,
                "message":message
            },
            ensure_ascii=False
        ),
        flush=True
    )





# =========================
# CONVERT AUDIO
# =========================

def convert_audio(
    input_file:str
):

    output_file = tempfile.mktemp(
        suffix=".wav"
    )


    print(
        "========== FFmpeg ==========",
        flush=True
    )

    print(
        "FFmpeg :",
        FFMPEG,
        flush=True
    )


    print(
        "Input :",
        input_file,
        flush=True
    )


    print(
        "Output :",
        output_file,
        flush=True
    )



    result = subprocess.run(
        [
            str(FFMPEG),

            "-y",

            "-i",
            input_file,

            "-ar",
            "16000",

            "-ac",
            "1",

            output_file
        ],

        text=True,

        capture_output=True
    )



    print(
        "Return Code:",
        result.returncode,
        flush=True
    )



    if result.stderr:

        print(
            result.stderr,
            flush=True
        )



    result.check_returncode()



    return output_file






# =========================
# WHISPERX ENGINE
# =========================

def generate_lyrics(
    audio_file:str
):


    device = (
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )



    if device=="cuda":

        model_name="large-v3"

        compute_type="float16"


    else:

        model_name="medium"

        compute_type="int8"




    print(
        "========== AI ==========",
        flush=True
    )


    print(
        "Device:",
        device,
        flush=True
    )


    print(
        "Model:",
        model_name,
        flush=True
    )


    print(
        "Compute:",
        compute_type,
        flush=True
    )





    # STEP 1

    send_progress(
        5,
        "Preparing audio..."
    )


    wav_file = convert_audio(
        audio_file
    )





    # LOAD MODEL


    send_progress(
        15,
        f"Loading AI model {model_name}"
    )



    print(
        "Loading WhisperX model...",
        flush=True
    )



    start=time.time()



    model = whisperx.load_model(

        model_name,

        device=device,

        compute_type=compute_type

    )



    print(

        f"Model loaded in {time.time()-start:.1f}s",

        flush=True

    )







    # LOAD AUDIO


    send_progress(
        25,
        "Reading audio..."
    )



    audio = whisperx.load_audio(
        wav_file
    )







    # TRANSCRIBE


    send_progress(
        35,
        "Recognizing lyrics..."
    )



    print(
        "========== STEP 1 ==========",
        flush=True
    )


    print(
        "Start Transcribe",
        flush=True
    )



    start=time.time()



    result = model.transcribe(

        audio,

        language="vi"

    )



    print(

        f"Transcribe finished in {time.time()-start:.1f}s",

        flush=True

    )



    print(

        "Detected language:",

        result["language"],

        flush=True

    )








    # ALIGN MODEL


    send_progress(
        75,
        "Loading alignment model..."
    )



    print(
        "========== STEP 2 ==========",
        flush=True
    )



    start=time.time()



    model_a, metadata = whisperx.load_align_model(

        language_code="vi",

        device=device

    )



    print(

        f"Align model loaded in {time.time()-start:.1f}s",

        flush=True

    )








    # ALIGN WORDS


    send_progress(
        85,
        "Synchronizing every word..."
    )



    print(
        "========== STEP 3 ==========",
        flush=True
    )


    print(
        "Start Word Alignment",
        flush=True
    )



    start=time.time()

    aligned = whisperx.align(

        result["segments"],

        model_a,

        metadata,

        audio,

        device

    )


    print(

        f"Alignment finished in {time.time()-start:.1f}s",

        flush=True

        )
            # =========================
    # BUILD LYRICS
    # =========================

    send_progress(
        95,
        "Building karaoke timeline..."
    )


    lyrics = []


    for line_index, segment in enumerate(
        aligned["segments"]
    ):


        text = str(
            segment.get(
                "text",
                ""
            )
        ).strip()


        if not text:
            continue



        words = []


        for word_index, word in enumerate(
            segment.get("words", [])
        ):


            words.append({

                "id":
                f"{line_index}-{word_index}",


                "word":
                word["word"],


                "start":
                float(
                    word["start"]
                ),


                "end":
                float(
                    word["end"]
                ),


                "synced":
                False

            })



        lyrics.append({

            "id":
            str(line_index),


            "text":
            text,


            "start":
            float(
                segment["start"]
            ),


            "end":
            float(
                segment["end"]
            ),


            "words":
            words

        })


    print(
        "TOTAL LYRICS:",
        len(lyrics),
        flush=True
    )


    send_progress(
        100,
        "Done"
    )


    return lyrics