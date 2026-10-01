// PA-30 Performance Calculator — METAR/TAF CORS proxy
//
// aviationweather.gov's free API has no CORS headers, so a static site's
// browser JS can't call it directly. This Worker fetches it server-side
// (no CORS applies server-to-server) and re-serves the response with CORS
// headers added, restricted to this project's own origin.
//
// Deploy via the Cloudflare dashboard: Workers & Pages -> Create -> Create
// Worker -> paste this file's contents over the default code -> Deploy.
// Update ALLOWED_ORIGIN below if you host this project somewhere else.

const ALLOWED_ORIGIN = 'https://taylordonato003-aviation.github.io';
const ALLOWED_PATHS = ['metar', 'taf'];

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
    const ids = (url.searchParams.get('ids') || '').toUpperCase();

    if (!ALLOWED_PATHS.includes(path)) {
      return json({ error: "Unknown endpoint. Use '/metar?ids=KSEA' or '/taf?ids=KSEA'." }, 404, corsHeaders);
    }
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
};

function json(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
