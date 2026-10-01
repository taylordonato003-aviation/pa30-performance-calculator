#!/usr/bin/env python3
"""
Rebuilds the four bundled reference datasets this project ships with:
  data/airports.json / airports.js   -- OurAirports (CC0, public domain)
  data/runways.json  / runways.js    -- OurAirports (CC0, public domain)
  data/navaids.json  / navaids.js    -- OurAirports (CC0, public domain)
  data/fixes.json    / fixes.js      -- FAA NASR 28-day subscription (public domain)

This is the exact same pipeline that was originally run by hand, turned into
a script so a scheduled job (see .github/workflows/refresh-data.yml) can keep
these current automatically. Safe to re-run any time -- it always rebuilds
from scratch and only touches the files listed above.

Usage: python3 scripts/refresh_data.py
Exits non-zero (and leaves existing data files untouched) if any source
can't be fetched or parsed, so a failed scheduled run never commits partial
or broken data.
"""

import csv
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
USER_AGENT = 'Mozilla/5.0 (compatible; pa30-calc-data-refresh/1.0)'


def fetch(url, timeout=120):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_text(url, timeout=60, encoding='utf-8'):
    return fetch(url, timeout).decode(encoding)


def write_json_and_js(name, obj):
    json_path = os.path.join(DATA_DIR, f'{name}.json')
    js_path = os.path.join(ROOT, f'{name}.js')
    compact = json.dumps(obj, separators=(',', ':'))
    with open(json_path, 'w', encoding='utf-8') as f:
        f.write(compact)
    varname = 'PA30_' + name.upper()
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(f'window.{varname} = {compact};\n')
    print(f'  wrote {json_path} and {js_path} ({len(compact):,} bytes)')


# ---------------------------------------------------------------------------
# OurAirports: airports + runways + navaids
# ---------------------------------------------------------------------------

OURAIRPORTS_BASE = 'https://ourairports.com/data/'

SURFACE_NAMES_NOTE = None  # surface codes are kept as-is; app.js has the display-name lookup


def build_airports_and_runways():
    print('Downloading OurAirports airports.csv ...')
    airports_csv = fetch_text(OURAIRPORTS_BASE + 'airports.csv')
    print('Downloading OurAirports runways.csv ...')
    runways_csv = fetch_text(OURAIRPORTS_BASE + 'runways.csv')

    ident_to_icao = {}
    airports_out = {}
    reader = csv.DictReader(io.StringIO(airports_csv))
    for row in reader:
        icao = (row['icao_code'] or '').strip().upper()
        if not icao or len(icao) != 4:
            continue
        if row['type'] not in ('small_airport', 'medium_airport', 'large_airport'):
            continue
        ident_to_icao[row['ident']] = icao

    # second pass for airports_out, plus longest-runway join (built below)
    def parse_heading(ident):
        m = re.match(r'^(\d{1,2})', (ident or '').strip())
        if not m:
            return None
        num = int(m.group(1))
        if num < 1 or num > 36:
            return None
        return num * 10

    longest = {}
    runways_by_icao = defaultdict(list)
    reader = csv.DictReader(io.StringIO(runways_csv))
    for row in reader:
        if row['closed'] == '1':
            continue
        icao = ident_to_icao.get(row['airport_ident'])
        if not icao:
            continue
        try:
            length = int(round(float(row['length_ft']))) if row['length_ft'] else None
        except ValueError:
            length = None
        if not length or length <= 0:
            continue
        try:
            width = int(round(float(row['width_ft']))) if row['width_ft'] else None
        except ValueError:
            width = None
        surface = (row['surface'] or '').strip() or None

        cur = longest.get(row['airport_ident'])
        if cur is None or length > cur[0]:
            longest[row['airport_ident']] = (length, surface)

        for prefix in ('le_', 'he_'):
            rident = (row[prefix + 'ident'] or '').strip()
            heading = parse_heading(rident)
            if not rident or heading is None:
                continue
            entry = {'id': rident, 'hdg': heading, 'len': length}
            if width:
                entry['w'] = width
            if surface:
                entry['srf'] = surface
            runways_by_icao[icao].append(entry)

    for icao in runways_by_icao:
        runways_by_icao[icao].sort(key=lambda e: e['id'])

    reader = csv.DictReader(io.StringIO(airports_csv))
    for row in reader:
        icao = (row['icao_code'] or '').strip().upper()
        if not icao or len(icao) != 4:
            continue
        if row['type'] not in ('small_airport', 'medium_airport', 'large_airport'):
            continue
        try:
            elev = int(round(float(row['elevation_ft']))) if row['elevation_ft'] else None
        except ValueError:
            elev = None
        try:
            lat = round(float(row['latitude_deg']), 4)
            lon = round(float(row['longitude_deg']), 4)
        except ValueError:
            continue
        entry = {
            'n': row['name'].strip(),
            'c': row['municipality'].strip() or None,
            'co': row['iso_country'].strip(),
            'lat': lat,
            'lon': lon,
        }
        if elev is not None:
            entry['elev'] = elev
        rwy = longest.get(row['ident'])
        if rwy:
            entry['rwy'] = int(rwy[0])
            if rwy[1]:
                entry['srf'] = rwy[1]
        airports_out[icao] = entry

    if len(airports_out) < 5000:
        raise RuntimeError(f'Sanity check failed: only {len(airports_out)} airports parsed (expected 10000+)')
    if sum(len(v) for v in runways_by_icao.values()) < 10000:
        raise RuntimeError('Sanity check failed: runway count implausibly low')

    print(f'  {len(airports_out):,} airports, {sum(len(v) for v in runways_by_icao.values()):,} runway ends')
    return airports_out, dict(runways_by_icao)


