# PA-30 Performance Calculator

An interactive, offline-capable performance calculator for the Piper PA-30 Twin
Comanche (standard configuration, 3600 lb max gross weight, no tip tanks),
built by digitizing the scanned performance charts from the aircraft's POH.

This exists because [wificfi.com's PA-30 "performance calculator"](https://www.wificfi.com/post/performance-calculator-pa-30)
turned out to be nothing more than the same scanned POH chart images shown
below, with no API and no interactivity — just pictures you read by eye. This
project digitizes those same charts into one small, dependency-free web app
you can actually type numbers into.

## ⚠️ Safety disclaimer — read this

**Simulation / training use only. Not valid for real-world flight dispatch.**

Every number this tool produces was derived by *manually, visually* tracing
curves off scanned chart images (see `reference/`), then fitting simple
interpolation/extrapolation models to those readings. That process is
approximate: each ladder-chart (takeoff/landing distance) model was checked
against the worked example printed on its own chart and lands within roughly
3–13% of the chart's own answer — see the per-chart notes below. This is good
enough for flight-sim practice and procedure training. It is **not** certified
performance data, and it must never be used to plan or dispatch an actual
flight. Always cross-check against the real, current, aircraft-specific POH
(the actual airplane's numbers can differ from a generic PA-30's) before any
real flight.

## How to use it

No build step, no server, no account, no internet connection required.

1. Download or clone this folder.
2. Double-click `index.html` (or open it from your browser's File > Open).
3. Enter pressure altitude, OAT, weight, wind, cruise power, fuel, and
   (optionally) loaded C.G., and the outputs update live.

It also works as an installable app — see **Install on iPhone** below.

## What's in this repo

```
index.html         The app shell (markup only)
style.css          All styling (light/dark aware, responsive)
app.js             Calculation engine + UI wiring
data.js            All digitized chart data, embedded as a JS object
                    (index.html loads this directly — see "Why data.js
                    duplicates data/*.json" below)
manifest.json       PWA manifest (installable home-screen app)
sw.js               Service worker for offline caching (no-ops on file://)
icon-192.png / icon-512.png / apple-touch-icon.png   App icons
data/*.json         The same datasets as plain, human-readable JSON —
                    edit these if you want to hand-correct a value
reference/*.png     The 13 original scanned POH chart pages this tool
                    was digitized from, for comparison
```

## How the numbers are computed

Two source figures (5-11 Vx/Vy, 5-09/5-10 rate of climb, 5-12 TAS, 5-13
range, 5-14 endurance) are plain 2-variable curve families, each digitized
as a straight line between a sea-level value and a value at a second
reference point (16,000 ft for cruise charts, the chart's own ceiling for
climb charts), linearly interpolated/extrapolated between the given curves
(e.g. between the 3200 lb and 3600 lb weight curves).

The five **"ladder" charts** (Fig 5-06, 5-07, 5-08, 5-15, 5-16 — takeoff
ground run, takeoff distance over 50 ft, accelerate-stop, landing ground
roll, landing distance over 50 ft) are Piper's classic 3-panel nomographs:
read a base value off an altitude/temperature curve, then walk it through a
weight-correction curve, then a wind-correction curve. Rather than digitizing
all three panels as literal curve families (which the overlapping thin lines
in a scanned 1970s chart make quite error-prone to trace precisely), each
chart was modeled as:

```
value = baseValue(pressureAltitude, OAT)
       × (weight / 3600) ^ weightExponent
       × (1 − windK × headwindMph)         [or a steeper penalty for tailwind]
```

where `baseValue` is a straight line from the chart's 0°F value to its value
at the chart's right-hand border (empirically ≈120°F on this chart family),
per pressure-altitude curve, linearly interpolated between altitudes. The
`weightExponent` and `windK` constants were fit so the model reproduces the
worked example printed directly on each chart (the dashed A→B→C→D→E→F line).
This is a deliberate simplification, documented here so it can be improved
later — see `data/*.json` → `exampleCheck` for each chart's own calibration
point.

### Per-chart digitization confidence

| Figure | Chart | Self-check vs. printed example | Confidence |
|---|---|---|---|
| 5-06 | Takeoff ground run | computed 1045 ft vs. chart 1100 ft (−5.0%) | Good |
| 5-07 | Takeoff distance, 50 ft obstacle | computed 2250 ft vs. chart 2350 ft (−4.3%) | Good |
| 5-08 | Accelerate-stop distance | computed 2185 ft vs. chart 2500 ft (−12.6%) | Fair — largest error of the five; worth a manual re-check against `reference/fig5-08-accelerate-stop.png` if this number matters to you |
| 5-15 | Landing ground roll | computed 540 ft vs. chart 520 ft (+3.8%) | Good |
| 5-16 | Landing distance, 50 ft obstacle | computed 1690 ft vs. chart 1750 ft (−3.4%) | Good |
| 5-09 | Multi-engine rate of climb | not independently verifiable (no worked example on this chart) | Approximate — 2-point linear fit per weight curve |
| 5-10 | Single-engine rate of climb | same as above | Approximate |
| 5-11 | Vx/Vy vs density altitude | same as above | Approximate |
| 5-12 | True airspeed vs DA | same as above | Approximate |
| 5-13 | Range profile | same as above; basic-fuel (84 gal) curves only — tip-tank curves on the shared chart were ignored | Approximate |
| 5-14 | Endurance profile | same as above; basic-fuel only | Approximate |
| 6-01 | C.G. envelope | polygon vertices read directly off the chart's own gridlines (no curve-fitting involved) | Good |
| 5-17 | Power setting table | transcribed directly, cell by cell, from the printed table (not a curve — exact, not an approximation) | Exact transcription |

Re-run the self-check anytime by opening the browser console after loading
`index.html` — `app.js` logs a one-line summary per ladder chart on load.

### Why `data.js` duplicates `data/*.json`

Browsers block `fetch()` of local files from a `file://` page (a CORS
restriction), so `index.html` can't simply `fetch('data/fig5-06....json')`
when opened by double-click with no server. `data.js` embeds the exact same
content as a plain JS object so the app works with zero server. The
`data/*.json` files are kept as the easy-to-read/edit canonical copies — if
you hand-correct a digitized value there, make the same edit in `data.js`.

## Install on iPhone

The local `file://` copy can't be installed as a home-screen app — iOS
Safari's "Add to Home Screen" PWA install only works for a page served over
real `http://`/`https://`, not a file opened from disk. Once you've hosted it
somewhere (see below):

1. Open the site's URL in **Safari** on your iPhone (must be Safari, not
   Chrome/other browsers — only Safari exposes the install option on iOS).
2. Tap the **Share** button (square with an arrow).
3. Tap **Add to Home Screen**.

It'll then open full-screen with its own icon, and `sw.js` caches the app
shell so it keeps working with no signal after the first load.

## Hosting it for free (optional)

Any static-file host works since there's no server-side code at all:

- **GitHub Pages** — push this folder to a GitHub repo, enable Pages on the
  `main` branch in repo Settings, done.
- **Netlify** or **Cloudflare Pages** — drag-and-drop this folder onto their
  web dashboard (Netlify Drop / Cloudflare Pages direct upload); both have a
  free tier and need no account-linked repo if you just want a quick URL.

## Data source

Piper PA-30 Twin Comanche Pilot's Operating Handbook, Section 5
(Performance) and Section 6 (Weight & Balance), standard configuration
(3600 lb max gross weight, no tip tanks). Scanned chart images are in
`reference/` for direct comparison against the digitized model.
