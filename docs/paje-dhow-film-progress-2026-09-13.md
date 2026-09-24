# Paje Dhow Furniture — motion production progress

This progress note supersedes the older preproduction status in the 50-second brief. The requested full film is **not complete**.

## Completed and verified

- Genuine image-to-video generation through the free public Wan 2.2 demo, with no paid API or credits.
- Three moving shots: Zanzibar coast and dhow (5.0625 seconds), two craftsmen handling reclaimed timber (5.0625 seconds), and hands checking a heavy timber joint (3.0625 seconds).
- Decoded frame sequences were visually reviewed. The coast has changing waves and the craftsmen move their hands and bodies; these are not still-image pans.
- A **13.000-second silent preview** was assembled at 832 × 468, 16 fps, 16:9, H.264 MP4. This is not 4K and was not upscaled.
- Preview: `../output/paje-dhow-film-50s/paje-dhow-motion-preview.mp4`.
- Individual original clips and run receipts remain in `../output/paje-dhow-film-50s/clips/` and `receipts/`.

## Current blocker

The next shot, natural-oil finishing, returned an empty error from the public generation API. A single retry through the demo's normal web interface also returned `Error` with no detailed explanation. No further generation attempts were made after that check. The cause is **not conclusively diagnosed**.

The provider documents 2 minutes of daily GPU time without authentication and 5 minutes for a free signed-in account, resetting 24 hours after first GPU usage. This makes the anonymous allowance a possible cause, but the error did not confirm it. Do not represent quota exhaustion as a proven diagnosis.

- Demo: https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster
- Official allowance documentation: https://huggingface.co/docs/hub/en/spaces-zerogpu#usage-tiers

Next user-dependent step: sign in to a free Hugging Face account in the browser. Recheck the available free allowance and service state before attempting the remaining shots. Do not buy credits, use paid generation, rotate accounts or proxies, or claim that signing in guarantees a fix.

## Remaining production

The 50-second timing, all detailed craftsmanship actions, oil finishing, finished-furniture range, villa lifestyle, closing coffee-table shot, exact two closing messages, Alibaba Sans typography, sound and requested 4K delivery remain unfinished. Do not pad the three completed shots with still-image animation or duplicate loops to claim a complete film.

The user's bed and armchair photograph and the six-panel generated storyboard are prepared as input crops. The wine-villa crop in the first generator was found to point at the sofa; the continuation wrapper corrects it before future generation. Run the wrapper, not the original generator, for future batches:

```powershell
& 'C:\Users\lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/continue_paje_film.py
```

This command prepares references only. `--generate` explicitly submits pending shots. Existing stopped receipts prevent blind resubmission. `--retry-failed` must only be used after the cause has been addressed or the provider's allowance has reset; it preserves the previous receipt as an attempt record.

Scripts:

- `scripts/free_video_motion_test.py`: successful first test and public API helpers.
- `scripts/generate_paje_film.py`: sequential generator and per-shot prompts.
- `scripts/continue_paje_film.py`: safe continuation wrapper and corrected wine-rack crop.
- `scripts/review_paje_film.py`: metadata checks and decoded motion contact sheets.

All synthetic scenes must be described as AI-generated imagery, not documentary evidence of real Paje Dhow installations or actual workshop activity.
