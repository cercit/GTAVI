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

# Dry run: work on throwaway copies so nothing in the repo can be left changed,
# even if the script is interrupted.
if [ -n "$DRY" ]; then
  T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
  sed '/<!-- DRAFT:/d; /<base href="\.\.\/">/d' "$SRC" > "$T/$DST"
  cp days.js "$T/days.js"
  sed -i -E "s/(file: \"day-$NN.html\", live: )false, ?/\1true, /" "$T/days.js"
  echo "DRY RUN for day $NN (nothing in the repo is changed):"
  grep -q '<base href' "$T/$DST" && echo "  ERROR: base tag still present" || echo "  page ok: draft lines removed"
  grep -q "file: \"day-$NN.html\", live: true" "$T/days.js" && echo "  hub ok: day $NN would be marked live" || echo "  ERROR: live flag not set"
  if [ -f "day-$PREV.html" ]; then
    grep -q 'class="up-next locked" href="index.html#select"' "day-$PREV.html" && echo "  day $PREV ok: its Up next strip would link to day $NN" || echo "  note: day $PREV has no locked Up next strip"
  else
    echo "  note: day $PREV is not live yet, so its strip will be linked when it is"
  fi
  exit 0
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
  git add "day-$PREV.html"
fi

git rm -q "$SRC"
git add "$DST" days.js
echo "Day $NN ready to commit."
