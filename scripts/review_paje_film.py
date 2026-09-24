"""Inspect generated video metadata and sample actual decoded motion frames."""
import argparse
import io
import json
import re
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/paje-dhow-film-50s"
FFMPEG = ROOT / "output/media-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"


def metadata(path):
    proc = subprocess.run([str(FFMPEG), "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    info = proc.stderr
    duration = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", info)
    video = next((line.strip() for line in info.splitlines() if "Video:" in line), "")
    dims = re.search(r"\b(\d{2,5})x(\d{2,5})\b", video)
    fps = re.search(r"(\d+(?:\.\d+)?) fps", video)
    return {
        "path": str(path), "bytes": path.stat().st_size,
        "duration": sum(float(t) * m for t, m in zip(duration.groups(), [3600, 60, 1])) if duration else None,
        "width": int(dims[1]) if dims else None, "height": int(dims[2]) if dims else None,
        "fps": float(fps[1]) if fps else None, "video_stream": video,
    }


def frame(path, seconds, width=384):
    proc = subprocess.run([
        str(FFMPEG), "-hide_banner", "-loglevel", "error", "-ss", str(seconds),
        "-i", str(path), "-frames:v", "1", "-vf", f"scale={width}:-1",
        "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1",
    ], capture_output=True, check=True)
    return Image.open(io.BytesIO(proc.stdout)).convert("RGB")


def review(paths, name):
    reports = []
    rows = []
    for path in paths:
        report = metadata(path)
        reports.append(report)
        duration = report["duration"]
        times = [.15, duration * .33, duration * .66, max(.15, duration - .2)]
        row = Image.new("RGB", (1280, 218), "#efe9dd")
        draw = ImageDraw.Draw(row)
        for i, when in enumerate(times):
            still = frame(path, when, 312)
            still.thumbnail((312, 182))
            row.paste(still, (i * 320 + 4, 4))
            draw.text((i * 320 + 5, 190), f"{path.stem} | {when:.2f}s", fill="#241b14")
        rows.append(row)
        print(json.dumps(report), flush=True)
    if rows:
        sheet = Image.new("RGB", (1280, 218 * len(rows)), "#efe9dd")
        for i, row in enumerate(rows):
            sheet.paste(row, (0, i * 218))
        sheet.save(OUT / f"{name}.jpg", quality=83)
        (OUT / f"{name}.json").write_text(json.dumps(reports, indent=2), encoding="utf-8")
        print(f"Review sheet: {OUT / (name + '.jpg')}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*")
    parser.add_argument("--name", default="motion-review")
    args = parser.parse_args()
    files = sorted((OUT / "clips").glob("*.mp4"))
    if args.only:
        files = [p for p in files if p.stem in args.only]
    review(files, args.name)
