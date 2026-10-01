// PA-30 Performance Calculator — aviationweather.gov CORS proxy
//
// aviationweather.gov's free API has no CORS headers, so a static site's
// browser JS can't call it directly. This Worker fetches it server-side
// (no CORS applies server-to-server) and re-serves the response with CORS
// headers added, restricted to this project's own origin.
//
// Deploy via the Cloudflare dashboard: Workers & Pages -> Create -> Create
// Worker -> paste this file's contents over the default code -> Deploy.
// Update ALLOWED_ORIGIN below if you host this project somewhere else.
//
// Endpoints:
//   /metar?ids=KSEA[,KPAE,...]   -> JSON METAR, passthrough from upstream
//   /taf?ids=KSEA[,...]          -> JSON TAF, passthrough from upstream
//   /windtemp?fcst=06|12|24      -> plain-text FD winds/temps-aloft bulletin,
//                                    region+level hardcoded server-side (all
//                                    US stations, 3000-39000 ft) since that's
//                                    the only shape this app ever needs

const ALLOWED_ORIGIN = 'https://taylordonato003-aviation.github.io';
const JSON_PATHS = ['metar', 'taf'];

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    const allowOrigin = (origin === ALLOWED_ORIGIN) ? origin : ALLOWED_ORIGIN;
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Only GET is supported.' }, 405, corsHeaders);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '').toLowerCase();

    if (path === 'windtemp') {
      return handleWindTemp(url, corsHeaders);
    }
    if (JSON_PATHS.includes(path)) {
      return handleJsonProxy(path, url, corsHeaders);
    }
    return json({ error: "Unknown endpoint. Use '/metar?ids=KSEA', '/taf?ids=KSEA', or '/windtemp?fcst=06'." }, 404, corsHeaders);
  }
};

async function handleJsonProxy(path, url, corsHeaders) {
  const ids = (url.searchParams.get('ids') || '').toUpperCase();
  if (!/^[A-Z0-9]{3,4}(,[A-Z0-9]{3,4}){0,9}$/.test(ids)) {
    return json({ error: 'Invalid ids parameter — expected one or more comma-separated ICAO identifiers.' }, 400, corsHeaders);
  }

  const upstream = `https://aviationweather.gov/api/data/${path}?ids=${encodeURIComponent(ids)}&format=json`;
  let upstreamResp;
  try {
    upstreamResp = await fetch(upstream, { cf: { cacheTtl: 60, cacheEverything: true } });
  } catch (err) {
    return json({ error: 'Upstream fetch failed.' }, 502, corsHeaders);
  }

  const body = await upstreamResp.text();
  return new Response(body, {
    status: upstreamResp.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleWindTemp(url, corsHeaders) {
  const fcst = url.searchParams.get('fcst') || '06';
  if (!['06', '12', '24'].includes(fcst)) {
    return json({ error: "Invalid fcst parameter — must be '06', '12', or '24'." }, 400, corsHeaders);
  }

  // region=all + level=low covers the full continental US station network at
  // 3000-39000 ft, which is every altitude a PA-30 would ever fly at.
  const upstream = `https://aviationweather.gov/api/data/windtemp?region=all&level=low&fcst=${fcst}`;
  let upstreamResp;
  try {
    upstreamResp = await fetch(upstream, { cf: { cacheTtl: 1800, cacheEverything: true } });
  } catch (err) {
    return json({ error: 'Upstream fetch failed.' }, 502, corsHeaders);
  }

  const body = await upstreamResp.text();
  return new Response(body, {
    status: upstreamResp.status,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

function json(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
