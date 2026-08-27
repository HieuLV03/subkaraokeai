import json

def send(progress,message):

    print(

        json.dumps({

            "type":"progress",

            "progress":progress,

            "message":message

        }),

        flush=True

    )