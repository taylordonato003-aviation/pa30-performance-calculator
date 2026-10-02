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
reference/*.png     The original scanned POH chart pages this tool
                    was digitized from, for comparison
reference/poh-hires/ 300 DPI scans (the current source of truth for all
                    13 Section 5 charts) plus the Section 6 C.G. envelope
                    page and its limits table
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

As of 2026-10-01, every chart (13 of 14 — see the Fig 6-01 note below) has
been re-digitized from a 300 DPI scan of the actual POH pages (`reference/poh-hires/`),
replacing an earlier pass done against much lower-resolution web-scraped
images. The low-res source made it genuinely hard to disentangle the five
ladder charts' closely-spaced, crossing altitude curves — and it caused a
real error: **all five ladder charts' printed worked examples actually use a
10 mph headwind**, not the 30 mph a prior (low-res) pass had concluded "was
confirmed across every chart." That 30 mph belief turned out to be wrong for
all five charts, not just some of them, and several charts' pressure-altitude/
weight example inputs were also mislabeled (e.g. fig 5-06 and 5-07's examples
are both at PA=4000 ft, not the originally-assumed 6000 ft). Every correction
below was independently cross-checked by directly measuring the relevant
pixel/gridline alignment at least twice, by two different methods or passes,
before being accepted — not taken on a single trace's word.

Four of the five ladder charts now reproduce their own worked example to
within 0.6%. The fifth (5-07) has a known, inherent ~8% gap explained in its
table row below — a real limitation of the 2-point straight-line model on a
chart whose curve is visibly non-linear, not a measurement error.

| Figure | Chart | Self-check vs. printed example | Confidence |
|---|---|---|---|
| 5-02 | Airspeed calibration (IAS→CAS) | no worked example on this chart; both curves (flaps retracted / flaps fully extended) traced row-by-row and sampled every 5 mph IAS | Good — new chart, not in the prior digitization set |
| 5-06 | Takeoff ground run | computed 1140 ft vs. chart 1134 ft (+0.5%) | Good. Worked example is PA=4000 ft / 60°F / 3200 lb / 10 mph headwind / 1134 ft — all five inputs independently re-derived and cross-checked pixel-by-pixel (a casual visual recount of the parallel altitude curves was initially wrong about which curve point A sits on; resolved by precisely matching the curve's traced peak row against point B's measured row, which is unambiguous). All 5 altitude curves (0/2000/4000/6000/8000 ft) now independently traced and verified |
| 5-07 | Takeoff distance, 50 ft obstacle | computed 2125 ft vs. chart 2311 ft (−8.0%) | Good data, known model-fit gap. Worked example: PA=4000 ft/70°F/3200 lb/10 mph/2311 ft. This chart's altitude curves are visibly curved rather than straight (confirmed by direct pixel sampling along the curve, which bows 25–50 px above the straight line its own two stored endpoints would imply) — the app's 2-point linear t0/t120 model can't close that gap without hurting accuracy elsewhere on the same curve. All 5 altitude curves independently traced |
| 5-08 | Accelerate-stop distance | computed 2485 ft vs. chart 2485 ft (0.00%) | Good. Worked example: PA=2000 ft/70°F/3200 lb/10 mph/2485 ft (PA and wind both corrected from the prior pass's 6000 ft/30 mph). All 5 altitude curves independently traced |
| 5-15 | Landing ground roll | computed 550 ft vs. chart 550 ft (0.00%) | Good. Worked example: PA=4000 ft/70°F/3100 lb/10 mph/550 ft (wind corrected from 30 mph). All 5 altitude curves independently traced |
| 5-16 | Landing distance, 50 ft obstacle | computed 1700 ft vs. chart 1700 ft (0.00%) | Good. Worked example: PA=2000 ft/65°F/3200 lb/10 mph/1700 ft. A prior pass in this same re-verification round re-confirmed PA/weight correctly but initially carried forward the old wind=30 assumption without independently re-checking it — caught and corrected by directly measuring point E's column against the chart's own printed "10" tick label (exact match to within 1 px). All 5 altitude curves independently traced |
| 5-09 | Multi-engine rate of climb | no worked example; each of 3 weight curves re-measured at 3+ pixel-calibrated points | Good. Sea-level ROC values revised up ~8% after finding the DA axis actually spans 0–32,000 ft (2 unlabeled minor gridlines above "28000"), not 0–28,000 as a prior pass assumed |
| 5-10 | Single-engine rate of climb | same method as 5-09 | Good. Service-ceiling values revised up 1–2% on re-measurement (e.g. 3600 lb: 6925→7085 ft) |
| 5-11 | Vx/Vy vs density altitude | re-measured at 6 points/curve (multi-engine), plus branch-intersection + direct pixel read for the single-engine "tent" apex | Good. Single-engine `ceilingDa` corrected 7189→6189 ft (~14% lower), confirmed by three independent methods agreeing to ~20 ft |
| 5-12 | True airspeed vs DA | re-measured; each %power curve's real ceiling confirmed by per-curve slope fit | Good. Found the 55%/65% real-ceiling readings had been swapped onto the wrong curves in a prior pass (crowded mid-altitude region) — corrected |
| 5-13 | Range profile | basic-fuel (84 gal) curves only | Good. Real ceiling altitudes corrected (45%/55% both actually terminate together at ~15,000 ft, not 16,000/14,667 separately) |
| 5-14 | Endurance profile | basic-fuel only | Good. Sea-level values corrected up 13–19% against a gridline overlay; confirmed 65% runs continuously to ~15,000 ft (no separate ~12,000 ft ceiling like the analogous range chart) — only 75% keeps a distinct, much lower ceiling |
| 6-01 | C.G. envelope | re-derived from the printed C.G. *limits table* accompanying the figure (exact numbers, not a pixel trace) | Exact — forward-limit breakpoints (81.0in/2450lb, 83.0in/3200lb, 86.5in/3600lb) and the constant 92.0in aft limit are all printed values. **Not covered by the 300 DPI Section 5 scan** (that PDF is Section 5/Performance only) — this chart's source is a separately-provided page image of Section 6/Weight & Balance |
| 5-17 | Power setting table | every row cross-checked against the hi-res scan (not just a sample) | Exact transcription, no changes needed |

Re-run the self-check anytime by opening the browser console after loading
`index.html` — `app.js` logs a one-line summary per ladder chart on load.

### Airspeed calibration (IAS → CAS)

Fig 5-02 gives the correction to add to Indicated Airspeed to get Calibrated
Airspeed, as two curves (flaps retracted / flaps fully extended) over the
chart's charted IAS range. The Climb and Go-Around cards show this CAS value
under each V<sub>X</sub>/V<sub>Y</sub> reading (flaps-retracted curve, matching
Fig 5-11's own "wing flaps retracted" condition). The Cruise card's true
airspeed is still read directly off Fig 5-12 (TAS vs density altitude at a
given % power) rather than derived from CAS — that chart already gives TAS
directly, so there's no CAS step in that particular chain.

### Absolute and service ceiling

The Climb card derives the both-engines and single-engine absolute and
service ceilings directly from the same rate-of-climb data (Fig 5-09 / 5-10)
used for the ROC readings above them, at your takeoff weight. Per the POH's
own definitions: absolute ceiling is the density altitude where ROC reaches
0 ft/min; service ceiling is 100 ft/min (both engines) or 50 ft/min (single
engine). Since each weight curve's ROC-vs-DA relationship is already modeled
as a straight line from sea level down to 0 at `daAtZero`, and interpolating
between two weight curves at a fixed DA stays linear, the ceiling for any
target ROC is solved directly (two-point line fit, not a search) rather than
approximated.

### Personal minimums

A dedicated card lets you set your own safety margins — none of this is a
POH limit, just a convenience for checking the computed numbers above against
the actual runway/airport before you fly: accelerate-stop distance and (your
factor) × takeoff distance over 50 ft against the departure runway; (your
factor) × landing distance over 50 ft against the destination runway (or a
flat no-flap-landing minimum runway, if you check that box); and departure/
destination/cruise density altitude against the single-engine service ceiling
less your chosen margin. It uses the specific runway selected above if you
picked one, otherwise the airport's longest runway.

### Weight & balance worksheet

The Weight & Balance card is a fillable loading worksheet (prefilled with
N40DA's empty weight/arm — edit those two fields for a different airplane),
following the same chain as a standard POH loading form: empty weight +
pilot/front passenger + rear passengers + baggage = total before fuel; add
main/aux tank fuel (6 lb/gal) to get takeoff weight & C.G., gear extended;
add a fixed +770 in-lb moment shift for gear retracted (the in-flight
configuration); subtract fuel burned en route (also moment-weighted by tank
arm) to get descent weight & C.G., gear retracted; subtract the same 770
in-lb shift back out for landing weight & C.G., gear extended. Takeoff/
landing weight and C.G. feed the Conditions card's weight/C.G. fields
(separate fields for each) automatically whenever a worksheet field
changes — those fields stay directly editable afterward for a quick
what-if without re-touching the worksheet. The envelope plot shows both
points at once (a circle for takeoff, a diamond for landing), each
colored green/red for in/out of limits, so you can check that the
airplane stays in C.G. through the whole flight, not just at the start.

### Why `data.js` duplicates `data/*.json`

Browsers block `fetch()` of local files from a `file://` page (a CORS
restriction), so `index.html` can't simply `fetch('data/fig5-06....json')`
when opened by double-click with no server. `data.js` embeds the exact same
content as a plain JS object so the app works with zero server. The
`data/*.json` files are kept as the easy-to-read/edit canonical copies — if
you hand-correct a digitized value there, make the same edit in `data.js`.

## Airport lookup

Type an ICAO identifier (e.g. `KSEA`) or a local/domestic identifier for a
smaller field that doesn't have one (e.g. `C80`) into the Departure or
Destination field, and the app looks up that airport's name, field elevation, and longest
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
- fills in outside air temperature from that airport's own METAR (departure
  and destination each have their own OAT field, so takeoff and landing can
  use different actual temperatures)
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

**TAF and extended outlook**, collapsed under each airport's weather block
once available (tap to expand):
- **TAF** (≈30 hour forecast): raw text plus a readable period-by-period
  breakdown (wind, visibility, clouds, weather, and a computed flight
  category — LIFR/IFR/MVFR/VFR — per period), through the same Worker (a
  `/taf` endpoint alongside `/metar` and `/windtemp`).
- **Extended outlook** (several days out, US airports only): the National
  Weather Service's own forecast (`api.weather.gov`), which already
  incorporates NBM (the National Blend of Models, the modern successor to
  the older GFS-MOS product) — so this effectively covers what a MOS lookup
  would have, through NWS's actively-maintained product instead of chasing
  a legacy raw-text format. **No proxy needed for this one**: `api.weather.gov`
  sends `Access-Control-Allow-Origin: *`, confirmed by testing, so the app
  calls it directly from the browser.

## Route planning (winds/temps aloft)

The Route card's departure and destination always mirror whatever you've
entered in the Airports card above — no retyping. With no fixes added, route
distance is the direct great-circle distance between those two airports.
Each fix you add (any airport in the bundled database, ICAO or local
identifier; a VOR/NDB identifier; or a 5-letter RNAV/GPS fix — press
Enter/Tab to resolve it) inserts a leg, point
to point, in the order added. If an identifier matches more than one
real-world station (navaid idents aren't globally unique the way ICAO codes
are), a dropdown lets you pick the right one by name/country.

Set a cruise altitude and an altimeter setting (defaults to standard, 29.92)
to get cruise pressure altitude, and an enroute OAT (manual entry — estimate
it from the per-leg temperature-aloft readings, a briefing, or the ISA lapse
rate) to get a cruise density altitude, shown the same reference-only way as
the per-airport DA breakdown above. For each leg, the app computes true
course and distance from the waypoints' coordinates, finds the nearest
winds-aloft forecast station to that leg's midpoint, interpolates its
forecast to your cruise altitude, and shows the resulting headwind/tailwind
and crosswind component along that leg's course.

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
a public-domain (CC0) dataset maintained by volunteers. Airports are every
small/medium/large airport worldwide (47,465 of them) indexed by whichever
identifier it actually has: a true 4-letter ICAO code when OurAirports has
one on file, else the local/domestic identifier (e.g. the FAA's 3-character
LID for a US field like `C80` — most small, non-towered airports worldwide
only have this, not a real ICAO code), else OurAirports' own internal ident
as a last resort. A few hundred mostly-private airstrips worldwide collide
on this fallback identifier (a data-quality quirk of the source, not
something fixable here) — whichever one is encountered first in the source
data wins and the rest are dropped rather than silently overwriting each
other. Each entry carries name, municipality, country, coordinates, field
elevation, and longest-runway length/surface. Runways are every non-closed
runway end at those airports (66,415) with length, width, surface, and a
magnetic heading derived from the runway's own number (not OurAirports'
true-heading column — see "Airport lookup" above for why). Navaids are
VOR/VOR-DME/VORTAC/NDB/NDB-DME stations (10,399 of them, 5,718 unique
identifiers — navaid idents are *not* globally unique the way ICAO airport
codes are, so the same identifier can resolve to multiple real-world
stations).

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
