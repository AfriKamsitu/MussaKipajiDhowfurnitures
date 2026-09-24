"""Build enhanced web deliveries from original moving clips; no paid services.

The 1080p/720p deliveries are upscaled from 832x480, with motion-interpolated
24 fps from 16 fps. The 18-second film contains 13 seconds of generated footage
and a 5-second typographic ending, NOT 18 seconds of newly generated footage.
Original clips and the previous public preview are left untouched.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "output/paje-dhow-film-50s/web-edit-v2"
PUBLIC = ROOT / "public/videos"
CLIPS = ROOT / "output/paje-dhow-film-50s/clips"
FFMPEG = ROOT / "output/media-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
FONT = "public/fonts/alibaba-sans/AlibabaSans-Regular.otf"
MEDIUM = "public/fonts/alibaba-sans/AlibabaSans-Medium.otf"
ENCODE = ["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-threads", "4", "-movflags", "+faststart", "-an"]


def run(*args):
    subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "warning", "-nostdin", "-y", *map(str, args)], cwd=ROOT, check=True)


def render():
    WORK.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    segments = []
    for name, duration in [("coast", 5), ("carry", 5), ("join_leg", 3)]:
        target = WORK / f"{name}-1080.mp4"
        print(f"Rendering {name}: preserve original timing, interpolate motion to 24 fps, upscale delivery.", flush=True)
        filters = (
            f"crop=832:468:0:6,trim=duration={duration},setpts=PTS-STARTPTS,"
            "tpad=stop_mode=clone:stop_duration=0.25,"
            "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
            f"trim=duration={duration},setpts=PTS-STARTPTS,"
            "scale=1920:1080:flags=lanczos,unsharp=5:5:0.2:5:5:0,setsar=1"
        )
        run("-i", CLIPS / f"{name}.mp4", "-vf", filters, *ENCODE, target)
        segments.append(target)

    hero = PUBLIC / "paje-dhow-hero-v2-1080.mp4"
    inputs = [part for segment in segments for part in ("-i", segment)]
    run(*inputs, "-filter_complex", "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]", "-map", "[v]", *ENCODE, hero)
    run("-i", hero, "-vf", "scale=1280:720:flags=lanczos", *ENCODE, PUBLIC / "paje-dhow-hero-v2-720.mp4")

    ending = WORK / "brand-ending.mp4"
    text_filters = [
        f"drawtext=fontfile={MEDIUM}:text='PAJE DHOW FURNITURE':fontcolor=0xc5a274:fontsize=38:x=(w-tw)/2:y=300",
        "drawbox=x=876:y=397:w=168:h=2:color=0xc5a274:t=fill",
        f"drawtext=fontfile={FONT}:text='Furniture with a seafaring soul.':fontcolor=0xf1eee6:fontsize=72:x=(w-tw)/2:y=480",
        f"drawtext=fontfile={FONT}:text='Made on the Swahili Coast. Built to Endure.':fontcolor=0xf1eee6:fontsize=34:x=(w-tw)/2:y=612",
        f"drawtext=fontfile={MEDIUM}:text='ZANZIBAR  /  RECLAIMED DHOW TIMBER':fontcolor=0xc5a274:fontsize=23:x=(w-tw)/2:y=755",
        "fade=t=in:st=0:d=0.4:color=0x111713",
        "fade=t=out:st=4.6:d=0.4:color=0x111713",
    ]
    print("Rendering five-second brand ending with Alibaba Sans.", flush=True)
    run("-f", "lavfi", "-i", "color=c=0x111713:s=1920x1080:r=24:d=5", "-vf", ",".join(text_filters), *ENCODE, ending)
    film = PUBLIC / "paje-dhow-film-v2-1080.mp4"
    run("-i", hero, "-i", ending, "-filter_complex", "[0:v]fade=t=out:st=12.65:d=0.35:color=0x111713[footage];[footage][1:v]concat=n=2:v=1:a=0[v]", "-map", "[v]", *ENCODE,
        "-metadata", "title=Paje Dhow Furniture - From the dhow to the home",
        "-metadata", "comment=AI-generated concept. 13s moving footage plus 5s brand ending. Upscaled from 832x480; motion-interpolated from 16 to 24 fps. Silent.", film)
    run("-i", film, "-vf", "scale=1280:720:flags=lanczos", *ENCODE, PUBLIC / "paje-dhow-film-v2-720.mp4")
    run("-ss", "7", "-i", hero, "-frames:v", "1", "-q:v", "2", "-update", "1", PUBLIC / "paje-dhow-poster-v2.jpg")
    report = {
        "source": {"width": 832, "height": 480, "fps": 16},
        "deliveries": {"desktop": "1920x1080", "mobile": "1280x720", "fps": 24},
        "processing": "16:9 crop; motion interpolation per shot; Lanczos upscale; light sharpening; H.264 CRF17; faststart",
        "hero_seconds": 13, "film_seconds": 18, "new_generated_footage_seconds": 0,
        "ending_seconds": 5, "native_hd": False, "audio": False,
        "files": [{"path": str(p.relative_to(ROOT)), "bytes": p.stat().st_size} for p in sorted(PUBLIC.glob("*v2*.mp4"))],
    }
    (WORK / "render-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    render()
