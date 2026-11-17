#!/usr/bin/env bash
# makes the spoken digits Competing Voices plays (src/physical/competing_voices), into public/voices, with Amazon Polly's
# neural voices: the digits one to nine but seven from Matthew, the voice to follow, and from Joanna and Gregory, who
# talk over him, and Matthew saying "This is the voice to follow." Each is trimmed of silence and set to -20 dB RMS, so
# the test sets their levels against each other exactly. Needs the aws cli signed in and ffmpeg
#   scripts/make-voices.sh
set -euo pipefail

out=public/voices
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$out"

trim="silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"

# says a line in a voice, into public/voices/<name>.mp3
say() {
  local voice=$1 text=$2 name=$3
  aws polly synthesize-speech --region us-east-1 --engine neural --voice-id "$voice" --output-format mp3 --sample-rate 24000 \
    --text "$text" "$tmp/raw.mp3" >/dev/null
  ffmpeg -v error -y -i "$tmp/raw.mp3" -af "$trim" -ac 1 -ar 24000 "$tmp/trimmed.wav"
  local mean
  mean=$(ffmpeg -i "$tmp/trimmed.wav" -af volumedetect -f null - 2>&1 | sed -n 's/.*mean_volume: \(-*[0-9.]*\) dB/\1/p')
  ffmpeg -v error -y -i "$tmp/trimmed.wav" -af "volume=$(echo "-20 - ($mean)" | bc -l)dB" -c:a libmp3lame -b:a 48k "$out/$name.mp3"
  echo "$out/$name.mp3"
}

words=(one two three four five six seven eight nine)
for voice in Matthew Joanna Gregory; do
  for d in 1 2 3 4 5 6 8 9; do
    say "$voice" "${words[d - 1]}." "$(echo "$voice" | tr 'A-Z' 'a-z')-$d"
  done
done
say Matthew "This is the voice to follow." matthew-follow
