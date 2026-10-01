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
approximate: each ladder-chart (takeoff/landing distance) model is checked
against the worked example printed on its own chart and, as of the latest
re-verification pass, lands within 0.06% of the chart's own answer at that
example point — see the per-chart notes below for what's independently
verified versus best-effort. This is good enough for flight-sim practice and
procedure training. It is **not** certified performance data, and it must
never be used to plan or dispatch an actual flight. Always cross-check against
the real, current, aircraft-specific POH (the actual airplane's numbers can
differ from a generic PA-30's) before any real flight. The bundled airport
database (see below) is likewise a static reference snapshot, not live NOTAMs
— always verify runway/field data against current charts.

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
airports.js         Bundled offline airport database (10,110 airports),
                    embedded as a JS object for the same file:// reason
runways.js          Bundled offline runway-ends database (22,113 runway
                    ends across 8,231 airports), same reason
navaids.js          Bundled offline VOR/NDB database (10,399 entries),
                    same reason
fixes.js            Bundled offline 5-letter RNAV/GPS fix database
                    (65,388 fixes, from the FAA, not OurAirports)
manifest.json       PWA manifest (installable home-screen app)
sw.js               Service worker for offline caching (no-ops on file://)
icon-192.png / icon-512.png / apple-touch-icon.png   App icons
data/*.json         The same datasets as plain, human-readable JSON —
                    edit these if you want to hand-correct a value
reference/*.png     The 13 original scanned POH chart pages this tool
                    was digitized from, for comparison
cloudflare-worker/  The CORS proxy that fetches live METAR/winds-aloft
metar-proxy.js       (see "Airport lookup" below) — not deployed as part
                    of this static site, lives separately on Cloudflare
scripts/            Data pipeline(s) -- refresh_data.py rebuilds all
refresh_data.py       four bundled datasets above from their live
                    sources (see "Data source" below)
.github/workflows/  Scheduled automation
refresh-data.yml      Runs refresh_data.py monthly and auto-commits any
                    changes -- see "Data source" below
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

As of 2026-10-01, every chart has been re-measured pixel-by-pixel against its
source scan in `reference/`, following a full re-verification pass that found
two systematic errors in the original digitization: **every one of the five
ladder charts' printed worked examples actually uses a 30 mph headwind, not
the 10 mph originally assumed** (confirmed by direct pixel measurement — point
F sits on the chart's own "30" gridline in all five cases), and several
charts' pressure-altitude/OAT/weight example inputs were also misread (e.g.
fig 5-15's example is at 4000 ft/70°F, not the originally assumed 6000 ft/65°F).
All five ladder charts now reproduce their own chart's worked example to
within 0.06%.

| Figure | Chart | Self-check vs. printed example | Confidence |
|---|---|---|---|
| 5-06 | Takeoff ground run | computed 850 ft vs. chart 850 ft (−0.01%) | Good at the example point (PA=6000 ft). An earlier pass used the wrong right-axis calibration and an unverified example condition (assumed 65°F/3100 lb/10 mph instead of the real 65°F/3000 lb/30 mph headwind) — both now corrected. 0/2000/4000/8000 ft curves unverified, see `unverifiedAltitudes` |
| 5-07 | Takeoff distance, 50 ft obstacle | computed 2318 ft vs. chart 2318 ft (0.00%) | Good at the example point (PA=6000 ft). An earlier automated trace misidentified which curve point A/B sit on; re-measured from scratch at the correct conditions (70°F/3200 lb/30 mph headwind, not 65°F/3100 lb/10 mph). 0/2000/4000/8000 ft curves unverified |
| 5-08 | Accelerate-stop distance | computed 2050 ft vs. chart 2050 ft (0.01%) | Good at the example point (PA=6000 ft). Original digitization had a 6000 ft altitude curve off by ~9x in slope, a misread chart target, *and* wrong example conditions (actual: 70°F/3200 lb/30 mph headwind) — all corrected. 0/2000/4000/8000 ft curves unverified |
| 5-15 | Landing ground roll | computed 525 ft vs. chart 525 ft (0.06%) | Good at the example point (PA=4000 ft, not the originally assumed 6000 ft). Weight (3100 lb) confirmed correct; wind corrected 10→30 mph. 0/2000/6000/8000 ft curves unverified |
| 5-16 | Landing distance, 50 ft obstacle | computed 1701 ft vs. chart 1700 ft (0.06%) | Good at the example point (PA=2000 ft, not the originally assumed 6000 ft). Weight corrected 3100→3200 lb; wind corrected 10→30 mph. 0/4000/6000/8000 ft curves unverified |
| 5-09 | Multi-engine rate of climb | no worked example on this chart to self-check against; each of the 3 weight curves independently re-measured at 3 pixel-calibrated altitudes, fit to <1% | Good |
| 5-10 | Single-engine rate of climb | same method as 5-09; sea-level points were significantly revised (up to 73% relative, though small in absolute ft/min), ceilings were already close | Good |
| 5-11 | Vx/Vy vs density altitude | re-measured at 6 altitudes per curve (multi-engine); found and fixed a structural error where single-engine Vx/Vy were modeled converging to two different ceiling speeds instead of one | Good |
| 5-12 | True airspeed vs DA | re-measured; found each %power curve has its own real ceiling (e.g. 75% power tops out at 8000 ft, not 16000 ft) — confirmed visually against the chart | Good, except the 55% curve's exact termination point (medium — sits close to a gridline) |
| 5-13 | Range profile | basic-fuel (84 gal) curves only; 75% curve was off ~24% in the original, others more minor | Good |
| 5-14 | Endurance profile | basic-fuel only; original `at16000` values used a suspicious uniform +1.0 hr bump for every curve — replaced with per-curve measured ceilings | Good, except the 45% curve's top end (medium — crosses close to the 55% curve on the chart, hard to separate pixel-by-pixel) |
| 6-01 | C.G. envelope | polygon re-measured directly off the chart's gridlines; found the original top-left bend point was misplaced by ~5 inches of C.G., and the axis top label had been misread (3800 instead of 3600) | Good |
| 5-17 | Power setting table | transcribed directly, cell by cell; spot-checked two full rows against the image, exact match | Exact transcription |

Re-run the self-check anytime by opening the browser console after loading
`index.html` — `app.js` logs a one-line summary per ladder chart on load.

### Why `data.js` duplicates `data/*.json`

Browsers block `fetch()` of local files from a `file://` page (a CORS
restriction), so `index.html` can't simply `fetch('data/fig5-06....json')`
when opened by double-click with no server. `data.js` embeds the exact same
content as a plain JS object so the app works with zero server. The
`data/*.json` files are kept as the easy-to-read/edit canonical copies — if
you hand-correct a digitized value there, make the same edit in `data.js`.

## Airport lookup

Type an ICAO identifier (e.g. `KSEA`) into the Departure or Destination field
and the app looks up that airport's name, field elevation, and longest
runway (length + surface) from a bundled offline database (`airports.js`) —
see "Data source" below for its provenance. Field elevation immediately
fills in as a standard-day pressure altitude guess.

A runway dropdown also appears, listing every runway end at that airport
(e.g. "Rwy 34R (340°) — 11,901 ft asphalt/concrete") sourced from the same
bundled database. Each runway's magnetic heading is derived from its own
number (Rwy 34 ≈ 340° magnetic, Rwy 16 ≈ 160°) rather than true heading —
that's deliberate: it's the same convention pilots already use for
eyeballing crosswind, and it avoids needing separate magnetic-declination
data per airport.

About half a second after a valid ICAO is entered, the app also fetches
**live current METAR** for that airport (temperature, altimeter setting,
wind, flight category, raw text, and observation age) and:
- upgrades pressure altitude from the standard-day elevation guess to a real
  altimeter-corrected value, showing the exact arithmetic inline (e.g.
  `433 ft elev + (29.92 − 30.07) × 1000 = 280 ft`)
- shows density altitude the same way, for situational awareness — but see
  the note below, it is **not** what the calculator actually uses
- fills in outside air temperature, from departure's METAR only (OAT is a
  single shared field across the whole calculator)
- once a runway is picked, computes the real headwind/crosswind component
  by trigonometry against that runway's heading and the live wind, and
  auto-fills the wind-component field (still editable afterward if you want
  to override it)

**Pressure altitude vs. density altitude:** this calculator's underlying POH
charts are indexed by pressure altitude and OAT directly (that's how Piper
drew them), not density altitude. Density altitude is computed and displayed
purely as a pilot-familiar reference number (the standard rule-of-thumb
approximation: `DA = PA + 120 × (OAT − ISA temperature at that PA)`, ISA
temp = `15 − 2 × (PA / 1000)` °C) — it is never fed into any calculation
here.

**Why this needed a proxy, and what it is:** the free NOAA Aviation Weather
Center API (`aviationweather.gov`) has real-time METAR/TAF data but sends no
CORS headers, so a browser blocks a static site from calling it directly
(confirmed by testing, not assumed). Rather than add a backend server, this
uses a small Cloudflare Worker (`cloudflare-worker/metar-proxy.js`) — a
serverless function, free tier (100k requests/day, no credit card), that
fetches aviationweather.gov server-side (no CORS applies server-to-server)
and re-serves it with CORS headers scoped to this project's own GitHub Pages
origin. If live weather is ever unreachable (offline, Worker down, airport
has no reporting station), the UI says so and falls back to the field
elevation already filled in — it never blocks manual entry.

## Route planning (winds/temps aloft)

Type waypoints into the Route card — a 4-letter ICAO airport, a VOR/NDB
identifier, or a 5-letter RNAV/GPS fix (press Enter/Tab to resolve each one).
If an identifier matches more than one real-world station (navaid idents
aren't globally unique the way ICAO codes are), a dropdown lets you pick the
right one by name/country. Add as many waypoints as the route needs.

Set a cruise altitude and an altimeter setting (defaults to standard, 29.92)
to get cruise pressure altitude. For each leg, the app computes true course
and distance from the waypoints' coordinates, finds the nearest winds-aloft
forecast station to that leg's midpoint, interpolates its forecast to your
cruise altitude, and shows the resulting headwind/tailwind and crosswind
component along that leg's course.

**This is forecast data, not an observation** — NOAA's winds/temps-aloft
product ("FD") is valid for a ~6-hour window and only exists at a sparse
network of ~170 stations nationwide (not every airport), so distance to the
nearest station is shown alongside each result — treat it as a planning
estimate, not a substitute for a real weather briefing. It's fetched through
the same Cloudflare Worker proxy as METAR (a `/windtemp` endpoint added
alongside `/metar` and `/taf`), for the same CORS reason. Winds aloft are
reported in **true** heading by NOAA convention (unlike METAR surface wind,
which is magnetic) — course is computed in true heading too, so the
comparison is apples-to-apples with no conversion needed.

The FD text format itself is a fixed-width bulletin with some real quirks
handled here: a station can report wind with no temperature at low altitude,
"light and variable" wind can still carry a temperature, and wind speeds at
or above 100 kt use a different encoding (add 50 to the coded direction,
100 to the coded speed) that only shows up at upper altitudes. All of this
was verified against the live production bulletin, not just documentation,
before being trusted.

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

Airport data (`airports.js`, also mirrored as `data/airports.json`), runway
data (`runways.js` / `data/runways.json`), and navaid data (`navaids.js` /
`data/navaids.json`) come from [OurAirports](https://ourairports.com/data/),
a public-domain (CC0) dataset maintained by volunteers. Airports are filtered
to the 10,110 small/medium/large airports worldwide with a 4-letter ICAO
identifier (name, municipality, country, coordinates, field elevation,
longest-runway length/surface). Runways are every non-closed runway end at
those airports (22,113) with length, width, surface, and a magnetic heading
derived from the runway's own number (not OurAirports' true-heading column —
see "Airport lookup" above for why). Navaids are VOR/VOR-DME/VORTAC/NDB/
NDB-DME stations (10,399 of them, 5,718 unique identifiers — navaid idents
are *not* globally unique the way ICAO airport codes are, so the same
identifier can resolve to multiple real-world stations).

Fix data (`fixes.js` / `data/fixes.json`) comes from the FAA's 28-day NASR
subscription data — the authoritative, free, public-domain source for every
named 5-letter RNAV/GPS fix in the US National Airspace System (65,388 of
them, military-only fixes excluded). This updates on an AIRAC-aligned 28-day
cycle, which is faster-moving than OurAirports' data.

**All four datasets refresh automatically** via a scheduled GitHub Actions
workflow (`.github/workflows/refresh-data.yml`, runs monthly, also runnable
on demand from the Actions tab) that re-runs `scripts/refresh_data.py` — the
exact same pipeline described above — and commits any changes. No manual
re-downloading needed; this is genuinely "set and forget."
