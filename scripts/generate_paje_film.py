"""Resumable, sequential free Wan video generation for the Paje Dhow film.

Uses the already-created storyboard and the user's product photograph as
image-to-video inputs. No paid key, account rotation or quota retries.
"""
import argparse
import json
import mimetypes
import shutil
import time
import urllib.error
import uuid
from pathlib import Path

from PIL import Image, ImageDraw
from free_video_motion_test import BASE, NEGATIVE, request, request_json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "paje-dhow-film-50s"
STYLE = (
    " Photorealistic premium Zanzibar furniture brand film, warm restrained "
    "natural sunlight, earthy aged timber and cream. Preserve the input image's "
    "people, clothing, architecture and furniture construction. Reclaimed dhow "
    "wood keeps old nail holes, cracks, joinery scars, dark marks and weathered "
    "grain. Never glossy or factory made. Real physical motion, stable solid "
    "geometry, credible hands and tool contact. One continuous shot, no cuts, "
    "no text or logos, no invented lettering. Slow deliberate cinematic camera."
)

# Prioritize establishing a coherent moving sequence, then individual inserts.
SHOTS = [
    ("coast", "coast", 5.0, "Gentle waves repeatedly wash onto the Zanzibar sand and withdraw. The wooden dhow rocks subtly in the water, its rope and sail edge stir in the breeze. Palm fronds move naturally. Very slow low lateral tracking shot past the weathered blue-painted dhow timbers in the foreground. Keep the foreground timber texture sharp; actual water and foliage movement, not a still photograph."),
    ("join_leg", "joint", 3.0, "Extreme close-up of these same skilled craftsman's hands carefully pushing the heavy square reclaimed-wood leg into its matching mortise joint. One hand supports the leg, the other presses the substantial timber rail into alignment. The two wooden parts seat together firmly a few millimeters. Hands then check the seam. Preserve the thick square proportions and old wood scars."),
    ("oil", "oil", 5.0, "The craftsman moves his cloth in slow overlapping strokes along the thick WOODEN BORDER of the glass-center coffee table, spreading natural oil on the reclaimed timber, not on the glass. His forearm, elbow and upper body move naturally. Oil subtly deepens the grain but stays matte, with nail holes and old scars visible. The thick table frame and transparent inset glass remain completely rigid. Subtle workshop dust in sunlight."),
    ("living", "villa", 5.0, "A slow cinematic dolly glide through this Zanzibar villa living room. Genuine three-dimensional parallax around the heavy glass-center reclaimed-wood coffee table between cream-cushion wooden sofas. Tropical leaves sway softly in the sea breeze and linen curtains flutter. Keep the coffee table, thick wooden legs, glass center and wine rack unchanged. Furniture remains the hero, with the Indian Ocean secondary."),
    ("closing_hero", "hero", 5.0, "A deliberate premium cinematic camera push toward this massive reclaimed dhow-timber coffee table. Rigid clear glass center, four substantial square legs, compartmented drawer and age-marked wooden surround stay identical. Natural breeze gently stirs the background palms and cream linen. Real spatial parallax around the table, not a flat zoom. Warm golden side light, calmer softly focused background, furniture hero. No people, no lettering."),
    ("select", "workshop", 5.0, "The two craftsmen hold this same heavy weathered dhow board at the workbench. The man in the light shirt supports its weight with both hands while the man in the charcoal shirt slides his right palm slowly along an old joinery scar, inspecting the grain. They carefully tilt the board a few degrees to inspect the surface, then rest it firmly on the bench. Small natural shifts of hands, shoulders and posture. Preserve the two faces and practical clothes."),
    ("measure_mark", "joint", 3.0, "Close-up of the same dark-skinned craftsman's hands measuring a square joint on this thick reclaimed timber. A short steel carpenter's square is held firmly against the timber edge; the other hand uses a short dark pencil to draw a single precise line beside the square. Small deliberate hand movements, realistic grip, pencil touches wood throughout the marking stroke. Old nail holes and aged grain remain visible. Camera holds steady on the hands."),
    ("cut", "workshop_detail", 3.0, "Macro close-up of a professional craftsman's hands carefully cutting a small reclaimed-wood joinery shoulder with a sharp hand saw at a sturdy Zanzibar workbench. The timber is clamped securely, the supporting hand stays well away from the cutting edge. The saw makes two short controlled strokes with a small stream of fine sawdust. Keep the aged wood thick and substantial. Camera tight on the tool and timber, no face change, no industrial factory."),
    ("plane", "joint", 3.0, "Macro close-up of the skilled craftsman's two hands pushing a traditional wooden hand plane along the flat upper face of this heavy reclaimed timber rail. One short deliberate forward stroke, a thin wood shaving curls out ahead of the plane. Hands grip the same tool firmly, plane sole stays in contact with the wood. The old nail holes and dark scars remain. Slow controlled natural motion, stable table geometry."),
    ("sand", "joint", 3.0, "Macro shot of the same craftsman's hand wrapping a small sheet of sandpaper around a wooden sanding block and making three short back-and-forth sanding strokes along the thick timber joint edge. His other hand braces the rail. Tiny realistic wood dust falls below, with no sparks or exaggerated dust cloud. Preserve the old scars, nail holes and matte weathered surface; only the touch edge is smoothed."),
    ("fit_glass", "oil", 3.0, "The same Zanzibari craftsman carefully grips the near edge of the rigid rectangular transparent glass insert with both hands, lifts the near edge just a centimeter, aligns it and gently seats it onto the prepared recessed supports within the thick reclaimed-wood coffee table surround. The glass panel remains one rigid rectangle, no bending or morphing. Slow careful hand and forearm movement; wood frame and glass dimensions remain identical. No cloth, no wiping."),
    ("wine_compartments", "wine_workshop", 3.0, "Close view of the rustic reclaimed-timber wine rack in the Zanzibar workshop. A craftsman's dark-skinned hand enters from the right and gently seats one thick wooden horizontal bottle-storage divider into its matching slot, then presses its edge to check alignment. Keep the rack's simple open bottle compartments, small drawers and shelves solid and unchanged. Aged nail holes, cracks, matte grain; one natural careful assembly action."),
    ("inspect", "oil", 4.0, "The craftsman stops wiping, rests the cloth on the far wooden corner, then runs his fingertips carefully along the near wood-and-glass seam and checks the corner joint alignment. He leans in slightly and then straightens with quiet professional satisfaction. Keep the original glass-center coffee table, massive timber frame, drawers, wine rack, workshop and craftsman's appearance unchanged. Natural body and hand motion, tactile aged grain in warm light."),
    ("wine_rack", "wine_villa", 4.0, "Premium slow three-dimensional camera slide past this handcrafted reclaimed dhow-wood wine rack against the warm Swahili lime-plastered wall. Keep open wooden bottle compartments, simple shelves and small drawers. Tropical plant leaves gently sway in the breeze; natural window light moves subtly across aged grain. Wine rack remains straight and solid, no changing number of compartments. No people, no glossy finish."),
    ("dining_veranda", "dining", 4.0, "A slow smooth dolly toward the substantial reclaimed dhow-wood dining table and handcrafted timber chairs in the open-air Zanzibar villa. Palm fronds sway outside, linen moves softly and the ocean glimmers subtly through the opening. Preserve the thick timber tabletop, aged edges and heavy chair construction. Bench and cream-cushion wooden lounge furniture remain in surrounding space. Natural spatial parallax, warm restrained sunlight, furniture hero."),
    ("bed", "bed", 3.0, "A premium cinematic slow lateral dolly around this exact authentic reclaimed dhow-wood bed. Preserve the thick posts, pegged through-tenon joints, slatted plank footboard, irregular crisscross reclaimed-timber headboard and ochre patterned mattress. Very light breeze gently moves the cushion fabric edge. Realistic spatial parallax reveals aged wood nail holes and dark marks; no construction or pattern changes. Warm Zanzibar lime-plaster bedroom, matte timber, no people."),
    ("armchair", "armchair", 3.0, "Slow premium cinematic camera arc around this exact authentic reclaimed dhow-wood armchair. Preserve the irregular organic curved wooden arms, broad weathered legs, old cracks and holes, sculptural boat-timber frame and thick natural cream cushions. Gentle breeze makes a cushion fabric corner move slightly. Real spatial parallax, never deform the chair. Warm lime-plaster Zanzibar interior, soft natural sunlight, no people."),
    ("historic_timber", "timber", 3.0, "Macro cinematic tracking shot across the weathered reclaimed dhow timber in the foreground: old blue paint, nail holes, dark marks, small stable cracks and uneven grain. Keep timber completely solid and unchanged. Behind it the ocean waves continuously wash in and withdraw; a few grains of sand shift naturally in the breeze. Low shallow focus camera movement with actual background water motion, no text."),
]


