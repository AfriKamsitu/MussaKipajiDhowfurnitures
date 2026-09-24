"""Prepare/review references and explicitly resume the unfinished free film.

Use --generate only when free generation access is available. A stopped job is
never silently resubmitted. --retry-failed preserves its receipt and is intended
only after the cause has been diagnosed or the provider's allowance has reset.
"""
import argparse
import json
from pathlib import Path
from PIL import Image
import generate_paje_film as film


def prepare():
    film.prepare()
    # Visual review found the original wine-villa crop pointed at the sofa.
    # This corrected crop contains the wine rack, plant and dining context.
    with Image.open(film.ROOT / "docs/paje-dhow-film-storyboard-v1.png") as sheet:
        sheet.crop((983, 392, 1348, 644)).convert("RGB").save(film.OUT / "sources/wine_villa.png")
    print("Applied visually reviewed wine-rack source crop.", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--only", nargs="*")
    parser.add_argument("--retry-failed", action="store_true")
    args = parser.parse_args()
    prepare()
    if not args.generate:
        print("References prepared; no generation submitted.", flush=True)
        return
    for index, shot in enumerate(film.SHOTS):
        name = shot[0]
        if args.only and name not in args.only:
            continue
        receipt = film.OUT / "receipts" / f"{name}.json"
        completed = film.OUT / "clips" / f"{name}.mp4"
        if args.retry_failed and receipt.exists() and not completed.exists():
            record = json.loads(receipt.read_text(encoding="utf-8"))
            if record.get("status") != "stopped":
                raise RuntimeError(f"{name}: previous run is not a confirmed stopped run.")
            attempt = 1
            backup = receipt.with_name(f"{name}.stopped-attempt-{attempt}.json")
            while backup.exists():
                attempt += 1
                backup = receipt.with_name(f"{name}.stopped-attempt-{attempt}.json")
            receipt.rename(backup)
            print(f"Preserved previous stopped receipt: {backup.name}", flush=True)
        film.generate(shot, index)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"STOPPED; no automatic retry: {error}", flush=True)
        raise SystemExit(1)
