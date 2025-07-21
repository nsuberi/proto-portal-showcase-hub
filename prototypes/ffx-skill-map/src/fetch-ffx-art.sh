#!/usr/bin/env bash
set -euo pipefail

# 1) Define where to save everything
OUTDIR="ffx_art"
ZIPFILE="ffx_artwork.zip"
mkdir -p "$OUTDIR"

# 2) List of gallery URLs to scrape
urls=(
  "https://finalfantasy.fandom.com/wiki/Tidus/Gallery"
  "https://www.creativeuncut.com/gallery-01/ff10-tidus.html"
  "https://finalfantasy.fandom.com/wiki/Yuna/Gallery"
  "https://www.creativeuncut.com/art_final-fantasy-10_a.html"
  "https://finalfantasy.fandom.com/wiki/Lulu/Gallery"
  "https://www.creativeuncut.com/gallery-01/ff10-lulu.html"
  "https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_concept_art"
  "https://www.creativeuncut.com/gallery-01/ff10-wakka.html"
  "https://finalfantasy.fandom.com/wiki/Auron/Gallery"
  "https://www.creativeuncut.com/gallery-01/ff10-auron.html"
  "https://finalfantasy.fandom.com/wiki/Rikku/Gallery"
  "https://www.creativeuncut.com/gallery-01/ff10-rikku.html"
  "https://finalfantasy.fandom.com/wiki/Kimahri/Gallery"
  "https://www.creativeuncut.com/gallery-01/ff10-kimahri.html"
)

# 3) Crawl each page (only level‑1), grabbing images into OUTDIR
for url in "${urls[@]}"; do
  echo "→ Downloading images from $url"
  wget \
    --quiet \
    --recursive \
    --level=1 \
    --no-parent \
    --accept jpg,png \
    --adjust-extension \
    --directory-prefix="$OUTDIR" \
    "$url"
done

# 4) Zip them up
echo "→ Creating $ZIPFILE"
zip -rq "$ZIPFILE" "$OUTDIR"

echo "Done! You’ll find $ZIPFILE in your current directory."