def prepare():
    (OUT / "sources").mkdir(parents=True, exist_ok=True)
    (OUT / "clips").mkdir(exist_ok=True)
    (OUT / "receipts").mkdir(exist_ok=True)
    with Image.open(ROOT / "docs/paje-dhow-film-storyboard-v1.png") as im:
        boxes = {
            "coast": (4, 4, 676, 376), "workshop": (690, 4, 1360, 376),
            "joint": (1375, 4, 2044, 376), "oil": (4, 392, 676, 764),
            "villa": (690, 392, 1360, 764), "hero": (1375, 392, 2044, 764),
            "timber": (4, 145, 550, 375),
            "workshop_detail": (790, 135, 1357, 374),
            "wine_workshop": (355, 394, 674, 660),
            "wine_villa": (693, 394, 1035, 682),
            "dining": (953, 394, 1357, 678),
        }
        for key, box in boxes.items():
            im.crop(box).convert("RGB").save(OUT / "sources" / f"{key}.png")
    photo = Path(r"C:\Users\lenovo\AppData\Local\Temp\codex-clipboard-2d2989f7-47eb-4d9c-ad51-c995827ad420.png")
    with Image.open(photo) as im:
        w, h = im.size
        im.crop((4, 4, int(w * .476), h - 4)).convert("RGB").save(OUT / "sources/bed.png")
        im.crop((int(w * .524), 4, w - 4, h - 4)).convert("RGB").save(OUT / "sources/armchair.png")
    test = ROOT / "output/free-video-test/workshop-motion-test.mp4"
    if not (OUT / "clips/carry.mp4").exists():
        shutil.copy2(test, OUT / "clips/carry.mp4")
    panels = sorted((OUT / "sources").glob("*.png"))
    sheet = Image.new("RGB", (1000, ((len(panels) + 3) // 4) * 172), "#efe9dd")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(panels):
        with Image.open(path) as im:
            im.thumbnail((242, 140))
            x, y = (index % 4) * 250, (index // 4) * 172
            sheet.paste(im, (x + 4, y + 4))
            draw.text((x + 5, y + 146), path.stem, fill="#2b251e")
    sheet.save(OUT / "source-review.jpg", quality=85)
    manifest = [{"id": s[0], "source": s[1], "duration": s[2], "prompt": s[3] + STYLE} for s in SHOTS]
    (OUT / "generation-plan.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Prepared {len(panels)} existing reference crops. No new still images generated.", flush=True)


def upload(path):
    boundary = "----PajeDhow" + uuid.uuid4().hex
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    head = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"files\"; filename=\"{path.name}\"\r\nContent-Type: {mime}\r\n\r\n").encode()
    body = head + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    with request(BASE + "/gradio_api/upload", body, {"Content-Type": f"multipart/form-data; boundary={boundary}"}) as response:
        result = json.load(response)
    if not isinstance(result, list) or len(result) != 1:
        raise RuntimeError(f"Unexpected upload result: {result}")
    return {"path": result[0], "orig_name": path.name, "mime_type": mime, "meta": {"_type": "gradio.FileData"}}


def generate(shot, index):
    name, source, duration, prompt = shot
    target = OUT / "clips" / f"{name}.mp4"
    if target.exists() and target.stat().st_size > 10000:
        print(f"Already complete: {name}", flush=True)
        return
    receipt_path = OUT / "receipts" / f"{name}.json"
    if receipt_path.exists():
        prior = json.loads(receipt_path.read_text(encoding="utf-8"))
        raise RuntimeError(f"Existing unfinished or failed run for {name}: {prior.get('status')}. Inspect before any resubmission.")
    image_input = upload(OUT / "sources" / f"{source}.png")
    seed = 42 + index
    payload = {"data": [image_input, prompt + STYLE, 6, NEGATIVE, duration, 1, 1, seed, False]}
    receipt = request_json("/gradio_api/call/generate_video", payload)
    event_id = receipt.get("event_id")
    if not event_id:
        raise RuntimeError(f"Generation not queued: {receipt}")
    record = {"id": name, "service": BASE, "event_id": event_id, "status": "queued", "source": source, "settings": payload["data"][1:]}
    receipt_path.write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(f"Queued {name}: {duration}s, event {event_id}", flush=True)
    result, event, deadline = None, None, time.monotonic() + 600
    try:
        with request(BASE + f"/gradio_api/call/generate_video/{event_id}", timeout=60) as stream:
            for raw in stream:
                if time.monotonic() > deadline:
                    raise TimeoutError("Free generation queue exceeded ten minutes.")
                line = raw.decode("utf-8").strip()
                if line.startswith("event:"):
                    event = line.partition(":")[2].strip()
                elif line.startswith("data:"):
                    data = json.loads(line.partition(":")[2].strip())
                    if event == "error":
                        raise RuntimeError(f"Free service returned an error: {data}")
                    if event == "complete":
                        result = data
                        break
                    print(f"{name}: {event}", flush=True)
        if not result:
            raise RuntimeError("Stream closed without completion; do not resubmit blindly.")
        video = result[0]
        if isinstance(video, dict) and "video" in video:
            video = video["video"]
        if not isinstance(video, dict) or not video.get("url"):
            raise RuntimeError(f"No completed video: {result}")
        record.update(status="generated", result=result)
        receipt_path.write_text(json.dumps(record, indent=2), encoding="utf-8")
        with request(video["url"], timeout=120) as response, target.open("wb") as dest:
            while chunk := response.read(1024 * 1024):
                dest.write(chunk)
        record.update(status="completed", saved_video=str(target), bytes=target.stat().st_size)
        receipt_path.write_text(json.dumps(record, indent=2), encoding="utf-8")
        print(f"SAVED {name}: {target.stat().st_size:,} bytes", flush=True)
    except Exception as error:
        record.update(status="stopped", error=str(error))
        receipt_path.write_text(json.dumps(record, indent=2), encoding="utf-8")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--only", nargs="*")
    args = parser.parse_args()
    try:
        prepare()
        if not args.prepare:
            for i, item in enumerate(SHOTS):
                if args.only and item[0] not in args.only:
                    continue
                generate(item, i)
            print("Requested video generation batch completed.", flush=True)
    except urllib.error.HTTPError as error:
        print(f"STOPPED without retry: HTTP {error.code}: {error.read(4096).decode(errors='replace')}", flush=True)
        raise SystemExit(1)
    except Exception as error:
        print(f"STOPPED without retry: {error}", flush=True)
        raise SystemExit(1)
