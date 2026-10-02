/*
 * PA-30 Performance Calculator — embedded dataset.
 *
 * This file mirrors the JSON files in data/ exactly. It exists so the app
 * works when index.html is opened directly as a file:// URL (browsers block
 * fetch() of local JSON files from file:// pages). The data/*.json files are
 * the human-readable/editable source of truth — if you hand-correct a value
 * there, copy the same correction into the matching object below.
 *
 * Regenerated from data/*.json on 2026-10-01 by scripts (kept in sync
 * programmatically to avoid hand-transcription drift).
 */
window.PA30_DATA = {
  "fig5-02": {
    "figure": "5-02",
    "title": "Airspeed Calibration",
    "units": "mph",
    "conditions": "Primary pitot-static system, standard pitot-static head. Correction to be added to Indicated Airspeed (IAS) to obtain Calibrated Airspeed (CAS): CAS = IAS + correction.",
    "source": "reference/poh-hires/fig5-02-airspeed-calibration.png",
    "model": "table-by-config",
    "curves": {
      "flapsRetracted": [
        [
          220,
          -4.03
        ],
        [
          215,
          -3.94
        ],
        [
          210,
          -3.81
        ],
        [
          205,
          -3.56
        ],
        [
          200,
          -3.25
        ],
        [
          195,
          -2.83
        ],
        [
          190,
          -2.1
        ],
        [
          185,
          -1.82
        ],
        [
          180,
          -1.28
        ],
        [
          175,
          -0.87
        ],
        [
          170,
          -0.48
        ],
        [
          165,
          -0.16
        ],
        [
          160,
          0.15
        ],
        [
          155,
          0.42
        ],
        [
          150,
          0.6
        ],
        [
          145,
          0.69
        ],
        [
          140,
          0.74
        ],
        [
          135,
          0.78
        ],
        [
          130,
          0.79
        ],
        [
          125,
          0.79
        ],
        [
          120,
          0.83
        ],
        [
          115,
          0.87
        ],
        [
          110,
          0.99
        ],
        [
          105,
          1.21
        ],
        [
          100,
          1.46
        ],
        [
          95,
          1.68
        ],
        [
          90,
          1.81
        ],
        [
          85,
          1.9
        ],
        [
          80,
          1.93
        ],
        [
          76,
          1.94
        ]
      ],
      "flapsFullyExtended": [
        [
          125,
          -3.24
        ],
        [
          120,
          -3.15
        ],
        [
          115,
          -2.85
        ],
        [
          110,
          -2.35
        ],
        [
          105,
          -1.82
        ],
        [
          100,
          -1.33
        ],
        [
          95,
          -0.93
        ],
        [
          90,
          -0.63
        ],
        [
          85,
          -0.42
        ],
        [
          80,
          -0.32
        ],
        [
          75,
          -0.23
        ],
        [
          70,
          -0.2
        ],
        [
          69.5,
          -0.2
        ]
      ]
    },
    "notes": [
      "flapsRetracted spans the full charted IAS range (76-220 mph); flapsFullyExtended only spans 69.5-125 mph, matching the real printed curves' extents on the chart (flaps are not extended at high speed). Use flapsRetracted for any IAS outside flapsFullyExtended's range even with flaps out, or flag as outside the chart's data.",
      "The chart has no explicit 'flaps partially extended' curve; treat any intermediate flap setting as flapsRetracted for calibration purposes, consistent with the chart only providing these two curves."
    ],
    "verification": {
      "method": "Digitized 2026-10-01 from the new 300 DPI PDF scan (reference/poh-hires/fig5-02-airspeed-calibration.png), not present in the app's prior digitized chart set. Axis calibration: IAS axis (right scale, MPH) fit from a clean column strip far from both curves, row 896.5px = 220 mph, row 2682.5px = 60 mph (18 gridlines at exactly 10 mph spacing, residual <0.5px). Correction axis fit from the three labeled bold gridlines ('5 MPH DECREASE'/'0'/'5 MPH INCREASE' tick labels), confirmed to land precisely on columns 1303.0/1526.0/1750.5px = -5/0/+5 mph, with all 11 remaining minor gridlines landing within 0.1 mph of exact 2.5 mph multiples using this calibration -- very high confidence fit.",
      "tracing": "Each curve traced row-by-row (local continuity, previous-row column as search anchor, masked gridline columns) from a confirmed start anchor to its visually-confirmed termination row, sampled every 5 mph. The two curves do not touch or cross at any point (flapsRetracted crosses its own zero-correction gridline around 166 mph, which was verified NOT to be a crossing with the second curve via a zoomed crop -- the second apparent 'line' at that location is the '0' gridline itself, not flapsFullyExtended, which does not start until ~125 mph).",
      "confidence": "High for both curves -- clean, well-separated ink, unambiguous gridline calibration, curve endpoints confirmed by direct pixel inspection of where each line's ink terminates."
    }
  },
  "fig5-06": {
    "figure": "5-06",
    "title": "Takeoff Ground Run Distance",
    "units": "feet",
    "conditions": "Wing flaps 15°, paved/level/dry runway, full throttle and max RPM, takeoff speed = 80 MPH IAS",
    "source": "reference/fig5-06-takeoff-ground-run.png",
    "model": "ladder",
    "altitudeCurves": {
      "0": {
        "t0": 1044,
        "t120": 1466
      },
      "2000": {
        "t0": 1199,
        "t120": 1687
      },
      "4000": {
        "t0": 1386,
        "t120": 1931
      },
      "6000": {
        "t0": 1611,
        "t120": 2263
      },
      "8000": {
        "t0": 1848,
        "t120": 2592
      }
    },
    "weightExponent": 2.83,
    "windKPerMph": 0.0055,
    "tailwindMultiplier": 2.0,
    "exampleCheck": {
      "pa": 4000,
      "oatF": 65,
      "weightLb": 3200,
      "windMph": 10,
      "chartReading": 1134,
      "note": "Worked example printed on the chart (points A-F). Fully re-traced on 2026-10-01 from the new 300 DPI reference/poh-hires/fig5-06-takeoff-ground-run.png, superseding every prior pass. IMPORTANT CORRECTION: all earlier passes (including the one that called itself 'independently re-measured and trusted') mislabeled this worked example as pa=6000. Careful pixel tracing shows the dashed A-B line actually sits on the 4000 ft curve, not 6000 ft -- confirmed two independent ways: (1) the dashed vertical line's column corresponds to OAT=65, and predicting each of the 5 altitude curves' row at that column from their border+apex calibration, only the 4000 ft curve's predicted row (~1833) matches the dashed line's actual row (1832, measured as a long constant-row run under the A-B dashed segment); (2) a direct visual trace from the '4000' axis label, continuously along the solid curve, lands exactly on point A, while the '6000' curve visibly passes above point A at that column. Re-measured chain: B (4000 ft curve @ OAT 65) = 1676 ft (row 1832 on the calibrated right-axis scale); C (weight-corrected) = 1201 ft at a column corresponding to weight ~3190-3200 lb (not 3000 as previously assumed); F (final, wind-corrected) = 1134 ft with the wind leg crossing at a column close to the 10 mph gridline (not 30 mph as previously assumed). weightExponent and windKPerMph were refit from B/C/F with weight=3200, wind=10: windKPerMph came out ~0.00553, i.e. essentially unchanged from the prior stored value (0.0055, kept as-is); weightExponent came out ~2.83, a substantial revision from the prior 1.898 (that prior value was fit against the wrong curve/weight/wind and should not be trusted). With these values the model reproduces this chart's own B/C/F chain to within ~0.4%. Axis calibration used for this pass: pressure-altitude panel OAT axis spans 0 to 100°F between the left border (pixel col ~695) and the bold panel1/panel2 divider (pixel col ~1219) -- note the divider is physically at 100°F, not 120°F; t120 in this model is therefore a linear extrapolation 20° past the chart's own right edge (t120 = t0 + (edgeValue - t0) * 1.2), matching the approach needed to make the app's hardcoded lerp(0, t0, 120, t120, oatF) reproduce true chart readings. Right-axis (ground run distance) calibrated from tick marks at 2400/2000/1600/1200/800/400 ft, fitted linear value = -1.91466*row + 5183.68 (max residual <2 ft across all 6 ticks)."
    }
  },
  "fig5-07": {
    "figure": "5-07",
    "title": "Takeoff Distance Over a 50 Ft Obstacle",
    "units": "feet",
    "conditions": "Wing flaps 15°, paved/level/dry runway, full throttle and max RPM, attain 91 MPH at 50 ft AGL",
    "source": "reference/fig5-07-takeoff-distance-50ft.png",
    "model": "ladder",
    "altitudeCurves": {
      "0": {
        "t0": 1686,
        "t120": 2703
      },
      "2000": {
        "t0": 1968,
        "t120": 3207
      },
      "4000": {
        "t0": 2402,
        "t120": 3414
      },
      "6000": {
        "t0": 2887,
        "t120": 3908
      },
      "8000": {
        "t0": 3429,
        "t120": 4973
      }
    },
    "weightExponent": 1.62,
    "windKPerMph": 0.0141,
    "tailwindMultiplier": 2.0,
    "exampleCheck": {
      "pa": 4000,
      "oatF": 70,
      "weightLb": 3200,
      "windMph": 10,
      "chartReading": 2311,
      "note": "Worked example printed on the chart (points A-F). Fully re-traced on 2026-10-01 from the new 300 DPI reference/poh-hires/fig5-07-takeoff-distance-50ft.png, superseding every prior pass. IMPORTANT CORRECTION, same issue found on the sibling fig5-06 chart: every earlier pass (including the one labeled 'independently re-measured and trusted') mislabeled this worked example as pa=6000. Pixel tracing shows the dashed A-B line actually sits on the 4000 ft curve: the dashed vertical line's column corresponds to OAT~69° (matches stored oatF=70), and a direct visual trace from the '4000' axis label, followed continuously along the solid curve, lands exactly on point A, while the '6000' curve visibly passes above point A at that column (same visual pattern as fig5-06's A point, which strongly suggests both worked examples were mislabeled identically in some earlier digitization pass). Re-measured chain: B (4000 ft curve @ OAT 70) = 3257 ft (row 1821.5 on the calibrated right-axis scale); C (weight-corrected) = 2692 ft at a column corresponding to weight ~3200 lb (not 3100 as previously assumed); F (final, wind-corrected) = 2311 ft with the wind leg crossing at a column close to the 10 mph gridline (not 30 mph as previously assumed). weightExponent and windKPerMph were refit from this B/C/F chain with weight=3200, wind=10, giving weightExponent~1.62 and windKPerMph~0.0141 -- both notably different from the prior stored values (0.642 and 0.0055), which were fit against the wrong curve/weight/wind and should not be trusted. CAVEAT (new finding, not present in prior passes): unlike fig5-06, this chart's altitude curves are visibly CURVED rather than straight lines (confirmed by direct pixel sampling at multiple columns along the 4000 ft curve, which runs 25-50 px above the straight line connecting its own two endpoints through the middle of its OAT range). The app's ladder model only supports a straight-line (2-point) interpolation between t0 and t120, so for this chart that is an inherent approximation, not a measurement error: using the t0/t120 values below, the model reproduces this worked example's chartReading to only within ~8% (computed model value ~2124 ft vs the true chart reading 2311 ft measured directly above), versus <0.5% for fig5-06's example. This ~8% gap cannot be closed by re-measuring t0/t120 more precisely -- t0 and t120 are deliberately kept as the curve's true value at OAT=0 and its true (apex-extrapolated) value at OAT=120 so that altitude-to-altitude interpolation between the five stored curves stays correct; shifting them to better-fit this one OAT=70 example would improve this example's number while making the model less accurate elsewhere along the curve. If sub-1% accuracy is ever needed for this chart specifically, the data model would need to support more than 2 OAT breakpoints per altitude. Axis calibration: OAT axis spans 0 to 100°F between the left border (pixel col ~698.5) and the bold panel1/panel2 divider (pixel col ~1222), same 100-not-120 caveat as fig5-06 applies, t120 = t0 + (edgeValue - t0) * 1.2. Right-axis (takeoff distance) calibrated from tick marks at 6000/5000/4000/3000/2000/1000/0 ft, fitted linear value = -4.78958*row + 11981.15 (max residual <6 ft across all 7 ticks)."
    }
  },
  "fig5-08": {
    "figure": "5-08",
    "title": "Accelerate-Stop Distance",
    "units": "feet",
    "conditions": "Wing flaps retracted, full throttle and max RPM, both throttles closed at decision speed, accelerate to 90 MPH IAS, maximum braking effort, paved/level/dry runway",
    "source": "reference/fig5-08-accelerate-stop.png",
    "model": "ladder",
    "altitudeCurves": {
      "0": {
        "t0": 2486,
        "t120": 3431
      },
      "2000": {
        "t0": 2860,
        "t120": 3864
      },
      "4000": {
        "t0": 3244,
        "t120": 4345
      },
      "6000": {
        "t0": 3698,
        "t120": 4895
      },
      "8000": {
        "t0": 4204,
        "t120": 5482
      }
    },
    "weightExponent": 1.202,
    "windKPerMph": 0.01685,
    "tailwindMultiplier": 2.0,
    "exampleCheck": {
      "pa": 2000,
      "oatF": 70,
      "weightLb": 3200,
      "windMph": 10,
      "chartReading": 2485,
      "note": "Worked example printed on the chart (points A-F). Fully re-traced on 2026-10-01 from the new 300 DPI scan reference/poh-hires/fig5-08-accelerate-stop.png, discarding all prior pixel coordinates (measured on a different, lower-resolution crop). Calibration was rebuilt from scratch: panel dividers located at columns 667.2 (OAT=0 / left edge), 1191.8 (panel1/2 divider), 1716.2 (panel2/3 divider), 2030.4 (right edge, thin, = headwind 30/right axis), via column-darkness-sum peaks; the right-axis value scale (0-6000 ft) was calibrated from the seven axis-number text-label row centers (6000..0), giving row-to-feet to <0.3% residual. IMPORTANT correction versus all previous passes: the OAT axis gridlines (confirmed via the '0,20,40,60,80' tick-label centers, 5.25 px/degF) show the panel1/2 divider sits at OAT=100F, not 120F as the t0/t120 field names assume -- so t120 here is a linear extrapolation of each curve's straight 0-100F segment out to 120F (t120 = t0 + 1.2*(value at the divider - t0)), matching how the app's lerp(0,t0,120,t120,oatF) is actually used. Re-deriving the worked example from first principles (not trusting the stored exampleCheck) also found TWO further corrections beyond prior passes: the example's pressure altitude is 2000 ft, not 6000 ft (point A's dashed vertical arrow lands precisely on the independently-traced 2000 ft curve -- confirmed both by direct curve-overlay-on-image and by the measured value at OAT=70 on that curve matching the arrow's row to ~1.5%; the 6000 ft curve is off by >10% at the same point), and the headwind is 10 mph, not 30 -- point E/F's elbow (diagonal-to-horizontal transition) sits on the '10' gridline in the headwind panel (confirmed via pixel measurement of the elbow column against the calibrated wind-axis ticks), not the '30' gridline previously assumed by analogy with sibling charts. Weight=3200 lb was reconfirmed (point C's arrowhead sits on the '32' weight gridline). Measured points: B(=A projected to divider1)=3446 ft (model) / ~3495 ft (raw arrow-tip pixel, ~1.4% apart, within arrow-drawing tolerance), C=D=2991 ft, F=2487 ft (stored chartReading rounded to 2485, the nearest multiple of 5, matching the app's own output rounding). weightExponent and windKPerMph were refit from B(model)/C/F with the corrected weight=3200 and wind=10 mph. Model reproduces the chart's worked example to within 0.1%."
    },
    "verification": {
      "date": "2026-10-01",
      "source": "reference/poh-hires/fig5-08-accelerate-stop.png (300 DPI, 2550x3300)",
      "method": "Each of the 5 altitude curves was traced column-by-column in two clean segments (avoiding the STD TEMP diagonal reference line and the worked-example arrow/label graphics) using local-continuity nearest-run matching with linear-prediction and outlier rejection, then fit to a straight line (OAT 0-100F) and extrapolated to 120F. All 5 fits used 330-345 traced points each with residual std 0.3-0.6 px (< 0.1% of chart height) and max residual <3 px, and the fitted lines were visually confirmed to overlay the printed curves pixel-for-pixel across the full panel including through the STD TEMP crossing. Cross-check: the worked example (independently re-derived, see exampleCheck.note) reproduces the chart's printed answer to 0.01%.",
      "confidencePerAltitude": {
        "0": "high - 343 traced points, residual std 0.4 px",
        "2000": "high - 331 traced points, residual std 0.6 px; also independently anchored by the worked example",
        "4000": "high - 338 traced points, residual std 0.4 px",
        "6000": "high - 335 traced points, residual std 0.5 px",
        "8000": "high - 328 traced points, residual std 0.6 px"
      }
    }
  },
  "fig5-15": {
    "figure": "5-15",
    "title": "Landing Ground Roll Distance",
    "units": "feet",
    "conditions": "Wing flaps 27°, paved/level/dry runway, throttles closed, maximum braking effort, approach speed = 90 MPH IAS, touchdown speed = 70 MPH IAS",
    "source": "reference/fig5-15-landing-ground-roll.png",
    "model": "ladder",
    "altitudeCurves": {
      "0": {
        "t0": 617,
        "t120": 778
      },
      "2000": {
        "t0": 675,
        "t120": 834
      },
      "4000": {
        "t0": 718,
        "t120": 896
      },
      "6000": {
        "t0": 775,
        "t120": 965
      },
      "8000": {
        "t0": 833,
        "t120": 1043
      }
    },
    "weightExponent": 1.086,
    "windKPerMph": 0.02126,
    "tailwindMultiplier": 2.0,
    "exampleCheck": {
      "pa": 4000,
      "oatF": 70,
      "weightLb": 3100,
      "windMph": 10,
      "chartReading": 550,
      "note": "Worked example printed on the chart (points A-F). Fully re-traced on 2026-10-01 from the new 300 DPI scan reference/poh-hires/fig5-15-landing-ground-roll.png, discarding all prior pixel coordinates (measured on a different, lower-resolution crop). Calibration rebuilt from scratch: panel dividers at columns 659.3 (OAT=0/left edge), 1184.4 (panel1/2 divider), 1708.2 (panel2/3 divider), ~2026 (right edge); the right-axis value scale (0-1200 ft) calibrated from the six axis-number label row centers (1200..200, the '0' label excluded as an outlier due to single-digit glyph centering), giving row-to-feet to <1 px residual, cross-checked against the independently-located solid 'value=0' gridline (row 2500, matches calibration's row 2499.1 almost exactly). As in fig5-08, the OAT-axis tick labels show the panel1/2 divider sits at OAT=100F (not 120F), so t120 is a linear extrapolation of each curve's straight 0-100F segment (t120 = t0 + 1.2*(divider value - t0)), matching how the app's lerp(0,t0,120,t120,oatF) is used. PA=4000 and OAT=70F (prior pass's correction from 6000/65F) were reconfirmed here independently: point A's dashed arrow lands on the freshly-traced 4000 ft curve (confirmed by curve-overlay-on-image), and the model's predicted value for that curve at OAT=70F (821.4 ft) matches the directly-measured arrow-tip row (821.9 ft) to 0.05%. Weight=3100 lb was reconfirmed (point C sits close to the '31' position on the weight axis, between the '32' and '30' gridlines). However, the wind input is corrected AGAIN here: careful re-measurement of the diagonal-to-horizontal elbow at point E (not just a rough gridline glance) places it at the '10' mph headwind gridline, not '30' -- the same correction independently found on fig5-08's worked example in this same pass, which casts doubt on the earlier claim (from a lower-resolution pass) that a 30 mph pattern was confirmed across multiple sibling charts; that claim was not re-examined here since fig5-06/07/16 are out of scope for this pass, but it should be treated with suspicion. Measured points (using the carefully-isolated arrow/elbow pixels, not coincidentally-overlapping background gridlines, which caused this pass's first-draft readings of B and C to be off by several percent before being caught): B=822 ft, C=D=698 ft, F=550 ft. weightExponent and windKPerMph were refit from these with weight=3100 lb and wind=10 mph. Model reproduces the chart's worked example to within 0.05%."
    },
    "verification": {
      "date": "2026-10-01",
      "source": "reference/poh-hires/fig5-15-landing-ground-roll.png (300 DPI, 2550x3300)",
      "method": "Each of the 5 altitude curves was traced column-by-column across the full panel using local-continuity nearest-run matching with linear slope prediction and an added guard that rejects any step implying a strongly positive slope (which otherwise causes the tracer to jump onto the STD TEMP reference line, which crosses all 5 curves at a steeper, opposite-sign slope). Fits used 350-375 traced points each with residual std 0.27-0.44 px and max residual <2.1 px, and the fitted lines were visually confirmed to overlay the printed curves pixel-for-pixel across the full panel, including through the STD TEMP crossing. Cross-check: the independently re-derived worked example reproduces the chart's printed answer to 0.05%.",
      "confidencePerAltitude": {
        "0": "high - 375 traced points, residual std 0.27 px",
        "2000": "high - 375 traced points, residual std 0.43 px",
        "4000": "high - 350 traced points, residual std 0.28 px; also independently anchored by the worked example",
        "6000": "high - 360 traced points, residual std 0.44 px",
        "8000": "high - 366 traced points, residual std 0.44 px"
      }
    }
  },
  "fig5-16": {
    "figure": "5-16",
    "title": "Landing Distance Over a 50 Ft Obstacle",
    "units": "feet",
    "conditions": "Wing flaps 27°, paved/level/dry runway, maximum braking effort, approach speed = 90 MPH IAS",
    "source": "reference/fig5-16-landing-distance-50ft.png",
    "model": "ladder",
    "altitudeCurves": {
      "0": {
        "t0": 1952,
        "t120": 2265
      },
      "2000": {
        "t0": 2038,
        "t120": 2389
      },
      "4000": {
        "t0": 2157,
        "t120": 2525
      },
      "6000": {
        "t0": 2272,
        "t120": 2676
      },
      "8000": {
        "t0": 2388,
        "t120": 2841
      }
    },
    "weightExponent": 0.666,
    "windKPerMph": 0.017477,
    "tailwindMultiplier": 2.0,
    "exampleCheck": {
      "pa": 2000,
      "oatF": 65,
      "weightLb": 3200,
      "windMph": 10,
      "chartReading": 1700,
      "note": "Worked example printed on the chart (points A-F). PA=2000, OAT=65, weightLb=3200 and chartReading=1700 were independently re-confirmed on 2026-10-01 from reference/poh-hires/fig5-16-landing-distance-50ft.png (panel dividers at columns x=665/1190/1714 via darkness-fraction scans; shared landing-distance axis calibrated from 7 printed gridline labels, value(row) = -1.9166*row + 5189.84, residuals <4ft). IMPORTANT CORRECTION (2026-10-01, this pass): windMph was stored as 30, under the assumption 'consistent with the pattern already confirmed across fig5-06/07/08/16' -- that assumption was never independently re-verified against this chart's own high-res image, and turned out to be wrong. Point E's arrowhead was pixel-measured directly: its column center (~1827, from the arrowhead's widest triangular span 1817-1838) matches the headwind axis's own printed '10' tick label (independently measured center column 1827, via the same text-centroid method used for the weight axis) to better than 1px -- an exact, unambiguous match. Point E is nowhere near the '30' gridline (column ~2034). This matches the wind=10 finding independently made on fig5-06, fig5-07, fig5-08, and fig5-15 in this same re-verification pass -- the 'wind=30 confirmed across all 5 ladder charts' belief from the prior (low-res) verification pass was wrong for ALL FIVE charts, not just these two; wind=10 mph is now confirmed on every one of them. windKPerMph was refit for this corrected windMph=10 (old value 0.00583 was fit against the wrong wind=30 assumption and scaled accordingly): using the already-verified baseValue(2000,65)=2228.125 and weight-corrected C=2228.125*(3200/3600)^0.666=2060.02, solving (1-windK*10)=1700/2060.02 gives windKPerMph=0.017477. weightExponent (0.666) is unaffected by this correction (derived from the B-to-C weight-panel segment only) and is unchanged. Model reproduces chartReading=1700 to within 0.00% with the corrected values."
    }
  },
  "fig5-09": {
    "figure": "5-09",
    "title": "Multi-Engine Rate of Climb vs Density Altitude and Weight",
    "units": "ft/min",
    "conditions": "Cowl flaps open, full throttle and max RPM, landing gear retracted, mixture adjusted for smooth operation, optimum airspeed, wing flaps retracted",
    "source": "reference/fig5-09-multi-engine-roc.png",
    "model": "linear-by-weight",
    "weightCurves": {
      "2800": {
        "seaLevel": 2043,
        "daAtZero": 21926
      },
      "3200": {
        "seaLevel": 1694,
        "daAtZero": 20963
      },
      "3600": {
        "seaLevel": 1445,
        "daAtZero": 19993
      }
    },
    "verification": {
      "method": "Re-measured against the 300 DPI hi-res scan (reference/poh-hires/fig5-09-multi-engine-roc.png) on 2026-10-01, calibration re-derived fresh from this image (not reused from the prior lower-res pass). Axis gridlines (both major and minor) were located by darkness-fraction column/row scans, then masked out of a working copy of the image so curve-crossing pixels could be isolated from gridline pixels at arbitrary rows/columns. IMPORTANT finding: the DA axis actually spans SL-32000 ft (17 gridlines, 2000 ft apart) rather than SL-28000 ft as a first-pass row count assumed -- the chart has two unlabeled minor gridlines above the '28000' label. Using the corrected full-height calibration, each of the 3 modeled curves (ignoring the unmodeled 4th 'gear extended' curve, which stays consistently leftmost/worst at every altitude) was traced at ~40-60 clean pixel points in two bands: a near-ceiling band (DA ~14000-22000 ft, used for the daAtZero intercept) and a near-sea-level band (DA ~125-4700 ft, used for the seaLevel intercept), both away from the diagonal curve-label text that contaminates the middle of the chart. Linear fits in both bands were extremely tight (max residual 1-5 ROC units out of a ~1000-2000 unit range) and were cross-checked against direct pixel reads at the sea-level axis line and visually confirmed against a gridline-overlay crop.",
      "date": "2026-10-01",
      "changeFromOriginal": "daAtZero (service ceiling) values confirmed within ~0.5% of the prior pass for all three curves (2800: 22025->21926, 3200: 21080->20963, 3600: 20060->19993) -- left as effectively unchanged, well within normal reading tolerance. seaLevel values, however, were consistently and significantly low in the prior pass: corrected 2800 lb 1895->2043 (+7.8%), 3200 lb 1566->1694 (+8.2%), 3600 lb 1337->1445 (+8.1%). All three curves shifted in the same direction by a similar percentage, and the corrected values were independently confirmed by (a) a local linear fit extrapolated only a short distance to DA=0, (b) a direct pixel read right at the SL gridline, and (c) a visual gridline-overlay crop showing the curves plainly crossing SL to the right of where the old values would place them. Likely cause of the prior error: the earlier lower-resolution source image made the closely-spaced curve terminations near SL harder to distinguish from each other and from the unmodeled 4th curve.",
      "confidence": "High for all three curves at both the ceiling and sea-level ends -- large sample sizes (40-60 points per fit per curve), very low fit residuals, and the sea-level correction was corroborated by three independent methods."
    }
  },
  "fig5-10": {
    "figure": "5-10",
    "title": "Single-Engine Rate of Climb vs Density Altitude and Weight",
    "units": "ft/min",
    "conditions": "Left engine inoperative, left propeller feathered, right engine full throttle, right propeller max RPM, mixture adjusted for smooth operation, gear and wing flaps retracted, optimum airspeed, cowl flaps open",
    "source": "reference/fig5-10-single-engine-roc.png",
    "model": "linear-by-weight",
    "weightCurves": {
      "2800": {
        "seaLevel": 520,
        "daAtZero": 11530
      },
      "3200": {
        "seaLevel": 373,
        "daAtZero": 9200
      },
      "3600": {
        "seaLevel": 260,
        "daAtZero": 7085
      }
    },
    "verification": {
      "method": "Re-checked on 2026-10-01 against the new 300 DPI source reference/poh-hires/fig5-10-single-engine-roc.png. Axes calibrated fresh from gridline/tick pixel positions (x: ROC = 0.47577*col - 346.9, from 11 tick columns spanning 0-700 ft/min, residuals <1.2 ROC; y: alt = -9.58738*row + 25955.8, from 7 labeled gridlines 2000-14000 ft, residuals <10 ft). Each curve is a straight line, so each was fit via least squares over ~75-195 clean (non-gridline, non-label-text) pixel samples per curve collected across the full span between the SL crossing and the service-ceiling crossing (iterative outlier rejection, final residuals <3px / well under 0.5% of chart range). seaLevel values re-measured directly at the row=SL gridline; all three matched the prior pass to within 1 ft/min (520, 374, 260 vs stored 520, 373, 260) and were left unchanged. daAtZero (service ceiling) was consistently ~1-2% higher than the prior-pass values in the new, sharper trace.",
      "date": "2026-10-01",
      "changeFromOriginal": "This pass vs. the prior (already-good) pass: seaLevel values confirmed unchanged for all three curves (520, 373, 260). daAtZero nudged up slightly for all three on the sharper image: 2800 lb 11400 -> 11530 (+1.1%), 3200 lb 9100 -> 9200 (+1.1%), 3600 lb 6925 -> 7085 (+2.3%). (Earlier history: seaLevel had been significantly underestimated before the prior pass, worst for 3600 lb which was corrected 150 -> 260 ft/min.)",
      "confidence": "High for all three curves — straight-line fits over 75-195 points each with sub-3px residuals; SL points directly measured at a clean, uncrowded part of the chart; ceiling points cross-checked by extrapolating the full-length least-squares fit rather than reading only the noisy region right at the axis border (which overlaps the 'SERVICE CEILING' label/arrow and the diagonal weight-label text printed on each line)."
    }
  },
  "fig5-11": {
    "figure": "5-11",
    "title": "Vx and Vy vs Density Altitude",
    "units": "mph IAS",
    "conditions": "Gross weight 3600 lb, landing gear retracted, full throttle and max RPM, wing flaps retracted, mixture adjusted for smooth operation, cowl flaps open",
    "source": "reference/fig5-11-vx-vy.png",
    "model": "linear-vxvy",
    "multiEngine": {
      "vx": {
        "seaLevel": 90,
        "at15000": 94
      },
      "vy": {
        "seaLevel": 112,
        "at15000": 99
      }
    },
    "singleEngine": {
      "ceilingDa": 6189,
      "vx": {
        "seaLevel": 94,
        "atCeiling": 98
      },
      "vy": {
        "seaLevel": 104,
        "atCeiling": 98
      }
    },
    "verification": {
      "method": "Re-confirmed on 2026-10-01 against the 300 DPI hi-res scan (reference/poh-hires/fig5-11-vx-vy.png), with calibration re-derived fresh (not reused from the prior pass). The chart's DA axis (SL-15000 ft) and the two separate airspeed-axis strips (multi-engine panel: 80-120 mph; single-engine panel: 90-110 mph, offset to the right of a bold divider line at a different pixel-per-mph scale) were each calibrated from their own gridlines and cross-checked against their printed axis-label text. Multi-engine: both curves re-traced at ~395 clean pixel points each (every few rows from SL to 15000 ft, gridlines/text masked out); both fit a straight line to within 0.15 mph max residual. Single-engine: both branches re-traced at 522 clean points each between the ceiling and SL; linear fits had a max residual of 0.13 mph, and the two branches' extrapolated intersection (apex) was computed directly. That computed apex (DA 6189 ft, 98.0 mph) was then cross-checked against (a) the raw image, where the curve's topmost dark pixels first appear at essentially that exact row, and (b) a gridline-overlay crop, where a marker line drawn at DA=6189 lands visually right on the tent's peak -- well below (not at) the 9000 ft gridline and clearly above the 6000 ft gridline, consistent with ~6189 ft and clearly inconsistent with 7189 ft (which would sit much closer to the 9000 ft line than the peak actually does).",
      "date": "2026-10-01",
      "changeFromOriginal": "Multi-engine values confirmed within ~1% of the prior pass (vx SL 90->90.3, vx at15000 94->94.0, vy SL 112->111.1, vy at15000 99->98.4) -- left unchanged, within normal reading tolerance. Multi-engine no-crossing finding re-confirmed: Vy stays above Vx at every sampled altitude from SL to 15000 ft. Single-engine vx values confirmed unchanged (SL 94, atCeiling 98). Single-engine vy.seaLevel adjusted slightly 105->104 (a ~1% refinement, now backed by a 522-point fit). The single-engine convergence-to-one-point finding at the ceiling is strongly re-confirmed (98 mph for both vx and vy). The single-engine ceilingDa, however, is corrected substantially: 7189 -> 6189 ft (a ~1000 ft / 14% reduction). This was the figure explicitly flagged as uncertain in the prior pass, and the hi-res image makes it unambiguous -- the tent's apex sits clearly closer to the 6000 ft gridline than the 9000 ft one, not at 7189 ft. (For context, this remains somewhat different from the independently-measured 3600 lb single-engine ceiling on fig5-10, 6925 ft -- fig5-10 is out of scope for this pass and was not re-verified here, so that cross-chart gap is noted but not resolved.)",
      "confidence": "High for multi-engine (large, very linear point sets). High for single-engine SL values and the ceiling-convergence finding. High (upgraded from the prior pass's uncertain reading) for ceilingDa -- confirmed by three independent methods (branch-intersection fit, direct topmost-pixel read, and visual gridline-overlay check) that all agree to within ~20 ft of each other."
    }
  },
  "fig5-12": {
    "figure": "5-12",
    "title": "True Airspeed vs Density Altitude",
    "units": "mph TAS",
    "conditions": "Gross weight 3600 lb, gear and wing flaps retracted, mixture best power cruise, cowl flaps closed",
    "source": "reference/fig5-12-true-airspeed.png",
    "model": "linear-by-power",
    "powerCurves": {
      "45": {
        "seaLevel": 137.6,
        "at16000": 149.4
      },
      "55": {
        "seaLevel": 154.6,
        "at16000": 171.8
      },
      "65": {
        "seaLevel": 169.6,
        "at16000": 191.2
      },
      "75": {
        "seaLevel": 181.7,
        "at16000": 205.7
      }
    },
    "verification": {
      "note": "Re-measured pixel-by-pixel against the 300 DPI hi-res scan (reference/poh-hires/fig5-12-true-airspeed.png) on 2026-10-01, with calibration (DA axis and the two separate mph/knots axis strips) re-derived fresh from this image's own gridlines and axis-label text, not reused from the prior pass. Each curve was fit with linear least-squares over ~180 clean pixel points near SL (residuals <0.2 mph) to get seaLevel, and separately traced upward (narrow-window curve-following, gridlines masked out) to locate its real bend/termination point. The chart's curves do NOT all extend to 16000 ft -- each %power setting has its own real ceiling (the altitude where full throttle is required, i.e. where the curve bends into the '2400 RPM FULL THROTTLE' or '2700 RPM FULL THROTTLE' envelope line, or simply stops). app.js's linear-by-power model only supports a {seaLevel, at16000} pair, so at16000 values beyond each curve's real ceiling are a straight-line extrapolation of that curve's own measured near-SL slope, not real chart data.",
      "realCeilings": {
        "45": {
          "ft": 16000,
          "tasMph": 149.4,
          "note": "Curve's real top (flat termination, no envelope merge) matches the schema's 16000 ft point almost exactly -- re-confirmed."
        },
        "55": {
          "ft": 15970,
          "tasMph": 171.7,
          "note": "MAJOR CORRECTION from the prior pass (was ft:14667, tasMph:159.1). On the hi-res image, 55%'s curve rises smoothly and nearly perfectly linearly (matching its own SL-region fit to within ~0.1 mph) almost all the way to 16000 ft, where it comes to a sharp peak merging into the 2400 RPM FULL THROTTLE envelope line -- essentially the same altitude as 45%'s termination, not ~1300 ft lower. The prior pass's 14667 ft figure does not correspond to any feature found on this curve in the hi-res image."
        },
        "65": {
          "ft": 11900,
          "tasMph": 185.7,
          "note": "MAJOR CORRECTION from the prior pass (was ft:15967, tasMph:169.0). The sharp peak near 16000 ft that merges into the 2400 RPM FULL THROTTLE envelope belongs to the 55% curve, not 65% (confirmed by matching each curve's own independently-fit SL slope against the peak's measured mph -- the ~16000ft peak's mph matches 55%'s extrapolation to within 0.1 mph and is 10%+ off from 65%'s). 65% actually separates from that envelope much lower, following its own smooth, tightly-linear path from SL (deviating <0.1 mph from a pure straight line) and bending into the SAME 2400 RPM envelope at a sharp peak around 11900 ft / 185.7 mph instead. In effect, the prior pass's 55% and 65% real-ceiling readings were swapped onto the wrong curves, in the chart's visually crowded mid-altitude region where the two power curves and the 2400 RPM envelope line all run close together."
        },
        "75": {
          "ft": 8020,
          "tasMph": 193.6,
          "note": "Altitude re-confirmed close to the prior pass (8000 -> 8020 ft, within tolerance), but the mph value is corrected substantially (184.6 -> 193.6, +4.9%) now that the curve's seaLevel point itself has been corrected upward (176.7 -> 181.7). Sharp peak where the curve meets the 2700 RPM FULL THROTTLE envelope, confirmed via direct pixel read of the peak (193.6 mph) matching the SL-fit's extrapolation to 8020 ft (193.7 mph) to within 0.1 mph."
        }
      },
      "confidence": {
        "45": "high - clean, unambiguous flat termination, closely matches prior pass",
        "75": "high - clean sharp peak, altitude confirmed, mph corrected and cross-validated by two independent methods (direct pixel read and SL-fit extrapolation) agreeing to within 0.1 mph",
        "55": "high (upgraded from the prior pass's medium confidence) - the hi-res image resolves the gridline-adjacent ambiguity the prior pass flagged, and firmly relocates this curve's real ceiling to ~16000 ft instead of 14667 ft; ~180-point SL fit plus the peak match to that fit leave little ambiguity",
        "65": "high - correcting a structural mix-up with 55% (not just a magnitude error) from the prior pass; the ~12000 ft peak's mph matches 65%'s own independently-fit slope (extrapolated from ~180 clean SL-region points) to within 0.1 mph over a very long, well-constrained clean tracked segment (SL to ~11850 ft with <0.1 mph deviation throughout)"
      }
    }
  },
  "fig5-13": {
    "figure": "5-13",
    "title": "Range Profile",
    "units": "statute miles",
    "conditions": "Basic fuel 84 US gal, weight 3600 lb at start, gear and flaps retracted, mixture best economy cruise. No allowance for wind or navigation errors beyond the 45-minute reserve already baked into the chart.",
    "source": "reference/fig5-13-range-profile.png",
    "model": "linear-by-power",
    "fuelGal": 84,
    "powerCurves": {
      "45": {
        "seaLevel": 983.4,
        "at16000": 1050.3
      },
      "55": {
        "seaLevel": 947.3,
        "at16000": 1020.7
      },
      "65": {
        "seaLevel": 914.8,
        "at16000": 983.3
      },
      "75": {
        "seaLevel": 854.7,
        "at16000": 923.7
      }
    },
    "verification": {
      "note": "Re-measured pixel-by-pixel against the 300 DPI hi-res scan (reference/poh-hires/fig5-13-range-profile.png) on 2026-10-01, with the DA-axis and range-axis calibration re-derived fresh from this image's own gridlines and axis-label text (BASIC FUEL 84 gal solid curves only -- the TIP TANK FUEL dashed curves on the same chart were ignored, out of scope). Each curve was fit with linear least-squares over ~100-180 clean pixel points near SL (residuals mostly <0.2 mi, one curve briefly to ~1.1 mi where a dashed tip-tank line passes close by) to get seaLevel, and separately traced upward to its real flat-topped termination point. Like fig 5-12, not all curves reach 16000 ft -- each terminates where the aircraft can no longer sustain that %power (full-throttle limit).",
      "realCeilings": {
        "45": {
          "ft": 15000,
          "mi": 1046,
          "note": "CORRECTED from the prior pass (was ft:16000). The curve's flat top is clearly one major gridline interval below the chart's 16000 ft top border, not at it -- confirmed by direct pixel measurement of the termination row and cross-checked against the SL-region fit extrapolated to that altitude (1050 vs the measured 1046, a 0.4% match). The mi value itself was already close in the prior pass (1045); only the altitude was off."
        },
        "55": {
          "ft": 15000,
          "mi": 1015,
          "note": "CORRECTED from the prior pass (was ft:14667). On the hi-res image, 55% terminates (flat top, no further curve above) at essentially the SAME altitude as 45% -- both curves' tops sit side by side at the same row, about 1300 ft higher than the prior pass's reading. Matches the SL-region fit extrapolated to that altitude (1021 vs measured ~1015, within 0.6%)."
        },
        "65": {
          "ft": 12000,
          "mi": 967,
          "note": "Altitude re-confirmed closely (was 12000, now measured ~11990). mi value revised 948 -> 967 (+2%), based on a direct pixel read of the termination point matching the SL-fit extrapolation (966 predicted vs 967 measured) to within 0.1 mi. Re-verified with a sensitive low-threshold rescan of the gap just above this point (DA ~12000-15000) confirming genuinely blank ink there -- not a faint/missed continuation. Note: the companion fig5-14 endurance chart's 65% curve does NOT show this same 12000 ft cutoff (it runs continuously to ~15000 ft there); that is a real difference between the two charts for this curve, not a measurement error in either one."
        },
        "75": {
          "ft": 8000,
          "mi": 890,
          "note": "Altitude re-confirmed closely (was 8000, now measured ~7990). mi value revised 874 -> 890 (+1.8%), consistent with the corrected, slightly higher seaLevel point; direct pixel read of the termination matches the SL-fit extrapolation (889.9) almost exactly."
        }
      },
      "correctionVsOriginal": "seaLevel values for all four curves are revised slightly upward from the prior pass (45: 997->983.4, 55: 961->947.3, 65: 928->914.8, 75: 868->854.7), a consistent ~1.3-1.5% shift in the same direction across all four curves -- most likely a small systematic calibration difference between the prior pass's lower-resolution source image and this fresh hi-res calibration, re-derived independently per the task's instructions. More importantly, the REAL CEILING altitudes for 45% and 55% are corrected: the prior pass had 45% terminating at exactly 16000 ft and 55% noticeably lower at 14667 ft; the hi-res image shows both curves' flat tops sitting at essentially the SAME altitude, about 15000 ft -- roughly 1000 ft below the chart's 16000 ft top border for 45%, and about 300 ft above the prior reading for 55%. 65% and 75%'s real-ceiling altitudes were already accurate (12000 and 8000 ft) and are reconfirmed; only their mi values at those points are revised up slightly (~2%). All four curves' relative ordering (45 > 55 > 65 > 75, i.e. lower power = longer range) remains correct.",
      "confidence": {
        "45": "high - clean, unambiguous flat termination, directly visible and pixel-measured one gridline below the chart top",
        "55": "high - clean, unambiguous flat termination sitting right alongside 45%'s, resolving the prior pass's altitude discrepancy between the two",
        "65": "high - clean, unambiguous flat termination, altitude closely reconfirmed",
        "75": "high - clean, unambiguous flat termination, altitude closely reconfirmed"
      }
    }
  },
  "fig5-14": {
    "figure": "5-14",
    "title": "Endurance Profile",
    "units": "hours",
    "conditions": "Basic fuel 84 US gal, weight 3600 lb at start, gear and flaps retracted, mixture best economy cruise. No allowance for wind beyond the 45-minute reserve already baked into the chart.",
    "source": "reference/fig5-14-endurance-profile.png",
    "model": "linear-by-power",
    "fuelGal": 84,
    "powerCurves": {
      "45": {
        "seaLevel": 6.95,
        "at16000": 7.28
      },
      "55": {
        "seaLevel": 5.89,
        "at16000": 6.32
      },
      "65": {
        "seaLevel": 5.18,
        "at16000": 5.19
      },
      "75": {
        "seaLevel": 4.6,
        "at16000": 3.93
      }
    },
    "verification": {
      "note": "Re-measured pixel-by-pixel against the 300 DPI hi-res scan (reference/poh-hires/fig5-14-endurance-profile.png) on 2026-10-01, with DA-axis and endurance-axis calibration re-derived fresh (BASIC FUEL 84 gal solid curves only). seaLevel values come from a ~180-point linear fit very close to SL (residuals ~0.002 hr) and were independently cross-checked with a direct gridline-overlay crop showing exactly where each curve crosses the SL line. MAJOR FINDING: all four seaLevel values are substantially higher than the prior pass (roughly +15 to +19%, in the same direction for all four) -- confirmed unambiguously by the overlay crop, which shows each curve crossing SL well to the right of where the prior pass's values would place it. Each curve was then traced continuously, row by row with gridlines masked out, from SL up to its real termination point; none of the four curves changes endurance monotonically with altitude -- all four dip or bend before any rise appears, which is why a simple SL-to-ceiling slope does not describe the whole curve (the stored at16000 is still just a straight line between the two schema points, per the model's limits).",
      "realCeilings": {
        "75": {
          "ft": 8010,
          "hr": 4.26,
          "note": "Altitude re-confirmed (was 8000). hr value corrected 4.25 -> 4.26, consistent with the corrected, higher seaLevel point -- this curve's endurance actually DECREASES from SL to its ceiling (4.60 -> 4.26), not increases; confirmed by continuous pixel tracing with no gaps from SL to this termination."
        },
        "65": {
          "ft": 14980,
          "hr": 5.19,
          "note": "MAJOR CORRECTION from the prior pass (was ft:12000, hr:4.67). Direct-labeled ('65 PERCENT POWER') continuous pixel tracing, with no gap, from SL all the way to ~14980 ft found no termination anywhere near 12000 -- the curve dips to a minimum around mid-altitude then recovers, ending almost exactly back at its own seaLevel value (5.18 -> 5.19, essentially flat net change) at essentially the SAME altitude where 55% and 45% also terminate. Verified independently by (a) a direct circle-marker overlay confirming the SL point and a mid-altitude point both lie on the curve labeled 65%, and (b) a sensitive low-threshold re-scan of fig5-13's analogous 65% gap region (different chart) confirming that THAT chart's 65% really does stop at 12000 with genuinely blank ink above it -- i.e. this is a real difference between the range and endurance charts for this curve, not a measurement artifact in either one."
        },
        "55": {
          "ft": 14980,
          "hr": 6.29,
          "note": "Altitude re-confirmed (was 15000). hr value corrected 5.49 -> 6.29, consistent with the corrected, higher seaLevel point; terminates at essentially the same altitude as 65% and 45%."
        },
        "45": {
          "ft": 14950,
          "hr": 7.26,
          "note": "Altitude re-confirmed (was 15000, previously flagged lower-confidence due to overlap with 55%). The hi-res image cleanly separates this curve from 55% throughout -- no overlap found. hr value corrected 6.3 -> 7.26, consistent with the corrected, higher seaLevel point."
        }
      },
      "correctionVsOriginal": "seaLevel values are corrected upward for all four curves, by a large and consistent margin (45: 5.85->6.95, 55: 5.14->5.89, 65: 4.56->5.18, 75: 4.0->4.6, each +13-19%) -- directly confirmed by a gridline-overlay crop at the SL line, not just a pixel-fit number. This is a bigger and more consistent shift than the prior pass's stated confidence would suggest, and supersedes it. The at16000 values are revised accordingly, and the realCeilings are substantially restructured: 65% no longer shows the clean, separate 12000 ft termination the prior pass found (that termination was re-confirmed as real, but on fig5-13's range chart, not reproduced here) -- in the endurance chart, 65% instead runs continuously up to ~15000 ft alongside 55% and 45%, matching their termination altitude almost exactly. Only 75% keeps a distinct, much lower ceiling (~8000 ft).",
      "confidence": {
        "75": "high - seaLevel and ceiling both confirmed by tight fits and continuous, gap-free tracing",
        "65": "high (upgraded from the prior pass, though the finding itself is a structural correction, not just a magnitude one) - confirmed by label-matched circle-marker overlay plus hundreds of rows of continuous, gap-free tracing from SL to termination",
        "55": "high - seaLevel confirmed by tight fit and SL overlay; ceiling confirmed by continuous tracing with no overlap ambiguity found on the hi-res image",
        "45": "high (upgraded from the prior pass's medium confidence) - the hi-res image resolves the 55%/45% overlap the prior pass flagged; both curves are cleanly distinguishable throughout"
      }
    }
  },
  "fig6-01": {
    "figure": "6-01",
    "title": "Approved C.G. Range and Weight",
    "units": "inches aft of datum / lb",
    "conditions": "Standard (non tip-tank) configuration, max gross weight 3600 lb",
    "source": "reference/poh-hires/fig6-01-cg-envelope.png",
    "model": "polygon",
    "forwardLimitLabel": "7.0% MAC",
    "aftLimitLabel": "26.3% MAC",
    "polygon": [
      [
        81.0,
        2300
      ],
      [
        81.0,
        2450
      ],
      [
        83.0,
        3200
      ],
      [
        86.5,
        3600
      ],
      [
        92.0,
        3600
      ],
      [
        92.0,
        2300
      ]
    ],
    "unmodeled": "A dashed line above the solid envelope (roughly (86.5,3600) up to ~3750, flat to ~(92,3750), back down to (92,3600)) appears on the chart but is unlabeled in this source and not covered by the limits table below it. Not digitized — likely a ferry/non-standard-category weight extension rather than a normal operating limit. Do not treat gross weights between 3600 and ~3750 lb as approved without checking the POH text for what this dashed line represents.",
    "verificationNote": "Re-derived on 2026-10-01 directly from the printed C.G. limits table accompanying Figure 6-01 (reference/poh-hires/fig6-01-cg-limits-table.png), which gives exact forward/aft CG limits by weight: 3,600 lb -> fwd 86.5 / aft 92.0; 3,200 lb -> fwd 83.0 / aft 92.0; 2,450 lb or less -> fwd 81.0 / aft 92.0. This is authoritative printed numeric data, not a pixel trace, and supersedes the prior pixel-measured polygon (which had already corrected an earlier 3800-vs-3600 axis mislabel and a bend point error, but was still an approximation of the curve with a dense multi-point fit). The envelope is exactly 3 straight segments on the forward-limit side: (81.0,2300)-(81.0,2450) flat, (81.0,2450)-(83.0,3200), (83.0,3200)-(86.5,3600); the aft limit is a constant 92.0 (vertical line) across the full weight range. Chart image confirms these exact breakpoints visually: the forward-limit line bends precisely on the gridlines at (81.0 in, 2450 lb), (83.0 in, 3200 lb), and (86.5 in, 3600 lb)."
  },
  "fig5-17": {
    "figure": "5-17",
    "title": "Power Setting Table",
    "conditions": "Lycoming model IO-320-B, 160 HP normally aspirated engine",
    "source": "reference/fig5-17-power-setting-table.png",
    "model": "table",
    "notes": [
      "1. Best economy cruise - peak EGT",
      "2. Best power cruise - 100 degrees Fahrenheit rich of peak EGT",
      "To maintain constant power, correct manifold pressure approximately 0.17 inch Hg for each 10 degree Fahrenheit variation in induction air temperature from standard altitude temperature. Add manifold pressure for temperatures above standard; subtract for temperatures below standard."
    ],
    "rows": [
      {
        "altitude": "Sea Level",
        "stdTempF": 59,
        "stdTempC": 15,
        "p55": {
          "gph": "13.4 / 16.0",
          "mp": {
            "2100": 22.4,
            "2200": 21.7,
            "2300": 21.0,
            "2400": 20.4
          }
        },
        "p65": {
          "gph": "15.2 / 17.7",
          "mp": {
            "2100": 25.0,
            "2200": 24.2,
            "2300": 23.3,
            "2400": 22.7
          }
        },
        "p75": {
          "gph": "17.2 / 20.0",
          "mp": {
            "2200": 26.5,
            "2300": 25.6,
            "2400": 24.9
          }
        }
      },
      {
        "altitude": "1,000",
        "stdTempF": 55,
        "stdTempC": 13,
        "p55": {
          "mp": {
            "2100": 22.1,
            "2200": 21.5,
            "2300": 20.7,
            "2400": 20.2
          }
        },
        "p65": {
          "mp": {
            "2100": 24.7,
            "2200": 23.9,
            "2300": 23.0,
            "2400": 22.4
          }
        },
        "p75": {
          "mp": {
            "2200": 26.2,
            "2300": 25.3,
            "2400": 24.6
          }
        }
      },
      {
        "altitude": "2,000",
        "stdTempF": 52,
        "stdTempC": 11,
        "p55": {
          "mp": {
            "2100": 21.8,
            "2200": 21.2,
            "2300": 20.5,
            "2400": 19.9
          }
        },
        "p65": {
          "mp": {
            "2100": 24.4,
            "2200": 23.6,
            "2300": 22.8,
            "2400": 22.2
          }
        },
        "p75": {
          "mp": {
            "2200": 25.9,
            "2300": 25.0,
            "2400": 24.3
          }
        }
      },
      {
        "altitude": "3,000",
        "stdTempF": 48,
        "stdTempC": 9,
        "p55": {
          "mp": {
            "2100": 21.6,
            "2200": 20.9,
            "2300": 20.2,
            "2400": 19.7
          }
        },
        "p65": {
          "mp": {
            "2100": 24.1,
            "2200": 23.3,
            "2300": 22.5,
            "2400": 21.9
          }
        },
        "p75": {
          "mp": {
            "2200": 25.6,
            "2300": 24.7,
            "2400": 24.0
          }
        }
      },
      {
        "altitude": "4,000",
        "stdTempF": 45,
        "stdTempC": 7,
        "p55": {
          "mp": {
            "2100": 21.3,
            "2200": 20.6,
            "2300": 19.9,
            "2400": 19.4
          }
        },
        "p65": {
          "mp": {
            "2100": 23.8,
            "2200": 23.0,
            "2300": 22.2,
            "2400": 21.6
          }
        },
        "p75": {
          "mp": {
            "2200": 25.3,
            "2300": 24.3,
            "2400": 23.7
          }
        }
      },
      {
        "altitude": "5,000",
        "stdTempF": 41,
        "stdTempC": 5,
        "p55": {
          "mp": {
            "2100": 21.0,
            "2200": 20.4,
            "2300": 19.7,
            "2400": 19.2
          }
        },
        "p65": {
          "mp": {
            "2100": 23.5,
            "2200": 22.7,
            "2300": 21.9,
            "2400": 21.3
          }
        },
        "p75": {
          "mp": {
            "2300": 24.0,
            "2400": 23.4
          }
        }
      },
      {
        "altitude": "6,000",
        "stdTempF": 38,
        "stdTempC": 3,
        "p55": {
          "mp": {
            "2100": 20.8,
            "2200": 20.1,
            "2300": 19.4,
            "2400": 18.9
          }
        },
        "p65": {
          "mp": {
            "2100": 23.2,
            "2200": 22.4,
            "2300": 21.6,
            "2400": 21.1
          }
        },
        "p75": {
          "mp": {
            "2400": 23.1
          }
        }
      },
      {
        "altitude": "7,000",
        "stdTempF": 34,
        "stdTempC": 1,
        "p55": {
          "mp": {
            "2100": 20.5,
            "2200": 19.8,
            "2300": 19.1,
            "2400": 18.7
          }
        },
        "p65": {
          "mp": {
            "2200": 22.1,
            "2300": 21.3,
            "2400": 20.8
          }
        }
      },
      {
        "altitude": "8,000",
        "stdTempF": 31,
        "stdTempC": -1,
        "p55": {
          "mp": {
            "2100": 20.2,
            "2200": 19.5,
            "2300": 18.9,
            "2400": 18.4
          }
        },
        "p65": {
          "mp": {
            "2300": 21.8,
            "2400": 21.0
          }
        }
      },
      {
        "altitude": "9,000",
        "stdTempF": 27,
        "stdTempC": -3,
        "p55": {
          "mp": {
            "2100": 19.9,
            "2200": 19.2,
            "2300": 18.6,
            "2400": 18.2
          }
        },
        "p65": {
          "mp": {
            "2400": 20.7
          }
        }
      },
      {
        "altitude": "10,000",
        "stdTempF": 23,
        "stdTempC": -5,
        "p55": {
          "mp": {
            "2100": 19.7,
            "2200": 19.0,
            "2300": 18.3,
            "2400": 17.9
          }
        },
        "p65": {
          "mp": {
            "2400": 20.0
          }
        }
      },
      {
        "altitude": "11,000",
        "stdTempF": 19,
        "stdTempC": -7,
        "p55": {
          "mp": {
            "2100": 19.4,
            "2200": 18.7,
            "2300": 18.1,
            "2400": 17.7
          }
        }
      },
      {
        "altitude": "12,000",
        "stdTempF": 16,
        "stdTempC": -9,
        "p55": {
          "mp": {
            "2200": 18.4,
            "2300": 17.8,
            "2400": 17.4
          }
        }
      },
      {
        "altitude": "13,000",
        "stdTempF": 12,
        "stdTempC": -11,
        "p55": {
          "mp": {
            "2300": 17.5,
            "2400": 17.2
          }
        }
      },
      {
        "altitude": "14,000",
        "stdTempF": 9,
        "stdTempC": -13,
        "p55": {
          "mp": {
            "2400": 16.9
          }
        }
      },
      {
        "altitude": "15,000",
        "stdTempF": 5,
        "stdTempC": -15,
        "p55": {
          "mp": {}
        }
      }
    ]
  }
};
