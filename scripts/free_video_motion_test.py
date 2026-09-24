"""One free public Wan image-to-video test; no paid API or credentials.

Extracts an existing storyboard frame, submits a single short motion shot,
and saves only a successful video response. Does not retry quota/auth errors.
"""

import json
import mimetypes
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "free-video-test"
BASE = "https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space"
PROMPT = (
    "Cinematic documentary shot in a Zanzibar artisan furniture workshop. "
    "The two craftsmen in the starting image carefully lift the heavy reclaimed "
    "dhow-timber board a few centimeters together, move it slowly onto the sturdy "
    "workbench and settle its weight. Their hands, forearms, shoulders and torsos "
    "move naturally and in coordination. One craftsman checks the board's position "
    "with his hand. Gentle fine sawdust moves through warm sunlight. The camera "
    "makes only a subtle lateral move while real subject motion remains obvious. "
    "Preserve the exact two people, practical clothing, workshop structure and "
    "timber: old nail holes, dark grain, weathered edges, old paint marks and "
    "heavy proportions. One continuous shot, no cuts, no titles or logos. "
    "Natural physical weight, solid stable geometry, anatomically credible "
    "hands gripping the same board throughout. Premium realistic African "
    "coastal furniture craftsmanship, warm restrained color and natural motion."
)
NEGATIVE = (
    "still image, freeze frame, slideshow, only camera zoom, frozen people, "
    "no subject motion, cartoon, CGI, oversaturated, distorted hands, extra fingers, "
    "extra limbs, duplicated people, changing faces, changing clothes, melting "
    "wood, floating board, unstable furniture, industrial factory, glossy timber, "
    "random lettering, subtitles, logos, watermark, abrupt camera motion"
)


def request(url, data=None, headers=None, timeout=60):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    return urllib.request.urlopen(req, timeout=timeout)


def request_json(path, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    with request(BASE + path, data, {"Content-Type": "application/json"}) as response:
        return json.load(response)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    storyboard = ROOT / "docs" / "paje-dhow-film-storyboard-v1.png"
    frame_path = OUT / "workshop-source-frame.png"
    with Image.open(storyboard) as sheet:
        if sheet.size != (2048, 768):
            raise ValueError(f"Unexpected storyboard size: {sheet.size}")
        # Extract the already-created top-middle shot, omitting the grid gutters.
        sheet.crop((690, 0, 1360, 376)).convert("RGB").save(frame_path)
    print(f"Prepared existing workshop frame: {frame_path}", flush=True)

    boundary = "----PajeDhow" + uuid.uuid4().hex
    media = frame_path.read_bytes()
    mime = mimetypes.guess_type(frame_path.name)[0] or "image/png"
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="{frame_path.name}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8")
    multipart = header + media + f"\r\n--{boundary}--\r\n".encode("utf-8")
    with request(
        BASE + "/gradio_api/upload",
        multipart,
        {"Content-Type": f"multipart/form-data; boundary={boundary}"},
    ) as response:
        uploaded = json.load(response)
    if not isinstance(uploaded, list) or len(uploaded) != 1:
        raise RuntimeError(f"Unexpected upload response: {uploaded}")
    print("Reference uploaded to the public free demo.", flush=True)

    image_input = {
        "path": uploaded[0],
        "orig_name": frame_path.name,
        "mime_type": mime,
        "meta": {"_type": "gradio.FileData"},
    }
    settings = {
        "prompt": PROMPT,
        "negative_prompt": NEGATIVE,
        "steps": 6,
        "duration_seconds": 5.0,
        "guidance_scale": 1,
        "guidance_scale_2": 1,
        "seed": 42,
        "randomize_seed": False,
    }
    payload = {"data": [image_input, PROMPT, 6, NEGATIVE, 5.0, 1, 1, 42, False]}
    receipt = request_json("/gradio_api/call/generate_video", payload)
    event_id = receipt.get("event_id")
    if not event_id:
        raise RuntimeError(f"Generation was not queued: {receipt}")
    run_record = {"service": BASE, "event_id": event_id, "settings": settings, "status": "queued"}
    record_path = OUT / "test-run.json"
    record_path.write_text(json.dumps(run_record, indent=2), encoding="utf-8")
    print(f"Queued one 5-second real-motion test: {event_id}", flush=True)

    deadline = time.monotonic() + 600
    event_name = None
    result = None
    with request(BASE + f"/gradio_api/call/generate_video/{event_id}", timeout=60) as stream:
        for line_bytes in stream:
            if time.monotonic() > deadline:
                raise TimeoutError("Public generation queue exceeded ten minutes.")
            line = line_bytes.decode("utf-8").strip()
            if line.startswith("event:"):
                event_name = line.partition(":")[2].strip()
            elif line.startswith("data:"):
                data = json.loads(line.partition(":")[2].strip())
                if event_name == "error":
                    run_record.update(status="failed", error=data)
                    record_path.write_text(json.dumps(run_record, indent=2), encoding="utf-8")
                    raise RuntimeError(f"Free video service rejected the run: {data}")
                if event_name == "complete":
                    result = data
                    break
                print(f"Generation status: {event_name}", flush=True)

    if not result:
        raise RuntimeError("The generation stream closed without a completed result.")
    video = result[0]
    if isinstance(video, dict) and "video" in video:
        video = video["video"]
    if not isinstance(video, dict) or not video.get("url"):
        raise RuntimeError(f"No video download URL in response: {result}")
    video_path = OUT / "workshop-motion-test.mp4"
    with request(video["url"], timeout=120) as response, video_path.open("wb") as dest:
        while chunk := response.read(1024 * 1024):
            dest.write(chunk)
    run_record.update(status="completed", result=result, saved_video=str(video_path))
    record_path.write_text(json.dumps(run_record, indent=2), encoding="utf-8")
    print(f"Saved genuine motion-video test: {video_path} ({video_path.stat().st_size} bytes)", flush=True)


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as error:
        print(f"HTTP {error.code}: {error.read(4096).decode('utf-8', errors='replace')}", flush=True)
        raise SystemExit(1)
    except Exception as error:
        print(f"Stopped: {error}", flush=True)
        raise SystemExit(1)
