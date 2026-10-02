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

  var KT_TO_MPH = 1.15078;

  // Standard rule-of-thumb density altitude: DA = PA + 120 * (OAT - ISA temp at PA),
  // using the standard lapse rate of 2 degrees C per 1000 ft from a 15 degree C sea-level
  // baseline. This is the same approximation taught in FAA ground school material; it is
  // for pilot situational awareness only -- the POH ladder charts in this calculator take
  // pressure altitude and OAT directly, not density altitude.
  function isaTempC(paFt) { return 15 - 2 * (paFt / 1000); }
  function densityAltitude(paFt, oatC) { return paFt + 120 * (oatC - isaTempC(paFt)); }

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

  // Raw (unclamped, unrounded) ROC at a given density altitude and weight --
  // linear in da for a fixed weight, which rocFromCurves() and ceilingDa()
  // both rely on (the latter solves this line algebraically for a target ROC).
  function rocRaw(curves, da, weightLb) {
    var weights = Object.keys(curves).map(Number).sort(function (a, b) { return a - b; });
    var wClamped = clamp(weightLb, weights[0], weights[weights.length - 1]);
    var w0, w1;
    for (var i = 0; i < weights.length - 1; i++) {
      if (wClamped >= weights[i] && wClamped <= weights[i + 1]) { w0 = weights[i]; w1 = weights[i + 1]; break; }
    }
    if (w0 === undefined) { w0 = weights[0]; w1 = weights[1]; }
    function rocAt(w) {
      var c = curves[w];
      return lerp(0, c.seaLevel, c.daAtZero, 0, da);
    }
    var r0 = rocAt(w0), r1 = rocAt(w1);
    return lerp(w0, r0, w1, r1, wClamped);
  }

  function rocFromCurves(curves, da, weightLb) {
    var weights = Object.keys(curves).map(Number);
    var maxDaAtZero = Math.max.apply(null, weights.map(function (w) { return curves[w].daAtZero; }));
    var daClamped = clamp(da, 0, maxDaAtZero * 1.3);
    return Math.max(0, Math.round(rocRaw(curves, daClamped, weightLb)));
  }

  // Solve for the density altitude at which this weight's ROC line crosses
  // targetRoc (0 = absolute ceiling; 100 ME / 50 SE = service ceiling, per
  // the POH's own definitions). The line is sampled at two points rather than
  // inverting the lerp algebra inline, since rocRaw() is linear in da for a
  // fixed weight -- two samples fully determine it.
  function ceilingDa(curves, weightLb, targetRoc) {
    var da1 = 0, da2 = 20000;
    var r1 = rocRaw(curves, da1, weightLb);
    var r2 = rocRaw(curves, da2, weightLb);
    if (r2 === r1) return null;
    return da1 + (targetRoc - r1) * (da2 - da1) / (r2 - r1);
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

  // ---------- airspeed calibration (IAS -> CAS) ----------

  function casFromIas(iasMph, flapsExtended) {
    var fig = DATA['fig5-02'];
    if (!fig) return iasMph;
    var curve = flapsExtended ? fig.curves.flapsFullyExtended : fig.curves.flapsRetracted;
    var pts = curve.map(function (p) { return { x: p[0], y: p[1] }; });
    var corr = interpBreakpoints(pts, iasMph, true);
    return iasMph + corr;
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
    var depAltFt = parseFloat($('depPressureAlt').value) || 0;
    var destAltFt = parseFloat($('destPressureAlt').value) || 0;
    // OAT is Celsius-only input now (no F/C toggle) -- convert to F once here
    // since the POH ladder-chart formulas are calibrated in Fahrenheit.
    var depOatC = parseFloat($('depOat').value);
    if (isNaN(depOatC)) depOatC = 15;
    var depOatF = cToF(depOatC);
    var destOatC = parseFloat($('destOat').value);
    if (isNaN(destOatC)) destOatC = 15;
    var destOatF = cToF(destOatC);
    var toWeight = clamp(parseFloat($('toWeight').value) || 3600, 1500, 3600);
    var ldgWeightRaw = parseFloat($('ldgWeight').value);
    var ldgWeight = isNaN(ldgWeightRaw) ? toWeight : clamp(ldgWeightRaw, 1500, 3600);
    // Wind fields are entered/displayed in knots; the POH ladder charts' own
    // axis (and the weightExponent/windKPerMph constants fit to it) are in
    // mph, so convert at this boundary and keep everything downstream in mph.
    var depWindKt = parseFloat($('depWind').value) || 0;
    var destWindKt = parseFloat($('destWind').value) || 0;
    var depWind = depWindKt * KT_TO_MPH;
    var destWind = destWindKt * KT_TO_MPH;
    var power = clamp(parseFloat($('power').value) || 65, 45, 75);
    // Usable fuel on board is just whatever's loaded in the Weight & Balance
    // worksheet's tanks -- no separate field to keep in sync with that.
    var fuel = clamp(wbNum('wbMainGal') + wbNum('wbAuxGal'), 0, 84);
    var cg = parseFloat($('cg').value);
    var ldgCg = parseFloat($('ldgCg').value);
    return { depAltFt: depAltFt, destAltFt: destAltFt, depOatC: depOatC, destOatC: destOatC, depOatF: depOatF, destOatF: destOatF, toWeight: toWeight, ldgWeight: ldgWeight, depWind: depWind, destWind: destWind, power: power, fuel: fuel, cg: cg, ldgCg: ldgCg };
  }

  function fmt(n, unit) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Math.round(n).toLocaleString() + (unit ? ' ' + unit : '');
  }
  function fmt1(n, unit) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return n.toFixed(1) + (unit ? ' ' + unit : '');
  }
  function resultTile(label, value, small) {
    return '<div class="result"><div class="label">' + label + '</div><div class="value">' + value +
      (small ? '<small>' + small + '</small>' : '') + '</div></div>';
  }

  function render() {
    var inp = readInputs();
    $('depDA').textContent = fmt(densityAltitude(inp.depAltFt, inp.depOatC), 'ft');
    $('destDA').textContent = fmt(densityAltitude(inp.destAltFt, inp.destOatC), 'ft');

    // Takeoff (at departure pressure altitude/wind)
    $('toGroundRun').textContent = fmt(ladderResult('fig5-06', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind), 'ft');
    $('toDist50').textContent = fmt(ladderResult('fig5-07', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind), 'ft');
    $('accelStop').textContent = fmt(ladderResult('fig5-08', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind), 'ft');

    // Takeoff - immediate return & land (landing charts at departure altitude/wind/OAT, at takeoff weight)
    $('irGroundRoll').textContent = fmt(ladderResult('fig5-15', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind), 'ft');
    $('irDist50').textContent = fmt(ladderResult('fig5-16', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind), 'ft');

    // Landing (at destination pressure altitude/wind/OAT, destination landing weight)
    $('ldgGroundRoll').textContent = fmt(ladderResult('fig5-15', inp.destAltFt, inp.destOatF, inp.ldgWeight, inp.destWind), 'ft');
    $('ldgDist50').textContent = fmt(ladderResult('fig5-16', inp.destAltFt, inp.destOatF, inp.ldgWeight, inp.destWind), 'ft');

    // Go-around / balked landing (clean-config climb reference, at destination altitude/landing weight)
    var vvDest = vxvy(inp.destAltFt);
    $('gaVxMulti').textContent = fmt(vvDest.multiVx, 'mph');
    $('gaVyMulti').textContent = fmt(vvDest.multiVy, 'mph');
    $('gaVxSingle').textContent = fmt(vvDest.singleVx, 'mph') + (vvDest.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('gaVySingle').textContent = fmt(vvDest.singleVy, 'mph') + (vvDest.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('gaVxyMultiCas').textContent = 'CAS: ' + fmt(casFromIas(vvDest.multiVx, false), 'mph') + ' / ' + fmt(casFromIas(vvDest.multiVy, false), 'mph');
    $('gaVxySingleCas').textContent = 'CAS: ' + fmt(casFromIas(vvDest.singleVx, false), 'mph') + ' / ' + fmt(casFromIas(vvDest.singleVy, false), 'mph');
    $('gaRocMulti').textContent = fmt(rocFromCurves(DATA['fig5-09'].weightCurves, inp.destAltFt, inp.ldgWeight), 'ft/min');
    var gaRocSingle = rocFromCurves(DATA['fig5-10'].weightCurves, inp.destAltFt, inp.ldgWeight);
    $('gaRocSingle').textContent = fmt(gaRocSingle, 'ft/min') + (gaRocSingle <= 0 ? ' — at or above single-engine service ceiling' : '');

    // Climb (at departure altitude/takeoff weight — initial climb-out performance)
    var vvDep = vxvy(inp.depAltFt);
    $('vxMulti').textContent = fmt(vvDep.multiVx, 'mph');
    $('vyMulti').textContent = fmt(vvDep.multiVy, 'mph');
    $('vxSingle').textContent = fmt(vvDep.singleVx, 'mph') + (vvDep.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('vySingle').textContent = fmt(vvDep.singleVy, 'mph') + (vvDep.aboveSingleCeiling ? ' (above single-engine ceiling)' : '');
    $('vxyMultiCas').textContent = 'CAS: ' + fmt(casFromIas(vvDep.multiVx, false), 'mph') + ' / ' + fmt(casFromIas(vvDep.multiVy, false), 'mph');
    $('vxySingleCas').textContent = 'CAS: ' + fmt(casFromIas(vvDep.singleVx, false), 'mph') + ' / ' + fmt(casFromIas(vvDep.singleVy, false), 'mph');
    $('rocMulti').textContent = fmt(rocFromCurves(DATA['fig5-09'].weightCurves, inp.depAltFt, inp.toWeight), 'ft/min');
    var rocSingle = rocFromCurves(DATA['fig5-10'].weightCurves, inp.depAltFt, inp.toWeight);
    $('rocSingle').textContent = fmt(rocSingle, 'ft/min') + (rocSingle <= 0 ? ' — at or above single-engine service ceiling' : '');

    var meCeilAbs = ceilingDa(DATA['fig5-09'].weightCurves, inp.toWeight, 0);
    var meCeilSvc = ceilingDa(DATA['fig5-09'].weightCurves, inp.toWeight, 100);
    $('ceilMulti').textContent = fmt(meCeilAbs, 'ft') + ' / ' + fmt(meCeilSvc, 'ft');
    var seCeilAbs = ceilingDa(DATA['fig5-10'].weightCurves, inp.toWeight, 0);
    var seCeilSvc = ceilingDa(DATA['fig5-10'].weightCurves, inp.toWeight, 50);
    $('ceilSingle').textContent = fmt(seCeilAbs, 'ft') + ' / ' + fmt(seCeilSvc, 'ft');

    // Cruise (referenced to departure altitude as the climb-out continues from there)
    $('tas').textContent = fmt(byPower(DATA['fig5-12'].powerCurves, inp.depAltFt, inp.power), 'mph TAS');
    var fullRange = byPower(DATA['fig5-13'].powerCurves, inp.depAltFt, inp.power);
    var fullEndurance = byPower(DATA['fig5-14'].powerCurves, inp.depAltFt, inp.power);
    var fuelFraction = inp.fuel / DATA['fig5-13'].fuelGal;
    $('range').textContent = fmt(fullRange * fuelFraction, 'sm');
    $('endurance').textContent = fmt1(fullEndurance * fuelFraction, 'hr');

    // Weight & balance
    renderCg(inp);

    // Personal minimums
    renderPersonalMinimums(inp);

    // Climb/cruise/descent plan depends on several Conditions-card fields
    // (weight, wind-derived PA, power, fuel) in addition to the Route card's
    // own inputs, so refresh it here too rather than only on route-specific
    // field changes. computeRoute()'s winds-aloft fetch is cached (55 min),
    // so this is cheap after the first call.
    computeRoute();
  }

  // ---------- personal minimums ----------

  var lastAirportInfo = { dep: null, dest: null }; // { elev, longestRwy } | null, set from the Airports card lookup

  function getAvailableRunwayLength(prefix) {
    var sel = $(prefix + 'Runway');
    if (sel && sel.value) {
      var len = parseFloat(sel.value.split('|')[2]);
      if (!isNaN(len)) return len;
    }
    var info = lastAirportInfo[prefix];
    return (info && typeof info.longestRwy === 'number') ? info.longestRwy : null;
  }

  function pmRow(label, value, ok) {
    var cls = ok === null ? '' : (ok ? 'cg-status-ok' : 'cg-status-bad');
    var mark = ok === null ? '' : (ok ? '✓ ' : '✗ ');
    return '<div class="result"><div class="label">' + label + '</div>' +
      '<div class="value ' + cls + '" style="font-size:1rem;">' + mark + value + '</div></div>';
  }

  function renderPersonalMinimums(inp) {
    var el = $('pmResults');
    if (!el) return;
    var rows = [];
    var toFactor = clamp(parseFloat($('pmTakeoffFactor').value) || 1.5, 1, 5);
    var ldgFactor = clamp(parseFloat($('pmLandingFactor').value) || 1.5, 1, 5);
    var noFlapMin = parseFloat($('pmNoFlapMinLda').value) || 4000;
    var ceilMargin = parseFloat($('pmCeilingMargin').value) || 1000;
    var noFlap = $('pmNoFlapLanding').checked;

    // Takeoff: accelerate-stop must fit the runway, and 50ft takeoff distance
    // times your safety factor must also fit.
    var depRwy = getAvailableRunwayLength('dep');
    if (depRwy === null) {
      rows.push(pmRow('Takeoff runway check', 'Select/confirm a departure runway (or airport) above to check', null));
    } else {
      var asd = ladderResult('fig5-08', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind);
      var tod50 = ladderResult('fig5-07', inp.depAltFt, inp.depOatF, inp.toWeight, inp.depWind);
      rows.push(pmRow('Accelerate-stop distance vs runway', fmt(asd, 'ft') + ' vs ' + fmt(depRwy, 'ft') + ' available', asd <= depRwy));
      rows.push(pmRow('Takeoff dist. (50ft) × ' + toFactor + ' vs runway', fmt(tod50 * toFactor, 'ft') + ' needed vs ' + fmt(depRwy, 'ft') + ' available', tod50 * toFactor <= depRwy));
    }

    // Landing: either the no-flap minimum-runway rule, or 50ft landing distance times your factor.
    var destRwy = getAvailableRunwayLength('dest');
    if (destRwy === null) {
      rows.push(pmRow('Landing runway check', 'Select/confirm a destination runway (or airport) above to check', null));
    } else if (noFlap) {
      rows.push(pmRow('No-flap landing minimum runway', fmt(destRwy, 'ft') + ' available vs ' + fmt(noFlapMin, 'ft') + ' minimum', destRwy >= noFlapMin));
    } else {
      var lnd50 = ladderResult('fig5-16', inp.destAltFt, inp.destOatF, inp.ldgWeight, inp.destWind);
      rows.push(pmRow('Landing dist. (50ft) × ' + ldgFactor + ' vs runway', fmt(lnd50 * ldgFactor, 'ft') + ' needed vs ' + fmt(destRwy, 'ft') + ' available', lnd50 * ldgFactor <= destRwy));
    }

    // Highest airport: single-engine service ceiling, less your margin, must stay
    // above the actual density altitude at departure, destination, and cruise.
    var seCeilSvc = ceilingDa(DATA['fig5-10'].weightCurves, inp.toWeight, 50);
    var threshold = seCeilSvc - ceilMargin;
    function daCheck(label, daVal) {
      if (daVal === null || isNaN(daVal)) { rows.push(pmRow(label, 'Enter OAT to compute', null)); return; }
      rows.push(pmRow(label, fmt(daVal, 'ft DA') + ' vs ' + fmt(threshold, 'ft DA') + ' limit', daVal <= threshold));
    }
    daCheck('Departure DA vs SE service ceiling − margin', densityAltitude(inp.depAltFt, inp.depOatC));
    daCheck('Destination DA vs SE service ceiling − margin', densityAltitude(inp.destAltFt, inp.destOatC));
    var cruiseOatRaw = parseFloat($('cruiseOat').value);
    if (!isNaN(cruiseOatRaw)) {
      var cruiseOatC = $('cruiseOatUnit').value === 'F' ? (cruiseOatRaw - 32) * 5 / 9 : cruiseOatRaw;
      daCheck('Cruise DA vs SE service ceiling − margin', densityAltitude(cruisePaFt(), cruiseOatC));
    }

    el.innerHTML = rows.join('');
  }

  // ---------- weight & balance worksheet ----------

  var WB_PILOT_ARM = 84.8, WB_REAR_ARM = 120.5, WB_BAG_ARM = 142, WB_MAIN_ARM = 90, WB_AUX_ARM = 95;
  var WB_GEAR_MOMENT_SHIFT = 770;
  var WB_MAX_GROSS = 3600;
  var WB_MAX_BAG = 250;
  var WB_MAIN_CAP_GAL = 54, WB_AUX_CAP_GAL = 30;
  var WB_FUEL_LB_PER_GAL = 6;

  function wbNum(id) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? 0 : v;
  }

  // Computes the loading worksheet (empty weight through takeoff/landing weight
  // and C.G., both gear positions) and pushes the gear-extended takeoff/landing
  // results into the toWeight/ldgWeight/cg fields that drive the rest of the
  // app. Only runs on a worksheet field's own input/change event (see the
  // dedicated listener in DOMContentLoaded), so a manual edit to toWeight/cg
  // afterward sticks until a worksheet field changes again.
  function renderWeightBalance() {
    var emptyWt = wbNum('wbEmptyWt');
    var emptyArm = wbNum('wbEmptyArm');
    var pilotWt = Math.max(0, wbNum('wbPilotWt'));
    var rearWt = Math.max(0, wbNum('wbRearWt'));
    var bagWt = Math.max(0, wbNum('wbBagWt'));
    var mainGal = clamp(wbNum('wbMainGal'), 0, WB_MAIN_CAP_GAL);
    var auxGal = clamp(wbNum('wbAuxGal'), 0, WB_AUX_CAP_GAL);
    var mainBurnGal = Math.max(0, wbNum('wbMainBurnGal'));
    var auxBurnGal = Math.max(0, wbNum('wbAuxBurnGal'));

    var emptyMoment = emptyWt * emptyArm;
    var pilotMoment = pilotWt * WB_PILOT_ARM;
    var rearMoment = rearWt * WB_REAR_ARM;
    var bagMoment = bagWt * WB_BAG_ARM;
    $('wbEmptyMoment').textContent = fmt(emptyMoment);
    $('wbPilotMoment').textContent = fmt(pilotMoment);
    $('wbRearMoment').textContent = fmt(rearMoment);
    $('wbBagMoment').textContent = fmt(bagMoment);

    var preFuelWt = emptyWt + pilotWt + rearWt + bagWt;
    var preFuelMoment = emptyMoment + pilotMoment + rearMoment + bagMoment;
    var preFuelArm = preFuelWt > 0 ? preFuelMoment / preFuelWt : 0;
    $('wbPreFuelWt').textContent = fmt(preFuelWt);
    $('wbPreFuelArm').textContent = preFuelWt > 0 ? preFuelArm.toFixed(2) : '—';
    $('wbPreFuelMoment').textContent = fmt(preFuelMoment);

    var mainWt = mainGal * WB_FUEL_LB_PER_GAL, auxWt = auxGal * WB_FUEL_LB_PER_GAL;
    var mainMoment = mainWt * WB_MAIN_ARM, auxMoment = auxWt * WB_AUX_ARM;
    $('wbMainMoment').textContent = fmt(mainMoment);
    $('wbAuxMoment').textContent = fmt(auxMoment);

    var toWt = preFuelWt + mainWt + auxWt;
    var toMomentExt = preFuelMoment + mainMoment + auxMoment;
    var toArmExt = toWt > 0 ? toMomentExt / toWt : 0;
    $('wbToWtExt').textContent = fmt(toWt);
    $('wbToArmExt').textContent = toWt > 0 ? toArmExt.toFixed(2) : '—';
    $('wbToMomentExt').textContent = fmt(toMomentExt);

    var toMomentRet = toMomentExt + WB_GEAR_MOMENT_SHIFT;
    var toArmRet = toWt > 0 ? toMomentRet / toWt : 0;
    $('wbToWtRet').textContent = fmt(toWt);
    $('wbToArmRet').textContent = toWt > 0 ? toArmRet.toFixed(2) : '—';
    $('wbToMomentRet').textContent = fmt(toMomentRet);

    var toStatusBits = [];
    if (toWt > WB_MAX_GROSS) toStatusBits.push('✗ Takeoff weight ' + fmt(toWt, 'lb') + ' exceeds max gross ' + WB_MAX_GROSS + ' lb');
    if (bagWt > WB_MAX_BAG) toStatusBits.push('✗ Baggage ' + fmt(bagWt, 'lb') + ' exceeds the 250 lb max');
    $('wbToStatus').textContent = toStatusBits.length ? toStatusBits.join(' · ') : '✓ Takeoff weight within gross and baggage limits.';
    $('wbToStatus').className = 'hint' + (toStatusBits.length ? ' wb-bad' : '');

    var mainBurnWt = Math.min(mainBurnGal, mainGal) * WB_FUEL_LB_PER_GAL;
    var auxBurnWt = Math.min(auxBurnGal, auxGal) * WB_FUEL_LB_PER_GAL;
    var mainBurnMoment = mainBurnWt * WB_MAIN_ARM, auxBurnMoment = auxBurnWt * WB_AUX_ARM;
    $('wbMainBurnMoment').textContent = fmt(mainBurnMoment);
    $('wbAuxBurnMoment').textContent = fmt(auxBurnMoment);

    var descWt = toWt - mainBurnWt - auxBurnWt;
    var descMoment = toMomentRet - mainBurnMoment - auxBurnMoment;
    var descArm = descWt > 0 ? descMoment / descWt : 0;
    $('wbDescWtRet').textContent = fmt(descWt);
    $('wbDescArmRet').textContent = descWt > 0 ? descArm.toFixed(2) : '—';
    $('wbDescMomentRet').textContent = fmt(descMoment);

    var ldgMomentExt = descMoment - WB_GEAR_MOMENT_SHIFT;
    var ldgArmExt = descWt > 0 ? ldgMomentExt / descWt : 0;
    $('wbLdgWtExt').textContent = fmt(descWt);
    $('wbLdgArmExt').textContent = descWt > 0 ? ldgArmExt.toFixed(2) : '—';
    $('wbLdgMomentExt').textContent = fmt(ldgMomentExt);

    var ldgStatusBits = [];
    if (descWt > WB_MAX_GROSS) ldgStatusBits.push('✗ Landing weight ' + fmt(descWt, 'lb') + ' exceeds max gross ' + WB_MAX_GROSS + ' lb');
    if (mainBurnGal + auxBurnGal > mainGal + auxGal + 0.001) ldgStatusBits.push('✗ Fuel burned exceeds fuel loaded');
    $('wbLdgStatus').textContent = ldgStatusBits.length ? ldgStatusBits.join(' · ') : '✓ Landing weight within max gross.';
    $('wbLdgStatus').className = 'hint' + (ldgStatusBits.length ? ' wb-bad' : '');

    if (toWt > 0) {
      $('toWeight').value = Math.round(toWt * 10) / 10;
      $('cg').value = toArmExt.toFixed(2);
    }
    if (descWt > 0) {
      $('ldgWeight').value = Math.round(descWt * 10) / 10;
      $('ldgCg').value = ldgArmExt.toFixed(2);
    }
    render();
  }

  function cgCheck(cg, weight, poly) {
    if (isNaN(cg) || isNaN(weight)) return null;
    return pointInPolygon([cg, weight], poly) || pointInPolygon([cg, Math.min(weight, 3600)], poly);
  }

  function renderCg(inp) {
    var poly = DATA['fig6-01'].polygon;
    var svg = $('cgSvg');
    var statusEl = $('cgStatus');

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

    var toOk = cgCheck(inp.cg, inp.toWeight, poly);
    var ldgOk = cgCheck(inp.ldgCg, inp.ldgWeight, poly);

    var markers = '';
    if (toOk !== null) {
      var tx = sx(inp.cg), ty = sy(inp.toWeight);
      markers += '<circle cx="' + tx + '" cy="' + ty + '" r="7" class="' + (toOk ? 'cg-point-ok' : 'cg-point-bad') + '"/>' +
        '<text x="' + (tx + 11) + '" y="' + (ty + 4) + '" class="cg-point-label">T/O</text>';
    }
    if (ldgOk !== null) {
      var lx = sx(inp.ldgCg), ly = sy(inp.ldgWeight);
      var d = 7;
      markers += '<polygon points="' + lx + ',' + (ly - d) + ' ' + (lx + d) + ',' + ly + ' ' + lx + ',' + (ly + d) + ' ' + (lx - d) + ',' + ly +
        '" class="' + (ldgOk ? 'cg-point-ok' : 'cg-point-bad') + '"/>' +
        '<text x="' + (lx + 11) + '" y="' + (ly + 4) + '" class="cg-point-label">LDG</text>';
    }

    svg.innerHTML =
      gridlines +
      '<polygon points="' + pts + '" class="cg-envelope"/>' +
      markers +
      '<text x="250" y="18" class="cg-axis-title" text-anchor="middle">Weight (lb) vs C.G. (in aft of datum)</text>';

    var lines = [];
    if (toOk === null) {
      lines.push('Enter a takeoff C.G. (or fill in the worksheet below) to plot it against the envelope.');
    } else {
      lines.push((toOk ? '✓' : '✗') + ' Takeoff: ' + fmt(inp.toWeight, 'lb') + ' / ' + inp.cg.toFixed(1) + ' in' + (toOk ? '' : ' — outside the approved envelope'));
    }
    if (ldgOk === null) {
      lines.push('Enter a landing C.G. (or fill in the worksheet below) to plot it against the envelope.');
    } else {
      lines.push((ldgOk ? '✓' : '✗') + ' Landing: ' + fmt(inp.ldgWeight, 'lb') + ' / ' + inp.ldgCg.toFixed(1) + ' in' + (ldgOk ? '' : ' — outside the approved envelope'));
    }
    statusEl.innerHTML = lines.join('<br>');
    statusEl.className = 'cg-status' + ((toOk === false || ldgOk === false) ? ' cg-status-bad' : (toOk && ldgOk ? ' cg-status-ok' : ''));
  }

  // ---------- airport lookup ----------

  var SURFACE_NAMES = {
    ASP: 'asphalt', 'ASPH-G': 'asphalt/gravel', 'ASPH-CONC-G': 'asphalt/concrete/gravel',
    CON: 'concrete', PEM: 'asphalt/concrete', GRS: 'grass', TURF: 'turf', GRE: 'gravel',
    GRAVEL: 'gravel', WAT: 'water', DIRT: 'dirt', SAND: 'sand', SNOW: 'snow/ice'
  };

  var WEATHER_PROXY = 'https://pa30-avwx-airport-info-proxy.taylordonato003.workers.dev';
  var wxTimers = {};
  var wxRequestSeq = {};
  var lastWind = {}; // keyed by prefix ('dep'/'dest') -> { dirDeg, speedKt } | null
  var lastTaf = {}; // keyed by prefix -> parsed TAF object ({fcsts: [...], ...}) | null, for ETA cross-reference
  var lastOpenMeteo = {}; // keyed by prefix -> {time:[], tempC:[], windKt:[], windDirDeg:[], altimIn:[]} | null (global, wind+temp+pressure, no auth/CORS needed)

  function hpaToInHg(hpa) { return hpa / 33.8639; }

  // Normalize an angle difference to (-180, 180].
  function angleDiff(a, b) {
    var d = (a - b) % 360;
    if (d <= -180) d += 360;
    if (d > 180) d -= 360;
    return d;
  }

  function clearWeather(wxElId) {
    wxRequestSeq[wxElId] = (wxRequestSeq[wxElId] || 0) + 1; // invalidate any in-flight fetch
    clearTimeout(wxTimers[wxElId]);
    var el = $(wxElId);
    el.className = 'weather-info';
    el.innerHTML = '';
  }

  function populateRunways(icao, rwySelectId, rwyFieldWrapId) {
    var RUNWAYS = window.PA30_RUNWAYS || {};
    var select = $(rwySelectId);
    var wrap = $(rwyFieldWrapId);
    select.innerHTML = '<option value="">— select —</option>';
    var ends = RUNWAYS[icao];
    if (!ends || !ends.length) {
      wrap.hidden = true;
      return;
    }
    ends.forEach(function (e) {
      var opt = document.createElement('option');
      opt.value = e.hdg + '|' + e.id + '|' + e.len;
      var label = 'Rwy ' + e.id + ' (' + e.hdg + '°) — ' + e.len.toLocaleString() + ' ft';
      if (e.srf) label += ' ' + (SURFACE_NAMES[e.srf] || e.srf);
      opt.textContent = label;
      select.appendChild(opt);
    });
    wrap.hidden = false;
  }

  function computeWindComponent(prefix) {
    var windCalcEl = $(prefix + 'WindCalc');
    var select = $(prefix + 'Runway');
    var windFieldId = prefix + 'Wind';
    var wind = lastWind[prefix];
    var selVal = select.value;

    if (!selVal) {
      windCalcEl.className = 'wind-calc';
      windCalcEl.innerHTML = '';
      return;
    }
    if (!wind) {
      windCalcEl.className = 'wind-calc shown';
      windCalcEl.innerHTML = 'Waiting on live wind data for this runway’s headwind/crosswind — enter the wind component manually below if weather doesn’t load.';
      return;
    }

    var rwyHdg = parseInt(selVal.split('|')[0], 10);
    var rwyId = selVal.split('|')[1];
    var diff, headwindKt, crosswindKt;
    if (wind.dirDeg === null) { // reported calm or variable
      headwindKt = 0;
      crosswindKt = 0;
      diff = 0;
    } else {
      diff = angleDiff(wind.dirDeg, rwyHdg);
      var rad = diff * Math.PI / 180;
      headwindKt = wind.speedKt * Math.cos(rad);
      crosswindKt = wind.speedKt * Math.sin(rad);
    }
    var side = crosswindKt > 0.5 ? 'from the right' : (crosswindKt < -0.5 ? 'from the left' : '');

    $(windFieldId).value = Math.round(headwindKt);

    var headClass = headwindKt < 0 ? 'wc-head tailwind' : 'wc-head';
    var headLabel = headwindKt < 0 ? 'Tailwind' : 'Headwind';
    var html = '<span class="' + headClass + '">' + headLabel + ': ' + Math.abs(Math.round(headwindKt)) + ' kt</span>' +
      ' &middot; Crosswind: ' + Math.round(Math.abs(crosswindKt)) + ' kt' + (side ? ' ' + side : '') +
      '<br><span class="wx-note">Rwy ' + rwyId + ' (' + rwyHdg + '°) vs wind ' +
      (wind.dirDeg === null ? 'calm/variable' : wind.dirDeg + '°') + ' @ ' + Math.round(wind.speedKt) + ' kt — applied to the wind component field below, editable if you want to override.</span>';
    windCalcEl.className = 'wind-calc shown';
    windCalcEl.innerHTML = html;
  }

  function fetchWeather(icao, prefix, wxElId, paFieldId, elevFt, applyOat) {
    var wxEl = $(wxElId);
    var seq = (wxRequestSeq[wxElId] = (wxRequestSeq[wxElId] || 0) + 1);
    wxEl.className = 'weather-info shown';
    wxEl.textContent = 'Fetching live weather…';

    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timeoutId = setTimeout(function () { if (controller) controller.abort(); }, 8000);

    fetch(WEATHER_PROXY + '/metar?ids=' + encodeURIComponent(icao), { signal: controller ? controller.signal : undefined })
      .then(function (resp) {
        clearTimeout(timeoutId);
        if (!resp.ok) throw new Error('bad status');
        return resp.json();
      })
      .then(function (data) {
        if (seq !== wxRequestSeq[wxElId]) return; // superseded by a newer lookup
        if (!Array.isArray(data) || data.length === 0) {
          wxEl.innerHTML = 'No current METAR for ' + icao + ' — it may not be a reporting station.';
          return;
        }
        var m = data[0];
        var tempC = (typeof m.temp === 'number') ? m.temp : null;
        var tempF = (tempC !== null) ? cToF(tempC) : null;
        var altimInHg = (typeof m.altim === 'number') ? hpaToInHg(m.altim) : null;
        var ageMin = m.obsTime ? Math.round(Date.now() / 1000 - m.obsTime) / 60 : null;
        var stale = ageMin !== null && ageMin > 90;

        var bits = [];
        if (m.fltCat) bits.push('<span class="wx-flightcat ' + m.fltCat.toLowerCase() + '">' + m.fltCat + '</span>');
        if (tempF !== null) bits.push(Math.round(tempF) + '°F (' + Math.round(tempC) + '°C)');
        if (altimInHg !== null) bits.push(altimInHg.toFixed(2) + ' inHg');
        var windKnown = typeof m.wspd === 'number';
        if (windKnown) {
          var dirTxt = (!m.wdir && m.wdir !== 0) ? 'calm' : (m.wdir === 0 ? 'variable' : Math.round(m.wdir) + '°');
          bits.push('wind ' + dirTxt + ' @ ' + Math.round(m.wspd) + ' kt');
        }
        var ageTxt = ageMin !== null ? (ageMin <= 1 ? 'just now' : Math.round(ageMin) + ' min ago') : '';
        var html = bits.join(' &middot; ');
        if (ageTxt) html += ' <span class="' + (stale ? 'wx-stale' : '') + '">(' + ageTxt + (stale ? ' — may be stale' : '') + ')</span>';

        // Pressure altitude: field elevation corrected for the actual altimeter setting.
        var pa = null;
        if (typeof elevFt === 'number' && altimInHg !== null) {
          pa = Math.round(elevFt + (29.92 - altimInHg) * 1000);
          $(paFieldId).value = pa;
          html += '<span class="wx-breakdown">Pressure altitude = <code>' + elevFt + ' ft elev + (29.92 − ' +
            altimInHg.toFixed(2) + ') × 1000</code> = <strong>' + pa + ' ft</strong> (applied below)</span>';
        }
        // Density altitude: rule-of-thumb, reference only -- the POH charts use PA + OAT
        // directly, not DA, so this is shown for situational awareness, not applied anywhere.
        if (pa !== null && tempC !== null) {
          var isaC = isaTempC(pa);
          var da = Math.round(densityAltitude(pa, tempC));
          html += '<span class="wx-breakdown">Density altitude &asymp; <code>' + pa + ' ft PA + 120 × (' +
            Math.round(tempC) + '°C − ' + isaC.toFixed(1) + '°C ISA)</code> = <strong>' + da +
            ' ft</strong> <span class="wx-note">(reference only — the POH charts below use pressure altitude + OAT directly, not density altitude)</span></span>';
        }
        if (m.rawOb) html += '<span class="wx-raw">' + m.rawOb + '</span>';
        wxEl.innerHTML = html;

        if (applyOat && tempC !== null) {
          $(prefix + 'Oat').value = Math.round(tempC * 10) / 10;
        }

        lastWind[prefix] = windKnown ? { dirDeg: (m.wdir === 0 ? null : m.wdir), speedKt: m.wspd } : null;
        computeWindComponent(prefix);
        render();
      })
      .catch(function () {
        clearTimeout(timeoutId);
        if (seq !== wxRequestSeq[wxElId]) return;
        wxEl.innerHTML = 'Live weather unavailable right now — using field elevation / manual entry instead.';
        lastWind[prefix] = null;
        computeWindComponent(prefix);
      });
  }

  // ---------- TAF ----------

  function parseVisibMiles(s) {
    if (s === undefined || s === null) return null;
    s = String(s).trim();
    if (!s) return null;
    if (s.indexOf('+') >= 0) { var n0 = parseFloat(s); return isNaN(n0) ? null : n0; }
    if (s.indexOf('/') >= 0) {
      var whole = 0, frac = 0;
      s.split(' ').forEach(function (p) {
        if (p.indexOf('/') >= 0) { var fp = p.split('/'); frac = parseFloat(fp[0]) / parseFloat(fp[1]); }
        else { var w = parseFloat(p); if (!isNaN(w)) whole = w; }
      });
      return whole + frac;
    }
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function flightCategory(visibStr, clouds) {
    var ceiling = null;
    (clouds || []).forEach(function (c) {
      if ((c.cover === 'BKN' || c.cover === 'OVC') && (ceiling === null || c.base < ceiling)) ceiling = c.base;
    });
    var vis = parseVisibMiles(visibStr);
    if (vis === null && ceiling === null) return null;
    var effVis = vis === null ? 10 : vis;
    var effCeil = ceiling === null ? 99999 : ceiling;
    if (effCeil < 500 || effVis < 1) return 'LIFR';
    if (effCeil < 1000 || effVis < 3) return 'IFR';
    if (effCeil <= 3000 || effVis <= 5) return 'MVFR';
    return 'VFR';
  }

  function fmtZulu(unixSec) {
    var d = new Date(unixSec * 1000);
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return pad(d.getUTCDate()) + '/' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + 'Z';
  }

  function tafPeriodLabel(f) {
    var label = f.probability ? ('Prob ' + f.probability + '% ') : '';
    if (f.fcstChange === 'BECMG') return label + 'Becoming by ' + fmtZulu(f.timeBec || f.timeTo);
    if (f.fcstChange === 'TEMPO') return label + 'Temporarily ' + fmtZulu(f.timeFrom) + '–' + fmtZulu(f.timeTo);
    if (f.fcstChange) return label + f.fcstChange + ' ' + fmtZulu(f.timeFrom);
    return label + 'From ' + fmtZulu(f.timeFrom);
  }

  function fmtTafWind(f) {
    if (f.wdir === undefined || f.wdir === null) return f.wspd ? ('Var @ ' + f.wspd + ' kt') : '';
    var txt = f.wdir + '° @ ' + f.wspd + ' kt';
    if (f.wgst) txt += ' G' + f.wgst;
    return txt;
  }

  function fmtClouds(clouds) {
    if (!clouds || !clouds.length) return 'Sky clear';
    return clouds.map(function (c) { return c.cover + ' ' + c.base.toLocaleString() + ' ft'; }).join(', ');
  }

  function fetchTaf(icao, prefix) {
    var wrap = $(prefix + 'TafWrap');
    var el = $(prefix + 'Taf');
    fetch(WEATHER_PROXY + '/taf?ids=' + encodeURIComponent(icao))
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) { wrap.hidden = true; lastTaf[prefix] = null; computeRoute(); return; }
        var d = data[0];
        lastTaf[prefix] = d;
        var html = '<div class="wx-extra-body"><span class="wx-raw">' + d.rawTAF + '</span>';
        (d.fcsts || []).forEach(function (f) {
          var cat = flightCategory(f.visib, f.clouds);
          html += '<div class="taf-period"><span class="tp-change">' + tafPeriodLabel(f) + '</span>' +
            (cat ? '<span class="tp-flightcat ' + cat.toLowerCase() + '">' + cat + '</span>' : '') +
            '<br>' + fmtTafWind(f) + (f.visib ? (' · Vis ' + f.visib + ' SM') : '') + (f.wxString ? (' · ' + f.wxString) : '') +
            '<br>' + fmtClouds(f.clouds) + '</div>';
        });
        html += '</div>';
        el.innerHTML = html;
        wrap.hidden = false;
        computeRoute();
      })
      .catch(function () { wrap.hidden = true; lastTaf[prefix] = null; computeRoute(); });
  }

  // ---------- NWS extended outlook (no proxy needed -- api.weather.gov sends CORS: *) ----------

  function fetchOutlook(lat, lon, prefix) {
    var wrap = $(prefix + 'OutlookWrap');
    var el = $(prefix + 'Outlook');
    fetch('https://api.weather.gov/points/' + lat.toFixed(4) + ',' + lon.toFixed(4))
      .then(function (r) { if (!r.ok) throw new Error('not covered'); return r.json(); })
      .then(function (d) {
        var forecastUrl = d.properties && d.properties.forecast;
        if (!forecastUrl) throw new Error('no forecast url');
        return fetch(forecastUrl);
      })
      .then(function (r2) { if (!r2.ok) throw new Error('bad status'); return r2.json(); })
      .then(function (fd) {
        var periods = (fd.properties && fd.properties.periods) || [];
        if (!periods.length) { wrap.hidden = true; return; }
        var html = '<div class="wx-extra-body">';
        periods.slice(0, 8).forEach(function (p) {
          html += '<div class="outlook-period"><span class="op-name">' + p.name + '</span>: ' +
            p.temperature + '°' + p.temperatureUnit + ', ' + p.windSpeed + ' ' + p.windDirection +
            '<br>' + p.shortForecast + '</div>';
        });
        html += '<p class="wx-note">Source: National Weather Service (api.weather.gov) — US airports only.</p></div>';
        el.innerHTML = html;
        wrap.hidden = false;
      })
      .catch(function () { wrap.hidden = true; });
  }

  // Open-Meteo: free, no key, full CORS (Access-Control-Allow-Origin: *),
  // global coverage, hourly out to 16 days -- unlike TAF/NWS hourly, it also
  // has sea-level pressure, which is the one thing neither of those sources
  // forecasts at all. Default units (km/h, hPa) are converted to kt/inHg
  // here to match the rest of the app. Times are requested in GMT (the
  // default when no `timezone` param is given), so they compare directly
  // against the UTC-based ETA computed elsewhere without extra conversion.
  function fetchOpenMeteo(lat, lon, prefix) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(4) + '&longitude=' + lon.toFixed(4) +
      '&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,pressure_msl&forecast_days=16';
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (d) {
        var h = d.hourly;
        if (!h || !h.time) { lastOpenMeteo[prefix] = null; computeRoute(); return; }
        lastOpenMeteo[prefix] = {
          time: h.time.map(function (t) { return new Date(t + 'Z').getTime(); }),
          tempC: h.temperature_2m,
          windKt: h.wind_speed_10m.map(function (kmh) { return kmh / 1.852; }),
          windDirDeg: h.wind_direction_10m,
          altimIn: h.pressure_msl.map(function (hpa) { return hpa / 33.8639; })
        };
        computeRoute();
      })
      .catch(function () { lastOpenMeteo[prefix] = null; computeRoute(); });
  }

  function findOpenMeteoForTime(data, targetDate) {
    if (!data) return null;
    var t = targetDate.getTime();
    var best = -1, bestDiff = Infinity;
    for (var i = 0; i < data.time.length; i++) {
      var diff = Math.abs(data.time[i] - t);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    }
    if (best < 0 || bestDiff > 90 * 60000) return null; // more than 90 min from any hourly point -- outside the 16-day window
    return { tempC: data.tempC[best], windKt: data.windKt[best], windDirDeg: data.windDirDeg[best], altimIn: data.altimIn[best] };
  }

  function lookupAirport(prefix, icaoFieldId, infoElId, paFieldId, wxElId, rwySelectId, rwyFieldWrapId, applyOat) {
    var AIRPORTS = window.PA30_AIRPORTS || {};
    var raw = $(icaoFieldId).value.trim().toUpperCase();
    $(icaoFieldId).value = raw;
    var infoEl = $(infoElId);
    clearWeather(wxElId);
    lastWind[prefix] = null;
    lastAirportInfo[prefix] = null;
    $(rwyFieldWrapId).hidden = true;
    $(rwySelectId).innerHTML = '<option value="">— select —</option>';
    $(prefix + 'TafWrap').hidden = true;
    $(prefix + 'OutlookWrap').hidden = true;
    computeWindComponent(prefix);
    if (!raw) { infoEl.innerHTML = ''; setRouteEndpoint(prefix, null); return; }
    var apt = AIRPORTS[raw];
    if (!apt) {
      infoEl.innerHTML = '<span class="bad">Not found in the bundled airport database. Enter pressure altitude manually below.</span>';
      setRouteEndpoint(prefix, null);
      return;
    }
    var bits = [];
    bits.push('<span class="ok">' + apt.n + (apt.c ? ', ' + apt.c : '') + (apt.co ? ' (' + apt.co + ')' : '') + '</span>');
    if (apt.elev !== undefined) bits.push('Field elevation: ' + apt.elev + ' ft');
    if (apt.rwy) {
      var srf = apt.srf ? (SURFACE_NAMES[apt.srf] || apt.srf) : null;
      bits.push('Longest runway: ' + apt.rwy.toLocaleString() + ' ft' + (srf ? ' (' + srf + ')' : ''));
    }
    infoEl.innerHTML = bits.join('<br>');
    lastAirportInfo[prefix] = { elev: apt.elev, longestRwy: apt.rwy };
    if (apt.elev !== undefined) {
      $(paFieldId).value = apt.elev;
      render();
    }
    populateRunways(raw, rwySelectId, rwyFieldWrapId);
    setRouteEndpoint(prefix, { lat: apt.lat, lon: apt.lon, label: raw + ' — ' + apt.n });
    wxTimers[wxElId] = setTimeout(function () {
      fetchWeather(raw, prefix, wxElId, paFieldId, apt.elev, applyOat);
      fetchTaf(raw, prefix);
      fetchOutlook(apt.lat, apt.lon, prefix);
      fetchOpenMeteo(apt.lat, apt.lon, prefix);
    }, 500);
  }

  // ---------- route: geo math ----------

  var NM_PER_RAD = 3440.065;

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }

  function haversineNm(lat1, lon1, lat2, lon2) {
    var dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return NM_PER_RAD * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function initialBearingDeg(lat1, lon1, lat2, lon2) {
    var y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    var x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function midpoint(lat1, lon1, lat2, lon2) {
    var bx = Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    var by = Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1));
    var lat3 = Math.atan2(Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)),
      Math.sqrt((Math.cos(toRad(lat1)) + bx) * (Math.cos(toRad(lat1)) + bx) + by * by));
    var lon3 = toRad(lon1) + Math.atan2(by, Math.cos(toRad(lat1)) + bx);
    return { lat: toDeg(lat3), lon: toDeg(lon3) };
  }

  function lerpAngleDeg(a, b, t) {
    var ax = Math.cos(toRad(a)), ay = Math.sin(toRad(a));
    var bx = Math.cos(toRad(b)), by = Math.sin(toRad(b));
    var x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  // ---------- route: waypoint resolution ----------

  function resolveWaypointQuery(raw) {
    var q = (raw || '').trim().toUpperCase();
    if (!q) return [];
    var out = [];
    var AIRPORTS = window.PA30_AIRPORTS || {};
    var NAVAIDS = window.PA30_NAVAIDS || {};
    var FIXES = window.PA30_FIXES || {};
    if (AIRPORTS[q]) {
      var a = AIRPORTS[q];
      out.push({ label: q + ' — ' + a.n + (a.c ? ', ' + a.c : ''), lat: a.lat, lon: a.lon });
    }
    if (q.length === 5 && FIXES[q]) {
      var f = FIXES[q];
      out.push({ label: q + ' (RNAV/GPS fix)', lat: f.lat, lon: f.lon });
    }
    var navs = NAVAIDS[q];
    if (navs) {
      navs.forEach(function (n) {
        out.push({
          label: q + ' ' + n.ty + ' — ' + n.n + ' (' + n.co + ')' + (n.freq ? ', ' + n.freq : ''),
          lat: n.lat, lon: n.lon
        });
      });
    }
    return out;
  }

  // ---------- route: waypoint rows (UI) ----------

  var routeRowSeq = 0;
  var routeWaypoints = {}; // rowId -> { lat, lon, label } | null  (intermediate fixes only)
  var routeEndpoints = { dep: null, dest: null }; // { lat, lon, label } | null, synced from the Airports card

  function setRouteEndpoint(prefix, resolved) {
    routeEndpoints[prefix] = resolved;
    var infoEl = $(prefix === 'dep' ? 'routeDepInfo' : 'routeDestInfo');
    infoEl.textContent = resolved ? resolved.label : ('Enter ' + (prefix === 'dep' ? 'departure' : 'destination') + ' airport above');
    computeRoute();
  }

  function createWaypointRow() {
    var rowId = 'wp' + (++routeRowSeq);
    var row = document.createElement('div');
    row.className = 'route-row';
    row.dataset.rowId = rowId;
    row.innerHTML =
      '<input type="text" class="route-wp-input" placeholder="ICAO / navaid / fix" maxlength="8" autocomplete="off" spellcheck="false">' +
      '<select class="route-wp-disambig" hidden></select>' +
      '<span class="route-wp-info"></span>' +
      '<button type="button" class="route-wp-remove" title="Remove fix">×</button>';
    $('routeWaypoints').insertBefore(row, $('routeDestRow'));

    var input = row.querySelector('.route-wp-input');
    var disambig = row.querySelector('.route-wp-disambig');
    var info = row.querySelector('.route-wp-info');
    var removeBtn = row.querySelector('.route-wp-remove');

    function resolve() {
      var candidates = resolveWaypointQuery(input.value);
      if (candidates.length === 0) {
        routeWaypoints[rowId] = null;
        disambig.hidden = true;
        info.innerHTML = input.value.trim() ? '<span class="bad">Not found</span>' : '';
        computeRoute();
        return;
      }
      if (candidates.length === 1) {
        disambig.hidden = true;
        routeWaypoints[rowId] = candidates[0];
        info.textContent = candidates[0].label;
        computeRoute();
        return;
      }
      disambig.hidden = false;
      disambig.innerHTML = candidates.map(function (c, i) {
        return '<option value="' + i + '">' + c.label + '</option>';
      }).join('');
      routeWaypoints[rowId] = candidates[0];
      info.textContent = '';
      computeRoute();
    }

    input.addEventListener('change', resolve);
    input.addEventListener('blur', resolve);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); resolve(); } });
    disambig.addEventListener('change', function () {
      var candidates = resolveWaypointQuery(input.value);
      routeWaypoints[rowId] = candidates[parseInt(disambig.value, 10)];
      computeRoute();
    });
    removeBtn.addEventListener('click', function () {
      delete routeWaypoints[rowId];
      row.remove();
      computeRoute();
    });

    routeWaypoints[rowId] = null;
    return row;
  }

  // ---------- route: winds/temps aloft ----------

  var WINDTEMP_LEVELS = [3000, 6000, 9000, 12000, 18000, 24000, 30000, 34000, 39000];
  var WINDTEMP_SLICES = [[4, 8], [9, 16], [17, 24], [25, 32], [33, 40], [41, 48], [49, 55], [56, 62], [63, 69]];
  var windTempCache = null; // { stations: {code: {level: {dir,spd,temp}}}, fetchedAt }
  var windTempPromise = null;
  var matchedStationCache = null;

  function parseWindField(raw, level) {
    var s = (raw || '').trim();
    if (!s) return null;
    var lightVariable = s.slice(0, 4) === '9900';
    var dircode = parseInt(s.slice(0, 2), 10);
    var spd = parseInt(s.slice(2, 4), 10);
    var temp = null;
    if (level <= 24000) {
      if (s.length > 4) temp = parseInt(s.slice(4, 7), 10);
    } else {
      temp = -parseInt(s.slice(4, 6), 10);
    }
    if (isNaN(dircode) || isNaN(spd)) return null;
    if (lightVariable) return { dir: null, spd: 0, temp: temp };
    var direction = dircode * 10;
    if (dircode >= 51) { direction = (dircode - 50) * 10; spd += 100; }
    return { dir: direction, spd: spd, temp: temp };
  }

  function parseWindTempBulletin(text) {
    var stations = {};
    text.split('\n').forEach(function (lineRaw) {
      var line = lineRaw.replace(/\r$/, '');
      if (line.length < 69) return;
      var code = line.slice(0, 3);
      if (!/^[A-Z]{3}$/.test(code) || line[3] !== ' ') return;
      var levels = {};
      for (var i = 0; i < WINDTEMP_LEVELS.length; i++) {
        var slice = WINDTEMP_SLICES[i];
        var parsed = parseWindField(line.slice(slice[0], slice[1]), WINDTEMP_LEVELS[i]);
        if (parsed) levels[WINDTEMP_LEVELS[i]] = parsed;
      }
      if (Object.keys(levels).length) stations[code] = levels;
    });
    return stations;
  }

  function ensureWindTemp() {
    if (windTempCache && (Date.now() - windTempCache.fetchedAt) < 55 * 60 * 1000) {
      return Promise.resolve(windTempCache);
    }
    if (windTempPromise) return windTempPromise;
    windTempPromise = fetch(WEATHER_PROXY + '/windtemp?fcst=06')
      .then(function (resp) {
        if (!resp.ok) throw new Error('bad status');
        return resp.text();
      })
      .then(function (text) {
        windTempCache = { stations: parseWindTempBulletin(text), fetchedAt: Date.now() };
        matchedStationCache = null;
        windTempPromise = null;
        return windTempCache;
      })
      .catch(function (err) {
        windTempPromise = null;
        throw err;
      });
    return windTempPromise;
  }

  function matchedStations() {
    if (matchedStationCache) return matchedStationCache;
    if (!windTempCache) return [];
    var AIRPORTS = window.PA30_AIRPORTS || {};
    var out = [];
    Object.keys(windTempCache.stations).forEach(function (code) {
      var apt = AIRPORTS['K' + code];
      if (apt) out.push({ code: code, lat: apt.lat, lon: apt.lon, levels: windTempCache.stations[code] });
    });
    matchedStationCache = out;
    return out;
  }

  function nearestStation(lat, lon) {
    var list = matchedStations();
    var best = null, bestDist = Infinity;
    list.forEach(function (s) {
      var d = haversineNm(lat, lon, s.lat, s.lon);
      if (d < bestDist) { bestDist = d; best = s; }
    });
    return best ? { station: best, distNm: bestDist } : null;
  }

  function interpolateLevels(levels, altFt) {
    var keys = Object.keys(levels).map(Number).sort(function (a, b) { return a - b; });
    if (!keys.length) return null;
    var lo = keys[0], hi = keys[keys.length - 1];
    for (var i = 0; i < keys.length - 1; i++) {
      if (altFt >= keys[i] && altFt <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; break; }
    }
    if (altFt <= keys[0]) { lo = keys[0]; hi = keys[0]; }
    if (altFt >= keys[keys.length - 1]) { lo = hi = keys[keys.length - 1]; }
    var a = levels[lo], b = levels[hi];
    var t = (hi === lo) ? 0 : clamp((altFt - lo) / (hi - lo), 0, 1);
    var spd = lerp(0, a.spd, 1, b.spd, t);
    var temp = (a.temp !== null && b.temp !== null) ? lerp(0, a.temp, 1, b.temp, t) : (a.temp !== null ? a.temp : b.temp);
    var dir;
    if (a.dir === null && b.dir === null) dir = null;
    else if (a.dir === null) dir = b.dir;
    else if (b.dir === null) dir = a.dir;
    else dir = lerpAngleDeg(a.dir, b.dir, t);
    return { dir: dir, spd: spd, temp: temp };
  }

  // ---------- route: compute & render ----------

  function cruisePaFt() {
    var alt = parseFloat($('cruiseAlt').value) || 0;
    var altimeter = parseFloat($('cruiseAltimeter').value);
    if (isNaN(altimeter)) altimeter = 29.92;
    return Math.round(alt + (29.92 - altimeter) * 1000);
  }

  function renderCruisePa() {
    var pa = cruisePaFt();
    $('cruisePA').textContent = fmt(pa, 'ft');

    var oatRaw = parseFloat($('cruiseOat').value);
    var daEl = $('cruiseDA');
    if (isNaN(oatRaw)) { daEl.textContent = '—'; return; }
    var oatC = $('cruiseOatUnit').value === 'F' ? (oatRaw - 32) * 5 / 9 : oatRaw;
    daEl.textContent = fmt(densityAltitude(pa, oatC), 'ft');
  }

  function orderedResolvedWaypoints() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('#routeWaypoints .route-row'))
      .filter(function (row) { return row.id !== 'routeDepRow' && row.id !== 'routeDestRow'; });
    var intermediate = rows.map(function (row) { return routeWaypoints[row.dataset.rowId]; }).filter(Boolean);
    var list = [];
    if (routeEndpoints.dep) list.push(routeEndpoints.dep);
    list = list.concat(intermediate);
    if (routeEndpoints.dest) list.push(routeEndpoints.dest);
    return list;
  }

  function computeRoute() {
    renderCruisePa();
    var legsEl = $('routeLegs');
    if (!routeEndpoints.dep || !routeEndpoints.dest) {
      legsEl.innerHTML = '';
      ['climbPhaseResults', 'cruisePhaseResults', 'descentPhaseResults', 'tripSummaryResults', 'etaForecastResults'].forEach(function (id) {
        $(id).innerHTML = '';
      });
      return;
    }
    var wps = orderedResolvedWaypoints();
    ensureWindTemp().then(function () {
      var legsResult = renderLegs(wps);
      renderClimbCruiseDescent(wps, legsResult, false);
    }).catch(function () {
      var legsResult = renderLegs(wps, true);
      renderClimbCruiseDescent(wps, legsResult, true);
    });
  }

  function renderLegs(wps, windUnavailable) {
    var legsEl = $('routeLegs');
    var pa = cruisePaFt();
    var rows = [];
    var totalNm = 0;
    var legData = []; // {distNm, course, gsKt (TAS-independent -- headwind component only, in kt; null if unavailable)}
    for (var i = 0; i < wps.length - 1; i++) {
      var from = wps[i], to = wps[i + 1];
      var distNm = haversineNm(from.lat, from.lon, to.lat, to.lon);
      var course = initialBearingDeg(from.lat, from.lon, to.lat, to.lon);
      totalNm += distNm;
      var mid = midpoint(from.lat, from.lon, to.lat, to.lon);

      var windCell = '<span class="bad">unavailable</span>';
      var compCell = '—';
      var headwindKt = null;
      if (!windUnavailable) {
        var ns = nearestStation(mid.lat, mid.lon);
        if (ns) {
          var wx = interpolateLevels(ns.station.levels, pa);
          if (wx) {
            var dirTxt = wx.dir === null ? 'calm/var' : Math.round(wx.dir) + '°T';
            windCell = dirTxt + ' @ ' + Math.round(wx.spd) + ' kt, ' + Math.round(wx.temp) + '°C' +
              '<br><span class="wx-note">nearest: ' + ns.station.code + ', ' + Math.round(ns.distNm) + ' nm away</span>';
            if (wx.dir !== null) {
              var diff = angleDiff(wx.dir, course);
              var rad = diff * Math.PI / 180;
              headwindKt = wx.spd * Math.cos(rad);
              var xwKt = wx.spd * Math.sin(rad);
              var hwMph = headwindKt * 1.15078, xwMph = Math.abs(xwKt) * 1.15078;
              var cls = hwMph < 0 ? 'leg-head tailwind' : 'leg-head';
              var lbl = hwMph < 0 ? 'Tailwind' : 'Headwind';
              compCell = '<span class="' + cls + '">' + lbl + ' ' + Math.abs(Math.round(hwMph)) + ' mph</span><br>Xwind ' + Math.round(xwMph) + ' mph';
            } else {
              compCell = 'Calm/variable';
              headwindKt = 0;
            }
          }
        }
      }
      legData.push({ distNm: distNm, course: course, headwindKt: headwindKt });

      rows.push('<tr><td>' + from.label.split(' — ')[0] + ' → ' + to.label.split(' — ')[0] +
        '</td><td>' + Math.round(course) + '°T</td><td>' + Math.round(distNm) + ' nm</td>' +
        '<td>' + windCell + '</td><td>' + compCell + '</td></tr>');
    }

    var html = '<div class="table-scroll"><table class="leg-table"><thead><tr>' +
      '<th>Leg</th><th>Course</th><th>Distance</th><th>Wind/temp aloft</th><th>Component</th>' +
      '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
      '<p class="route-status">Total distance: ' + Math.round(totalNm) + ' nm over ' + rows.length + ' leg' + (rows.length > 1 ? 's' : '') + '.</p>';
    if (windUnavailable) {
      html += '<p class="route-status bad">Winds/temps aloft unavailable right now (network or Worker issue) — course and distance are still shown.</p>';
    }
    legsEl.innerHTML = html;
    return { totalNm: totalNm, legs: legData };
  }

  // ---------- route: climb / cruise / descent planning ----------

  function parseAltLabel(s) {
    return s === 'Sea Level' ? 0 : parseFloat(s.replace(/,/g, ''));
  }

  // Manifold pressure (in Hg) needed to hold `power`% at `rpm` RPM, at altFt --
  // interpolated between the table's altitude rows. Returns null above the
  // highest altitude this power/RPM combination has data for (that altitude
  // is usually full throttle already; holding this %power any higher would
  // need a lower RPM instead, not more manifold pressure).
  function manifoldPressureAt(altFt, power, rpm) {
    var key = 'p' + power, rpmKey = String(rpm);
    var pts = DATA['fig5-17'].rows
      .filter(function (r) { return r[key] && r[key].mp && r[key].mp[rpmKey] !== undefined; })
      .map(function (r) { return { x: parseAltLabel(r.altitude), y: r[key].mp[rpmKey] }; })
      .sort(function (a, b) { return a.x - b.x; });
    if (!pts.length || altFt > pts[pts.length - 1].x) return null;
    if (altFt <= pts[0].x) return pts.length > 1 ? lerp(pts[0].x, pts[0].y, pts[1].x, pts[1].y, altFt) : pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      if (altFt <= pts[i + 1].x) return lerp(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, altFt);
    }
    return null;
  }

  function fuelGphAtPower(power) {
    var fig = DATA['fig5-17'];
    var points = [55, 65, 75].map(function (p) {
      var parts = fig.rows[0]['p' + p].gph.split('/').map(function (s) { return parseFloat(s.trim()); });
      return { x: p, y: parts[1] }; // best-power (rich of peak), matching the worksheet's own "best power" chain
    });
    return interpBreakpoints(points, power, true);
  }

  // ---------- ETA / destination forecast at landing time ----------

  // UTC offset (minutes) of an IANA zone at a given UTC instant -- handles DST
  // automatically via the browser's own timezone database, no manual table.
  function tzOffsetMinutes(ianaZone, dateUtc) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    var parts = dtf.formatToParts(dateUtc).reduce(function (acc, p) { acc[p.type] = p.value; return acc; }, {});
    var asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return (asUtc - dateUtc.getTime()) / 60000;
  }

  // Converts a local wall-clock date/time + IANA zone into the correct UTC
  // instant, iterating once to handle the (rare) case where the offset
  // itself changes between the naive guess and the corrected instant.
  function localWallClockToUtc(y, mo, d, h, mi, ianaZone) {
    var guessUtc = Date.UTC(y, mo - 1, d, h, mi);
    var offset = tzOffsetMinutes(ianaZone, new Date(guessUtc));
    var actualUtc = guessUtc - offset * 60000;
    var offset2 = tzOffsetMinutes(ianaZone, new Date(actualUtc));
    if (offset2 !== offset) actualUtc = guessUtc - offset2 * 60000;
    return new Date(actualUtc);
  }

  // Reads the Route card's date/time/timezone fields and returns the
  // departure instant as a UTC Date, or null if date/time haven't been entered.
  function getEtdUtc() {
    var dateStr = $('etdDate').value, timeStr = $('etdTime').value;
    if (!dateStr || !timeStr) return null;
    var dp = dateStr.split('-').map(Number), tp = timeStr.split(':').map(Number);
    return localWallClockToUtc(dp[0], dp[1], dp[2], tp[0], tp[1], $('etdTimezone').value);
  }

  // The TAF "base" forecast is whichever FM/BECMG/initial period has the
  // latest timeFrom at or before the target time (each supersedes the last
  // until the next one takes effect); TEMPO/PROB periods are temporary
  // overlays on top of that, so collected separately rather than replacing it.
  function findTafPeriodForTime(fcsts, targetUnixSec) {
    var base = null, overlays = [];
    (fcsts || []).forEach(function (f) {
      if (f.fcstChange === 'TEMPO' || f.probability) {
        if (targetUnixSec >= f.timeFrom && targetUnixSec <= (f.timeTo || f.timeFrom)) overlays.push(f);
        return;
      }
      if (f.timeFrom <= targetUnixSec && (!base || f.timeFrom > base.timeFrom)) base = f;
    });
    return (base || overlays.length) ? { base: base, overlays: overlays } : null;
  }

  function fmtOpenMeteo(om, label) {
    return '<div class="taf-period"><span class="tp-change">' + label + '</span><br>' +
      Math.round(om.windDirDeg) + '°T @ ' + Math.round(om.windKt) + ' kt, ' + Math.round(om.tempC) + '°C, altimeter ' + om.altimIn.toFixed(2) + ' inHg' +
      '<br><span class="wx-note">Source: Open-Meteo (open-meteo.com) — a blend of national weather-service models, not an aviation-specific product; treat like the extended outlook above, not a substitute for a real briefing.</span></div>';
  }

  function renderEtaForecast(totalTimeHr) {
    var etd = getEtdUtc();
    if (!etd || totalTimeHr === null || isNaN(totalTimeHr)) {
      return '<p class="route-status">Enter a departure date/time above to see the destination forecast for your estimated arrival time.</p>';
    }
    var eta = new Date(etd.getTime() + totalTimeHr * 3600000);
    var etaUnixSec = Math.round(eta.getTime() / 1000);
    var html = '<p class="route-status"><strong>ETA: ' + fmtZulu(etaUnixSec) + '</strong> (departure ' + fmtZulu(Math.round(etd.getTime() / 1000)) + ' + ' + Math.round(totalTimeHr * 60) + ' min total flight time)</p>';

    var om = findOpenMeteoForTime(lastOpenMeteo.dest, eta);
    var taf = lastTaf.dest ? findTafPeriodForTime(lastTaf.dest.fcsts, etaUnixSec) : null;

    if (taf && taf.base) {
      var cat = flightCategory(taf.base.visib, taf.base.clouds);
      html += '<div class="taf-period"><span class="tp-change">TAF forecast at ETA (' + tafPeriodLabel(taf.base) + ')</span>' +
        (cat ? '<span class="tp-flightcat ' + cat.toLowerCase() + '">' + cat + '</span>' : '') +
        '<br>' + fmtTafWind(taf.base) + (taf.base.visib ? (' · Vis ' + taf.base.visib + ' SM') : '') +
        '<br>' + fmtClouds(taf.base.clouds) + '</div>';
      taf.overlays.forEach(function (f) {
        html += '<div class="taf-period"><span class="tp-change">Also possible: ' + tafPeriodLabel(f) + '</span><br>' +
          fmtTafWind(f) + (f.visib ? (' · Vis ' + f.visib + ' SM') : '') + (f.wxString ? (' · ' + f.wxString) : '') + '</div>';
      });
      if (om) {
        html += '<p class="wx-note">A TAF never forecasts altimeter/pressure — estimated from Open-Meteo below instead.</p>' + fmtOpenMeteo(om, 'Open-Meteo estimate at ETA (altimeter only — trust the TAF above for wind/sky/visibility)');
      } else {
        html += '<p class="wx-note">No altimeter/pressure estimate available either — use standard pressure (29.92) for planning beyond what a live METAR close to departure can tell you.</p>';
      }
      return html;
    }

    if (om) {
      html += '<p class="route-status bad">' + (lastTaf.dest ? 'ETA is outside this airport\'s TAF coverage' : 'This airport has no TAF') + ' — falling back to Open-Meteo (global model blend, not an aviation-specific product).</p>';
      html += fmtOpenMeteo(om, 'Open-Meteo forecast at ETA');
      return html;
    }

    html += '<p class="route-status bad">No automated forecast covers this ETA — it\'s likely too far out (Open-Meteo\'s own limit is 16 days), or the forecast fetch hasn\'t finished/failed. Check a fresh briefing closer to departure.</p>';
    return html;
  }

  // Headwind component (kt, positive = headwind) from the nearest winds-aloft
  // station to (lat, lon) at altFt, along courseDeg. Returns null if wind data
  // isn't available there (caller should fall back to TAS-only / no wind).
  function headwindAt(lat, lon, altFt, courseDeg) {
    var ns = nearestStation(lat, lon);
    if (!ns) return null;
    var wx = interpolateLevels(ns.station.levels, altFt);
    if (!wx) return null;
    if (wx.dir === null) return 0;
    var rad = angleDiff(wx.dir, courseDeg) * Math.PI / 180;
    return wx.spd * Math.cos(rad);
  }

  function renderClimbCruiseDescent(wps, legsResult, windUnavailable) {
    var inp = readInputs();
    var depPa = inp.depAltFt, destPa = inp.destAltFt, cruisePa = cruisePaFt();
    var descentRate = Math.max(100, parseFloat($('descentRate').value) || 500);
    var dep = routeEndpoints.dep, dest = routeEndpoints.dest;

    // Climb: departure field elevation -> cruise altitude, 75% power, at takeoff weight.
    var rocDep = rocFromCurves(DATA['fig5-09'].weightCurves, depPa, inp.toWeight);
    var rocCruise = rocFromCurves(DATA['fig5-09'].weightCurves, cruisePa, inp.toWeight);
    var climbAvgRoc = (rocDep + rocCruise) / 2;
    var climbAltFt = Math.max(0, cruisePa - depPa);
    var climbTimeHr = climbAvgRoc > 0 ? (climbAltFt / climbAvgRoc) / 60 : null;
    var climbTasKt = ((byPower(DATA['fig5-12'].powerCurves, depPa, 75) + byPower(DATA['fig5-12'].powerCurves, cruisePa, 75)) / 2) / KT_TO_MPH;
    var climbCourse = wps.length > 1 ? initialBearingDeg(wps[0].lat, wps[0].lon, wps[1].lat, wps[1].lon) : null;
    var climbHw = (!windUnavailable && climbCourse !== null) ? headwindAt(dep.lat, dep.lon, (depPa + cruisePa) / 2, climbCourse) : null;
    var climbGsKt = climbHw === null ? climbTasKt : (climbTasKt - climbHw);
    var climbDistNm = climbTimeHr !== null ? climbGsKt * climbTimeHr : null;
    var climbFuelGal = climbTimeHr !== null ? climbTimeHr * fuelGphAtPower(75) : null;

    // Descent: cruise altitude -> destination field elevation, 55% power, at the planned descent rate.
    var descentAltFt = Math.max(0, cruisePa - destPa);
    var descentTimeHr = (descentAltFt / descentRate) / 60;
    var descentTasKt = ((byPower(DATA['fig5-12'].powerCurves, destPa, 55) + byPower(DATA['fig5-12'].powerCurves, cruisePa, 55)) / 2) / KT_TO_MPH;
    var n = wps.length;
    var descentCourse = n > 1 ? initialBearingDeg(wps[n - 2].lat, wps[n - 2].lon, wps[n - 1].lat, wps[n - 1].lon) : null;
    var descentHw = (!windUnavailable && descentCourse !== null) ? headwindAt(dest.lat, dest.lon, (destPa + cruisePa) / 2, descentCourse) : null;
    var descentGsKt = descentHw === null ? descentTasKt : (descentTasKt - descentHw);
    var descentDistNm = descentGsKt * descentTimeHr;
    var descentFuelGal = descentTimeHr * fuelGphAtPower(55);

    // Cruise: whatever route distance is left, at the cruise-power TAS and the
    // route's own distance-weighted average groundspeed from the leg table above.
    var totalNm = legsResult.totalNm;
    var usedNm = (climbDistNm || 0) + descentDistNm;
    var tooShort = usedNm > totalNm;
    var cruiseDistNm = Math.max(0, totalNm - usedNm);
    var cruiseTasKt = byPower(DATA['fig5-12'].powerCurves, cruisePa, inp.power) / KT_TO_MPH;
    var weightedHwSum = 0, weightedDistSum = 0;
    legsResult.legs.forEach(function (leg) {
      if (leg.headwindKt === null) return;
      weightedHwSum += leg.headwindKt * leg.distNm;
      weightedDistSum += leg.distNm;
    });
    var cruiseHw = weightedDistSum > 0 ? weightedHwSum / weightedDistSum : null;
    var cruiseGsKt = cruiseHw === null ? cruiseTasKt : (cruiseTasKt - cruiseHw);
    var cruiseTimeHr = cruiseGsKt > 0 ? cruiseDistNm / cruiseGsKt : null;
    var cruiseFuelGal = cruiseTimeHr !== null ? cruiseTimeHr * fuelGphAtPower(inp.power) : null;

    // Manifold pressure needed to hold each phase's %power at 2400 RPM, at
    // that phase's representative altitude -- cockpit-actionable power
    // setting guidance alongside the time/distance/fuel numbers, since the
    // Power Setting Table only tabulates 55/65/75% (nearest of those three
    // is used for cruise's MP lookup even if the cruise %power slider is set
    // to something in between -- fuel burn above still uses the slider's
    // exact value via interpolation, only this MP figure is snapped).
    var CRUISE_RPM = 2400;
    var cruisePowerCol = [55, 65, 75].reduce(function (best, p) {
      return Math.abs(p - inp.power) < Math.abs(best - inp.power) ? p : best;
    });
    var climbMp = manifoldPressureAt((depPa + cruisePa) / 2, 75, CRUISE_RPM);
    var cruiseMp = manifoldPressureAt(cruisePa, cruisePowerCol, CRUISE_RPM);
    var descentMp = manifoldPressureAt((destPa + cruisePa) / 2, 55, CRUISE_RPM);

    function hm(hr) {
      if (hr === null || isNaN(hr)) return '—';
      var totalMin = Math.round(hr * 60);
      var h = Math.floor(totalMin / 60), m = totalMin % 60;
      return (h > 0 ? h + 'h ' : '') + m + 'm';
    }
    function mpText(mp) {
      return mp === null ? 'full throttle*' : mp.toFixed(1) + ' in Hg';
    }
    function phaseTiles(timeHr, distNm, gsKt, fuelGal, mp, mpLabel) {
      return resultTile('Time', hm(timeHr)) +
        resultTile('Distance', (distNm === null || isNaN(distNm)) ? '—' : Math.round(distNm) + ' nm') +
        resultTile('Avg groundspeed', (gsKt === null || isNaN(gsKt)) ? '—' : Math.round(gsKt) + ' kt') +
        resultTile('Fuel', (fuelGal === null || isNaN(fuelGal)) ? '—' : fuelGal.toFixed(1) + ' gal') +
        resultTile('MP (' + mpLabel + ', 2400 RPM)', mpText(mp));
    }

    var totalTimeHr = (climbTimeHr || 0) + (cruiseTimeHr || 0) + descentTimeHr;
    var totalFuelGal = (climbFuelGal || 0) + (cruiseFuelGal || 0) + descentFuelGal;
    var fuelOnBoard = inp.fuel;
    var mpFootnote = (climbMp === null || cruiseMp === null || descentMp === null)
      ? '<p class="route-status">* 2400 RPM can\'t hold that %power at that altitude per Fig 5-17 (its highest tabulated altitude for that combination has already been reached) — use a lower RPM instead to hold it higher, or expect less than the stated %power at full throttle.</p>'
      : '';

    var climbHtml = phaseTiles(climbTimeHr, climbDistNm, climbGsKt, climbFuelGal, climbMp, '75%');
    if (climbAvgRoc <= 0) {
      climbHtml += '<p class="route-status bad">Average climb rate is at or below zero at these conditions — climb time/distance/fuel can\'t be computed.</p>';
    }
    $('climbPhaseResults').innerHTML = climbHtml + (climbMp === null ? mpFootnote : '');

    var cruiseHtml = phaseTiles(cruiseTimeHr, cruiseDistNm, cruiseGsKt, cruiseFuelGal, cruiseMp, cruisePowerCol + '%');
    if (tooShort) {
      cruiseHtml += '<p class="route-status bad">Climb + descent distance (' + Math.round(usedNm) + ' nm) exceeds the total route distance (' + Math.round(totalNm) + ' nm) — this flight never reaches a stabilized cruise segment; cruise is zeroed out.</p>';
    }
    $('cruisePhaseResults').innerHTML = cruiseHtml + (cruiseMp === null ? mpFootnote : '');

    var descentHtml = phaseTiles(descentTimeHr, descentDistNm, descentGsKt, descentFuelGal, descentMp, '55%');
    $('descentPhaseResults').innerHTML = descentHtml + (descentMp === null ? mpFootnote : '');

    var summaryHtml = resultTile('Total time', hm(totalTimeHr)) +
      resultTile('Total distance', Math.round(totalNm) + ' nm') +
      resultTile('Total fuel burn', totalFuelGal.toFixed(1) + ' gal') +
      resultTile('Fuel remaining at destination', (fuelOnBoard - totalFuelGal).toFixed(1) + ' gal', 'of ' + fuelOnBoard + ' gal on board');
    if (totalFuelGal > fuelOnBoard) {
      summaryHtml += '<p class="route-status bad">Total fuel burn (' + totalFuelGal.toFixed(1) + ' gal) exceeds the ' + fuelOnBoard + ' gal entered above.</p>';
    }
    if (windUnavailable) {
      summaryHtml += '<p class="route-status bad">Winds/temps aloft unavailable — groundspeeds above are TAS only (no wind correction).</p>';
    }
    $('tripSummaryResults').innerHTML = summaryHtml;

    $('etaForecastResults').innerHTML = renderEtaForecast(totalTimeHr);
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
    renderWeightBalance();
    if (!$('etdDate').value) {
      var today = new Date();
      $('etdDate').value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    }
    render();
    runVerification();
    var wbFieldIds = ['wbEmptyWt', 'wbEmptyArm', 'wbPilotWt', 'wbRearWt', 'wbBagWt', 'wbMainGal', 'wbAuxGal', 'wbMainBurnGal', 'wbAuxBurnGal'];
    var skipGenericBinding = { depIcao: 1, destIcao: 1, depRunway: 1, destRunway: 1 };
    wbFieldIds.forEach(function (id) { skipGenericBinding[id] = 1; });
    wbFieldIds.forEach(function (id) {
      $(id).addEventListener('input', renderWeightBalance);
      $(id).addEventListener('change', renderWeightBalance);
    });
    document.querySelectorAll('input, select').forEach(function (el) {
      if (skipGenericBinding[el.id]) return;
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    $('depIcao').addEventListener('input', function () {
      lookupAirport('dep', 'depIcao', 'depInfo', 'depPressureAlt', 'depWx', 'depRunway', 'depRwyField', true);
    });
    $('destIcao').addEventListener('input', function () {
      lookupAirport('dest', 'destIcao', 'destInfo', 'destPressureAlt', 'destWx', 'destRunway', 'destRwyField', true);
    });
    $('depRunway').addEventListener('change', function () { computeWindComponent('dep'); render(); });
    $('destRunway').addEventListener('change', function () { computeWindComponent('dest'); render(); });

    $('addWaypoint').addEventListener('click', createWaypointRow);
    $('cruiseAlt').addEventListener('input', computeRoute);
    $('cruiseAltimeter').addEventListener('input', computeRoute);
    $('cruiseOat').addEventListener('input', computeRoute);
    $('cruiseOatUnit').addEventListener('change', computeRoute);
    computeRoute();

    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline caching is a nice-to-have, never block the app on it */ });
    }
  });
})();
