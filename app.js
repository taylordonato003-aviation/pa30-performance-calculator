(function () {
  'use strict';

  var DATA = window.PA30_DATA;

  // ---------- generic math helpers ----------

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function lerp(x0, y0, x1, y1, x) {
    if (x1 === x0) return y0;
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }

  // interpolate a value across an ordered list of {key, value} breakpoints,
  // clamping outside the range (extrapolation is handled separately for the
  // ladder model, which explicitly wants linear extension beyond the chart).
  function interpBreakpoints(points, x, extrapolate) {
    points = points.slice().sort(function (a, b) { return a.x - b.x; });
    if (x <= points[0].x) {
      if (!extrapolate || points.length < 2) return points[0].y;
      return lerp(points[0].x, points[0].y, points[1].x, points[1].y, x);
    }
    for (var i = 0; i < points.length - 1; i++) {
      if (x <= points[i + 1].x) {
        return lerp(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, x);
      }
    }
    var n = points.length;
    if (!extrapolate) return points[n - 1].y;
    return lerp(points[n - 2].x, points[n - 2].y, points[n - 1].x, points[n - 1].y, x);
  }

  function cToF(c) { return c * 9 / 5 + 32; }

  // ---------- ladder (takeoff / landing distance) model ----------
  // See README.md "How the numbers are computed" for the full explanation.

  function ladderBase(fig, pa, oatF) {
    var alts = Object.keys(fig.altitudeCurves).map(Number).sort(function (a, b) { return a - b; });
    var paClamped = pa; // allow extrapolation beyond 0-8000 via nearest segment
    var lo = alts[0], hi = alts[alts.length - 1];
    var a0, a1;
    if (paClamped <= lo) { a0 = alts[0]; a1 = alts[1]; }
    else if (paClamped >= hi) { a0 = alts[alts.length - 2]; a1 = alts[alts.length - 1]; }
    else {
      for (var i = 0; i < alts.length - 1; i++) {
        if (paClamped >= alts[i] && paClamped <= alts[i + 1]) { a0 = alts[i]; a1 = alts[i + 1]; break; }
      }
    }
    var c0 = fig.altitudeCurves[a0], c1 = fig.altitudeCurves[a1];
    var t0at0 = lerp(a0, c0.t0, a1, c1.t0, paClamped);
    var t0at120 = lerp(a0, c0.t120, a1, c1.t120, paClamped);
    // linear model of value vs OAT between 0F (chart left edge) and 120F (right border)
    return lerp(0, t0at0, 120, t0at120, oatF);
  }

  function ladderResult(figKey, pa, oatF, weightLb, windMph) {
    var fig = DATA[figKey];
    var base = ladderBase(fig, pa, oatF);
    var weightFactor = Math.pow(clamp(weightLb, 1500, 4200) / 3600, fig.weightExponent);
    var k = fig.windKPerMph;
    var windFactor;
    if (windMph >= 0) {
      windFactor = Math.max(0.2, 1 - k * windMph);
    } else {
      windFactor = 1 + k * fig.tailwindMultiplier * (-windMph);
    }
    return Math.round(base * weightFactor * windFactor / 5) * 5;
  }

  function verifyLadder(figKey) {
    var fig = DATA[figKey];
    var ex = fig.exampleCheck;
    var computed = ladderResult(figKey, ex.pa, ex.oatF, ex.weightLb, ex.windMph);
    var pctErr = 100 * (computed - ex.chartReading) / ex.chartReading;
    return { computed: computed, chartReading: ex.chartReading, pctErr: pctErr };
  }

  // ---------- linear-by-weight (rate of climb) ----------

  function rocFromCurves(curves, da, weightLb) {
    var weights = Object.keys(curves).map(Number).sort(function (a, b) { return a - b; });
    var wClamped = clamp(weightLb, weights[0], weights[weights.length - 1]);
    var w0, w1;
    for (var i = 0; i < weights.length - 1; i++) {
      if (wClamped >= weights[i] && wClamped <= weights[i + 1]) { w0 = weights[i]; w1 = weights[i + 1]; break; }
    }
    if (w0 === undefined) { w0 = weights[0]; w1 = weights[1]; }
    function rocAt(w) {
      var c = curves[w];
      var roc = lerp(0, c.seaLevel, c.daAtZero, 0, clamp(da, 0, c.daAtZero * 1.3));
      return roc;
    }
    var r0 = rocAt(w0), r1 = rocAt(w1);
    var roc = lerp(w0, r0, w1, r1, wClamped);
    return Math.max(0, Math.round(roc));
  }

  // ---------- linear-by-power (TAS / range / endurance) ----------

  function byPower(curves, da, power) {
    var powers = Object.keys(curves).map(Number).sort(function (a, b) { return a - b; });
    var pClamped = clamp(power, powers[0], powers[powers.length - 1]);
    var p0, p1;
    for (var i = 0; i < powers.length - 1; i++) {
      if (pClamped >= powers[i] && pClamped <= powers[i + 1]) { p0 = powers[i]; p1 = powers[i + 1]; break; }
    }
    if (p0 === undefined) { p0 = powers[0]; p1 = powers[1]; }
    function valAt(p) {
      var c = curves[p];
      return lerp(0, c.seaLevel, 16000, c.at16000, clamp(da, 0, 20000));
    }
    var v0 = valAt(p0), v1 = valAt(p1);
    return lerp(p0, v0, p1, v1, pClamped);
  }

  // ---------- Vx/Vy ----------

  function vxvy(da) {
    var fig = DATA['fig5-11'];
    var me = fig.multiEngine;
    var se = fig.singleEngine;
    var multiVx = lerp(0, me.vx.seaLevel, 15000, me.vx.at15000, clamp(da, 0, 15000));
    var multiVy = lerp(0, me.vy.seaLevel, 15000, me.vy.at15000, clamp(da, 0, 15000));
    var singleDa = clamp(da, 0, se.ceilingDa);
    var singleVx = lerp(0, se.vx.seaLevel, se.ceilingDa, se.vx.atCeiling, singleDa);
    var singleVy = lerp(0, se.vy.seaLevel, se.ceilingDa, se.vy.atCeiling, singleDa);
    return { multiVx: multiVx, multiVy: multiVy, singleVx: singleVx, singleVy: singleVy, aboveSingleCeiling: da > se.ceilingDa };
  }

  // ---------- weight & balance ----------

  function pointInPolygon(point, poly) {
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      var intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ---------- UI wiring ----------

  var $ = function (id) { return document.getElementById(id); };

  function readInputs() {
    var altFt = parseFloat($('pressureAlt').value) || 0;
    var oatRaw = parseFloat($('oat').value);
    if (isNaN(oatRaw)) oatRaw = 59;
    var oatUnit = $('oatUnit').value;
    var oatF = oatUnit === 'C' ? cToF(oatRaw) : oatRaw;
    var toWeight = clamp(parseFloat($('toWeight').value) || 3600, 1500, 3600);
    var ldgWeightRaw = parseFloat($('ldgWeight').value);
    var ldgWeight = isNaN(ldgWeightRaw) ? toWeight : clamp(ldgWeightRaw, 1500, 3600);
    var wind = parseFloat($('wind').value) || 0;
    var power = clamp(parseFloat($('power').value) || 65, 45, 75);
    var fuel = clamp(parseFloat($('fuel').value) || 84, 0, 84);
    var cg = parseFloat($('cg').value);
    return { altFt: altFt, oatF: oatF, toWeight: toWeight, ldgWeight: ldgWeight, wind: wind, power: power, fuel: fuel, cg: cg };
  }

  function fmt(n, unit) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Math.round(n).toLocaleString() + (unit ? ' ' + unit : '');
  }
  function fmt1(n, unit) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return n.toFixed(1) + (unit ? ' ' + unit : '');
  }

  function render() {
    var inp = readInputs();

    // Takeoff
    $('toGroundRun').textContent = fmt(ladderResult('fig5-06', inp.altFt, inp.oatF, inp.toWeight, inp.wind), 'ft');
    $('toDist50').textContent = fmt(ladderResult('fig5-07', inp.altFt, inp.oatF, inp.toWeight, inp.wind), 'ft');
    $('accelStop').textContent = fmt(ladderResult('fig5-08', inp.altFt, inp.oatF, inp.toWeight, inp.wind), 'ft');

    // Takeoff - immediate return & land (landing charts evaluated AT TAKEOFF WEIGHT)
    $('irGroundRoll').textContent = fmt(ladderResult('fig5-15', inp.altFt, inp.oatF, inp.toWeight, inp.wind), 'ft');
    $('irDist50').textContent = fmt(ladderResult('fig5-16', inp.altFt, inp.oatF, inp.toWeight, inp.wind), 'ft');

    // Landing (at destination landing weight)
    $('ldgGroundRoll').textContent = fmt(ladderResult('fig5-15', inp.altFt, inp.oatF, inp.ldgWeight, inp.wind), 'ft');
    $('ldgDist50').textContent = fmt(ladderResult('fig5-16', inp.altFt, inp.oatF, inp.ldgWeight, inp.wind), 'ft');

    // Go-around / balked landing (clean-config climb reference, at landing weight)
    var vv = vxvy(inp.altFt);
    $('gaVxMulti').textContent = fmt(vv.multiVx, 'mph');
    $('gaVyMulti').textContent = fmt(vv.multiVy, 'mph');
    $('gaVxSingle').textContent = fmt(vv.singleVx, 'mph') + (vv.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('gaVySingle').textContent = fmt(vv.singleVy, 'mph') + (vv.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('gaRocMulti').textContent = fmt(rocFromCurves(DATA['fig5-09'].weightCurves, inp.altFt, inp.ldgWeight), 'ft/min');
    var gaRocSingle = rocFromCurves(DATA['fig5-10'].weightCurves, inp.altFt, inp.ldgWeight);
    $('gaRocSingle').textContent = fmt(gaRocSingle, 'ft/min') + (gaRocSingle <= 0 ? ' — at or above single-engine service ceiling' : '');

    // Climb (at takeoff weight — initial climb-out performance)
    $('vxMulti').textContent = fmt(vv.multiVx, 'mph');
    $('vyMulti').textContent = fmt(vv.multiVy, 'mph');
    $('vxSingle').textContent = fmt(vv.singleVx, 'mph') + (vv.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('vySingle').textContent = fmt(vv.singleVy, 'mph') + (vv.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('rocMulti').textContent = fmt(rocFromCurves(DATA['fig5-09'].weightCurves, inp.altFt, inp.toWeight), 'ft/min');
    var rocSingle = rocFromCurves(DATA['fig5-10'].weightCurves, inp.altFt, inp.toWeight);
    $('rocSingle').textContent = fmt(rocSingle, 'ft/min') + (rocSingle <= 0 ? ' — at or above single-engine service ceiling' : '');

    // Cruise
    $('tas').textContent = fmt(byPower(DATA['fig5-12'].powerCurves, inp.altFt, inp.power), 'mph TAS');
    var fullRange = byPower(DATA['fig5-13'].powerCurves, inp.altFt, inp.power);
    var fullEndurance = byPower(DATA['fig5-14'].powerCurves, inp.altFt, inp.power);
    var fuelFraction = inp.fuel / DATA['fig5-13'].fuelGal;
    $('range').textContent = fmt(fullRange * fuelFraction, 'sm');
    $('endurance').textContent = fmt1(fullEndurance * fuelFraction, 'hr');

    // Weight & balance
    renderCg(inp);
  }

  function renderCg(inp) {
    var poly = DATA['fig6-01'].polygon;
    var svg = $('cgSvg');
    var statusEl = $('cgStatus');
    var cg = inp.cg;
    var weight = inp.toWeight;

    var xs = poly.map(function (p) { return p[0]; });
    var ys = poly.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs) - 1.5, maxX = Math.max.apply(null, xs) + 1.5;
    var minY = Math.min.apply(null, ys) - 150, maxY = Math.max.apply(null, ys) + 150;

    function sx(x) { return 50 + (x - minX) / (maxX - minX) * 400; }
    function sy(y) { return 330 - (y - minY) / (maxY - minY) * 300; }

    var pts = poly.map(function (p) { return sx(p[0]) + ',' + sy(p[1]); }).join(' ');

    var gridlines = '';
    [2400, 2800, 3200, 3600].forEach(function (w) {
      gridlines += '<line x1="50" y1="' + sy(w) + '" x2="450" y2="' + sy(w) + '" class="cg-grid"/>' +
        '<text x="44" y="' + (sy(w) + 4) + '" class="cg-axis-label" text-anchor="end">' + w + '</text>';
    });
    [82, 84, 86, 88, 90, 92].forEach(function (c) {
      if (c < minX || c > maxX) return;
      gridlines += '<line x1="' + sx(c) + '" y1="30" x2="' + sx(c) + '" y2="330" class="cg-grid"/>' +
        '<text x="' + sx(c) + '" y="345" class="cg-axis-label" text-anchor="middle">' + c + '</text>';
    });

    var pointMarker = '';
    var inLimits = null;
    if (!isNaN(cg)) {
      inLimits = pointInPolygon([cg, weight], poly) || pointInPolygon([cg, Math.min(weight, 3600)], poly);
      var markerClass = inLimits ? 'cg-point-ok' : 'cg-point-bad';
      pointMarker = '<circle cx="' + sx(cg) + '" cy="' + sy(weight) + '" r="7" class="' + markerClass + '"/>';
    }

    svg.innerHTML =
      gridlines +
      '<polygon points="' + pts + '" class="cg-envelope"/>' +
      pointMarker +
      '<text x="250" y="18" class="cg-axis-title" text-anchor="middle">Weight (lb) vs C.G. (in aft of datum)</text>';

    if (isNaN(cg)) {
      statusEl.textContent = 'Enter a C.G. value to plot it against the envelope.';
      statusEl.className = 'cg-status';
    } else if (inLimits) {
      statusEl.textContent = '✓ Within the approved C.G. envelope at ' + weight + ' lb / ' + cg.toFixed(1) + ' in.';
      statusEl.className = 'cg-status cg-status-ok';
    } else {
      statusEl.textContent = '✗ Outside the approved C.G. envelope at ' + weight + ' lb / ' + cg.toFixed(1) + ' in. Do not fly without rebalancing.';
      statusEl.className = 'cg-status cg-status-bad';
    }
  }

  function renderPowerTable() {
    var fig = DATA['fig5-17'];
    var tbody = $('powerTableBody');
    var rows = fig.rows.map(function (r) {
      function cell(block, rpm) {
        if (!block || !block.mp || block.mp[rpm] === undefined) return '<td>—</td>';
        return '<td>' + block.mp[rpm] + '</td>';
      }
      return '<tr><td>' + r.altitude + '</td><td>' + r.stdTempF + ' / ' + r.stdTempC + '</td>' +
        cell(r.p55, '2100') + cell(r.p55, '2200') + cell(r.p55, '2300') + cell(r.p55, '2400') +
        cell(r.p65, '2100') + cell(r.p65, '2200') + cell(r.p65, '2300') + cell(r.p65, '2400') +
        cell(r.p75, '2200') + cell(r.p75, '2300') + cell(r.p75, '2400') +
        '</tr>';
    }).join('');
    tbody.innerHTML = rows;
  }

  function runVerification() {
    var ids = ['fig5-06', 'fig5-07', 'fig5-08', 'fig5-15', 'fig5-16'];
    var lines = ids.map(function (id) {
      var v = verifyLadder(id);
      return DATA[id].title + ': computed ' + v.computed + ' ft vs chart example ' + v.chartReading +
        ' ft (' + (v.pctErr >= 0 ? '+' : '') + v.pctErr.toFixed(1) + '%)';
    });
    console.log('PA-30 calculator — worked-example self-check:\n' + lines.join('\n'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderPowerTable();
    render();
    runVerification();
    document.querySelectorAll('input, select').forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });

    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline caching is a nice-to-have, never block the app on it */ });
    }
  });
})();