def build_navaids():
    print('Downloading OurAirports navaids.csv ...')
    navaids_csv = fetch_text(OURAIRPORTS_BASE + 'navaids.csv')

    grouped = defaultdict(list)
    reader = csv.DictReader(io.StringIO(navaids_csv))
    for row in reader:
        t = row['type']
        if t not in ('VOR', 'VOR-DME', 'VORTAC', 'NDB', 'NDB-DME'):
            continue
        ident = (row['ident'] or '').strip().upper()
        if not ident:
            continue
        try:
            lat = round(float(row['latitude_deg']), 4)
            lon = round(float(row['longitude_deg']), 4)
        except ValueError:
            continue
        entry = {'n': row['name'].strip(), 'ty': t, 'co': row['iso_country'].strip(), 'lat': lat, 'lon': lon}
        freq = row['frequency_khz']
        if freq:
            try:
                freq_val = float(freq)
                entry['freq'] = round(freq_val / 1000, 2) if t in ('VOR', 'VOR-DME', 'VORTAC') else int(freq_val)
            except ValueError:
                pass
        grouped[ident].append(entry)

    if len(grouped) < 2000:
        raise RuntimeError(f'Sanity check failed: only {len(grouped)} navaid idents parsed (expected 5000+)')
    total = sum(len(v) for v in grouped.values())
    print(f'  {len(grouped):,} unique idents, {total:,} navaid entries')
    return dict(grouped)


# ---------------------------------------------------------------------------
# FAA NASR: 5-letter fixes
# ---------------------------------------------------------------------------

NASR_PAGE = 'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/'
NASR_ANCHOR_DATE = date(2025, 1, 23)  # a known-valid cycle date; cycles are every 28 days
NASR_CYCLE_DAYS = 28


def candidate_nasr_urls():
    """Yield likely current-cycle NASR zip URLs, most recent first, computed
    from the known 28-day cadence (checked a few cycles back as a safety net),
    then scraped from the FAA page as a fallback in case the cadence ever
    shifts."""
    today = date.today()
    n = (today - NASR_ANCHOR_DATE).days // NASR_CYCLE_DAYS
    seen = set()
    for back in range(0, 4):
        d = NASR_ANCHOR_DATE + timedelta(days=(n - back) * NASR_CYCLE_DAYS)
        if d <= today and d not in seen:
            seen.add(d)
            yield f'https://nfdc.faa.gov/webContent/28DaySub/28DaySubscription_Effective_{d.isoformat()}.zip'
    try:
        html = fetch_text(NASR_PAGE, timeout=30)
        urls = sorted(set(re.findall(
            r'https?://nfdc\.faa\.gov/webContent/28DaySub/28DaySubscription_Effective_[0-9-]+\.zip', html
        )), reverse=True)
        for u in urls[:4]:
            if u not in seen:
                seen.add(u)
                yield u
    except Exception as e:
        print(f'  (page-scrape fallback failed, continuing with computed dates only: {e})')


def parse_dms(s):
    s = s.strip()
    if not s:
        return None
    m = re.match(r'^(\d+)-(\d+)-([\d.]+)([NSEW])$', s)
    if not m:
        return None
    deg, mn, sec, hemi = m.groups()
    val = int(deg) + int(mn) / 60 + float(sec) / 3600
    return -val if hemi in ('S', 'W') else val


def build_fixes():
    zip_bytes = None
    used_url = None
    for url in candidate_nasr_urls():
        print(f'Trying FAA NASR cycle: {url}')
        try:
            zip_bytes = fetch(url, timeout=180)
            used_url = url
            break
        except Exception as e:
            print(f'  not available ({e}), trying previous cycle...')
    if zip_bytes is None:
        raise RuntimeError('Could not find a working FAA NASR subscription URL in the last 4 cycles')
    print(f'  downloaded {len(zip_bytes):,} bytes from {used_url}')

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        with zf.open('FIX.txt') as f:
            fix_text = f.read().decode('latin-1')

    fixes = {}
    for line in fix_text.splitlines():
        if not line.startswith('FIX1'):
            continue
        fix_id = line[4:34].strip()
        if len(fix_id) != 5:
            continue
        cat = line[94:97].strip()
        if cat == 'MIL':
            continue
        lat = parse_dms(line[66:80])
        lon = parse_dms(line[80:94])
        if lat is None or lon is None:
            continue
        fixes[fix_id] = {'lat': round(lat, 4), 'lon': round(lon, 4)}

    if len(fixes) < 30000:
        raise RuntimeError(f'Sanity check failed: only {len(fixes)} fixes parsed (expected 60000+)')
    print(f'  {len(fixes):,} five-letter civil fixes')
    return fixes


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    print('=== Airports + runways (OurAirports) ===')
    airports, runways = build_airports_and_runways()
    print('=== Navaids (OurAirports) ===')
    navaids = build_navaids()
    print('=== Fixes (FAA NASR) ===')
    fixes = build_fixes()

    print('=== Writing output files ===')
    write_json_and_js('airports', airports)
    write_json_and_js('runways', runways)
    write_json_and_js('navaids', navaids)
    write_json_and_js('fixes', fixes)
    print('Done.')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'FAILED: {e}', file=sys.stderr)
        sys.exit(1)
