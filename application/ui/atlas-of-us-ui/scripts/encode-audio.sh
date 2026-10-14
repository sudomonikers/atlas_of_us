#!/usr/bin/env bash
# re-encodes scene sounds in place so they stream quickly. needs ffmpeg built with AudioToolbox (macOS homebrew is)
#   scripts/encode-audio.sh bed src/personality/landfall/sounds/surf.m4a ...   looping ambience: HE-AAC 64kbps
#   scripts/encode-audio.sh shot src/personality/landfall/sounds/bell.m4a ...  one-shots: AAC-LC 96kbps
# profile 4 is HE-AAC and 1 is AAC-LC. files already at or below the target are left alone, so it's safe to run on a whole folder
set -euo pipefail

kind=$1; shift
case $kind in
  bed) args=(-c:a aac_at -profile:a 4 -b:a 64k); target=72000 ;;
  shot) args=(-c:a aac_at -profile:a 1 -b:a 96k); target=104000 ;;
  *) echo "usage: $0 bed|shot file.m4a..." >&2; exit 1 ;;
esac

for file in "$@"; do
  rate=$(ffprobe -v error -show_entries format=bit_rate -of default=nw=1:nk=1 "$file")
  if (( rate <= target )); then echo "skip $file ($((rate / 1000))kbps)"; continue; fi
  tmp="${file%.m4a}.tmp.m4a"
  ffmpeg -v error -y -i "$file" -map 0:a -map_metadata -1 "${args[@]}" -movflags +faststart "$tmp"
  echo "$file: $(du -h "$file" | cut -f1) -> $(du -h "$tmp" | cut -f1)"
  mv "$tmp" "$file"
done
