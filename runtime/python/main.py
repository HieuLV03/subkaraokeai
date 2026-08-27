import sys
import json

# Fix Vietnamese encoding
sys.stdout.reconfigure(
    encoding="utf-8"
)

sys.stderr.reconfigure(
    encoding="utf-8"
)


from whisperx_engine import generate_lyrics


audio_file = sys.argv[1]


lyrics = generate_lyrics(
    audio_file
)


print(
    json.dumps(
        {
            "type": "result",
            "lyrics": lyrics
        },
        ensure_ascii=False
    ),
    flush=True
)