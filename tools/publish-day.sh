#!/usr/bin/env bash
# Publish one day of the series: move _queue/day-NN.html to the root,
# mark it live in days.js, and turn the previous day's "Up next" strip into a link.
#
# Usage: tools/publish-day.sh [day-number] [--dry-run]
#   With no day number, the day is worked out from today's date (12 Nov = day 2 ... 19 Nov = day 9).
# The folder _queue/ starts with "_", so GitHub Pages does not serve it: queued pages stay hidden.
set -euo pipefail
cd "$(dirname "$0")/.."

N="${1:-}"
DRY=""
[ "${2:-}" = "--dry-run" ] && DRY=1
[ "${1:-}" = "--dry-run" ] && { DRY=1; N=""; }

if [ -z "$N" ]; then
  # Date in India (UTC+5:30), since the schedule is set in IST
  M=$(TZ=Asia/Kolkata date +%m); D=$(TZ=Asia/Kolkata date +%d)
  if [ "$M" != "11" ] || [ $((10#$D)) -lt 12 ] || [ $((10#$D)) -gt 19 ]; then
    echo "Not a publish day ($D/$M). Nothing to do."; exit 0
  fi
  N=$((10#$D - 10))
fi

NN=$(printf %02d "$N"); PREV=$(printf %02d $((N - 1)))
SRC="_queue/day-$NN.html"; DST="day-$NN.html"

if [ ! -f "$SRC" ]; then
  if [ -f "$DST" ]; then echo "Day $NN is already live. Nothing to do."; exit 0; fi
  echo "ERROR: $SRC is not queued, so day $NN cannot be published."; exit 1
fi

# 1. Page: drop the draft-only lines and move it to the root
sed '/<!-- DRAFT:/d; /<base href="\.\.\/">/d' "$SRC" > "$DST"
grep -q '<base href' "$DST" && { echo "ERROR: base tag still present"; exit 1; }

# 2. Hub: mark the day live
sed -i -E "s/(file: \"day-$NN.html\", live: )false, ?/\1true, /" days.js
grep -q "file: \"day-$NN.html\", live: true" days.js || { echo "ERROR: could not set live flag"; exit 1; }

# 3. Previous day: its "Up next" strip now links to this day
if [ -f "day-$PREV.html" ]; then
  sed -i "s#class=\"up-next locked\" href=\"index.html\#select\"#class=\"up-next\" href=\"day-$NN.html\"#; s#Up next · Product $NN#Next · Product $NN#" "day-$PREV.html"
fi

if [ -n "$DRY" ]; then
  echo "DRY RUN for day $NN. Changes that would be published:"
  git --no-pager diff --stat
  git --no-pager diff -- days.js "day-$PREV.html"
  head -8 "$DST"
  git checkout -- days.js "day-$PREV.html" 2>/dev/null || true
  rm -f "$DST"
  exit 0
fi

git rm -q "$SRC"
git add "$DST" days.js "day-$PREV.html"
echo "Day $NN ready to commit."
