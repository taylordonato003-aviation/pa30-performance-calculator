/*
 * PA-30 Performance Calculator — embedded dataset.
 *
 * This file mirrors the JSON files in data/ exactly. It exists so the app
 * works when index.html is opened directly as a file:// URL (browsers block
 * fetch() of local JSON files from file:// pages). The data/*.json files are
 * the human-readable/editable source of truth — if you hand-correct a value
 * there, copy the same correction into the matching object below.
 */
window.PA30_DATA = {
  "fig5-06": {
    "figure": "5-06",
    "title": "Takeoff Ground Run Distance",
    "units": "feet",
    "conditions": "Wing flaps 15°, paved/level/dry runway, full throttle and max RPM, takeoff speed = 80 MPH IAS",
    "source": "reference/fig5-06-takeoff-ground-run.png",
    "model": "ladder",
    "altitudeCurves": {
      "0":    { "t0": 650,  "t120": 1250 },
      "2000": { "t0": 750,  "t120": 1500 },
      "4000": { "t0": 870,  "t120": 1800 },
      "6000": { "t0": 1065, "t120": 1755 },
      "8000": { "t0": 1250, "t120": 2550 }
    },
    "weightExponent": 1.898,
    "windKPerMph": 0.0055,
    "tailwindMultiplier": 2.0,
    "exampleCheck": { "pa": 6000, "oatF": 65, "weightLb": 3000, "windMph": 30, "chartReading": 850 },
    "unverifiedAltitudes": ["0", "2000", "4000", "8000"]
  },
  "fig5-07": {
    "figure": "5-07",
    "title": "Takeoff Distance Over a 50 Ft Obstacle",
    "units": "feet",
    "conditions": "Wing flaps 15°, paved/level/dry runway, full throttle and max RPM, attain 91 MPH at 50 ft AGL",
    "source": "reference/fig5-07-takeoff-distance-50ft.png",
    "model": "ladder",
    "altitudeCurves": {
      "0":    { "t0": 950,  "t120": 1835 },
      "2000": { "t0": 1150, "t120": 2238 },
      "4000": { "t0": 1500, "t120": 2864 },
      "6000": { "t0": 2650, "t120": 3240 },
      "8000": { "t0": 2900, "t120": 5370 }
    },
    "weightExponent": 0.642,
    "windKPerMph": 0.0055,
    "tailwindMultiplier": 2.0,
    "exampleCheck": { "pa": 6000, "oatF": 70, "weightLb": 3200, "windMph": 30, "chartReading": 2318 },
    "unverifiedAltitudes": ["0", "2000", "4000", "8000"]
  },
  "fig5-08": {
    "figure": "5-08",
    "title": "Accelerate-Stop Distance",
    "units": "feet",
    "conditions": "Wing flaps retracted, full throttle and max RPM, both throttles closed at decision speed, accelerate to 90 MPH IAS, maximum braking effort, paved/level/dry runway",
    "source": "reference/fig5-08-accelerate-stop.png",
    "model": "ladder",
    "altitudeCurves": {
      "0":    { "t0": 850,  "t120": 2595 },
      "2000": { "t0": 1000, "t120": 3142 },
      "4000": { "t0": 1250, "t120": 3893 },
      "6000": { "t0": 2600, "t120": 2943 },
      "8000": { "t0": 2200, "t120": 5830 }
    },
    "weightExponent": 1.134,
    "windKPerMph": 0.00544,
    "tailwindMultiplier": 2.0,
    "exampleCheck": { "pa": 6000, "oatF": 70, "weightLb": 3200, "windMph": 30, "chartReading": 2050 },
    "unverifiedAltitudes": ["0", "2000", "4000", "8000"]
  },
  "fig5-15": {
    "figure": "5-15",
    "title": "Landing Ground Roll Distance",
    "units": "feet",
    "conditions": "Wing flaps 27°, paved/level/dry runway, throttles closed, maximum braking effort, approach speed = 90 MPH IAS, touchdown speed = 70 MPH IAS",
    "source": "reference/fig5-15-landing-ground-roll.png",
    "model": "ladder",
    "altitudeCurves": {
      "0":    { "t0": 621, "t120": 784 },
      "2000": { "t0": 679, "t120": 842 },
      "4000": { "t0": 722, "t120": 865 },
      "6000": { "t0": 780, "t120": 969 },
      "8000": { "t0": 837, "t120": 1052 }
    },
    "weightExponent": 0.935,
    "windKPerMph": 0.00833,
    "tailwindMultiplier": 2.0,
    "exampleCheck": { "pa": 4000, "oatF": 70, "weightLb": 3100, "windMph": 30, "chartReading": 525 },
    "unverifiedAltitudes": ["0", "2000", "6000", "8000"]
  },
  "fig5-16": {
    "figure": "5-16",
    "title": "Landing Distance Over a 50 Ft Obstacle",
    "units": "feet",
    "conditions": "Wing flaps 27°, paved/level/dry runway, maximum braking effort, approach speed = 90 MPH IAS",
    "source": "reference/fig5-16-landing-distance-50ft.png",
    "model": "ladder",
    "altitudeCurves": {
      "0":    { "t0": 1945, "t120": 2260 },
      "2000": { "t0": 2037, "t120": 2393 },
      "4000": { "t0": 2156, "t120": 2475 },
      "6000": { "t0": 2269, "t120": 2670 },
      "8000": { "t0": 2391, "t120": 2834 }
    },
    "weightExponent": 0.666,
    "windKPerMph": 0.00583,
    "tailwindMultiplier": 2.0,
    "exampleCheck": { "pa": 2000, "oatF": 65, "weightLb": 3200, "windMph": 30, "chartReading": 1700 },
    "unverifiedAltitudes": ["0", "4000", "6000", "8000"]
  },
  "fig5-09": {
    "figure": "5-09",
    "title": "Multi-Engine Rate of Climb vs Density Altitude and Weight",
    "units": "ft/min",
    "conditions": "Cowl flaps open, full throttle and max RPM, landing gear retracted, mixture adjusted for smooth operation, optimum airspeed, wing flaps retracted",
    "source": "reference/fig5-09-multi-engine-roc.png",
    "model": "linear-by-weight",
    "weightCurves": {
      "2800": { "seaLevel": 1895, "daAtZero": 22025 },
      "3200": { "seaLevel": 1566, "daAtZero": 21080 },
      "3600": { "seaLevel": 1337, "daAtZero": 20060 }
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
      "2800": { "seaLevel": 520, "daAtZero": 11400 },
      "3200": { "seaLevel": 373, "daAtZero": 9100 },
      "3600": { "seaLevel": 260, "daAtZero": 6925 }
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
      "vx": { "seaLevel": 90, "at15000": 94 },
      "vy": { "seaLevel": 112, "at15000": 99 }
    },
    "singleEngine": {
      "ceilingDa": 7189,
      "vx": { "seaLevel": 94, "atCeiling": 98 },
      "vy": { "seaLevel": 105, "atCeiling": 98 }
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
      "45": { "seaLevel": 143.6, "at16000": 152.5 },
      "55": { "seaLevel": 156.6, "at16000": 159.3 },
      "65": { "seaLevel": 167.9, "at16000": 169.0 },
      "75": { "seaLevel": 176.7, "at16000": 192.5 }
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
      "45": { "seaLevel": 997, "at16000": 1045 },
      "55": { "seaLevel": 961, "at16000": 1011 },
      "65": { "seaLevel": 928, "at16000": 956 },
      "75": { "seaLevel": 868, "at16000": 880 }
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
      "45": { "seaLevel": 5.85, "at16000": 6.3 },
      "55": { "seaLevel": 5.14, "at16000": 5.5 },
      "65": { "seaLevel": 4.56, "at16000": 4.7 },
      "75": { "seaLevel": 4.0, "at16000": 4.5 }
    }
  },
  "fig6-01": {
    "figure": "6-01",
    "title": "Approved C.G. Range and Weight",
    "units": "inches aft of datum / lb",
    "conditions": "Standard (non tip-tank) configuration, max gross weight 3600 lb",
    "source": "reference/fig6-01-cg-envelope.png",
    "model": "polygon",
    "forwardLimitLabel": "7.0% MAC",
    "aftLimitLabel": "26.3% MAC",
    "polygon": [[81.0, 2300], [81.0, 2500], [81.2, 2730], [81.6, 3010], [82.0, 3150], [82.4, 3230], [83.2, 3310], [84.2, 3415], [85.0, 3500], [85.9, 3600], [92.0, 3600], [92.0, 2300]]
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
      { "altitude": "Sea Level", "stdTempF": 59, "stdTempC": 15, "p55": { "gph": "13.4 / 16.0", "mp": { "2100": 22.4, "2200": 21.7, "2300": 21.0, "2400": 20.4 } }, "p65": { "gph": "15.2 / 17.7", "mp": { "2100": 25.0, "2200": 24.2, "2300": 23.3, "2400": 22.7 } }, "p75": { "gph": "17.2 / 20.0", "mp": { "2200": 26.5, "2300": 25.6, "2400": 24.9 } } },
      { "altitude": "1,000", "stdTempF": 55, "stdTempC": 13, "p55": { "mp": { "2100": 22.1, "2200": 21.5, "2300": 20.7, "2400": 20.2 } }, "p65": { "mp": { "2100": 24.7, "2200": 23.9, "2300": 23.0, "2400": 22.4 } }, "p75": { "mp": { "2200": 26.2, "2300": 25.3, "2400": 24.6 } } },
      { "altitude": "2,000", "stdTempF": 52, "stdTempC": 11, "p55": { "mp": { "2100": 21.8, "2200": 21.2, "2300": 20.5, "2400": 19.9 } }, "p65": { "mp": { "2100": 24.4, "2200": 23.6, "2300": 22.8, "2400": 22.2 } }, "p75": { "mp": { "2200": 25.9, "2300": 25.0, "2400": 24.3 } } },
      { "altitude": "3,000", "stdTempF": 48, "stdTempC": 9, "p55": { "mp": { "2100": 21.6, "2200": 20.9, "2300": 20.2, "2400": 19.7 } }, "p65": { "mp": { "2100": 24.1, "2200": 23.3, "2300": 22.5, "2400": 21.9 } }, "p75": { "mp": { "2200": 25.6, "2300": 24.7, "2400": 24.0 } } },
      { "altitude": "4,000", "stdTempF": 45, "stdTempC": 7, "p55": { "mp": { "2100": 21.3, "2200": 20.6, "2300": 19.9, "2400": 19.4 } }, "p65": { "mp": { "2100": 23.8, "2200": 23.0, "2300": 22.2, "2400": 21.6 } }, "p75": { "mp": { "2200": 25.3, "2300": 24.3, "2400": 23.7 } } },
      { "altitude": "5,000", "stdTempF": 41, "stdTempC": 5, "p55": { "mp": { "2100": 21.0, "2200": 20.4, "2300": 19.7, "2400": 19.2 } }, "p65": { "mp": { "2100": 23.5, "2200": 22.7, "2300": 21.9, "2400": 21.3 } }, "p75": { "mp": { "2300": 24.0, "2400": 23.4 } } },
      { "altitude": "6,000", "stdTempF": 38, "stdTempC": 3, "p55": { "mp": { "2100": 20.8, "2200": 20.1, "2300": 19.4, "2400": 18.9 } }, "p65": { "mp": { "2100": 23.2, "2200": 22.4, "2300": 21.6, "2400": 21.1 } }, "p75": { "mp": { "2400": 23.1 } } },
      { "altitude": "7,000", "stdTempF": 34, "stdTempC": 1, "p55": { "mp": { "2100": 20.5, "2200": 19.8, "2300": 19.1, "2400": 18.7 } }, "p65": { "mp": { "2200": 22.1, "2300": 21.3, "2400": 20.8 } } },
      { "altitude": "8,000", "stdTempF": 31, "stdTempC": -1, "p55": { "mp": { "2100": 20.2, "2200": 19.5, "2300": 18.9, "2400": 18.4 } }, "p65": { "mp": { "2200": 21.8, "2300": 21.0 } } },
      { "altitude": "9,000", "stdTempF": 27, "stdTempC": -3, "p55": { "mp": { "2100": 19.9, "2200": 19.2, "2300": 18.6, "2400": 18.2 } }, "p65": { "mp": { "2400": 20.7 } } },
      { "altitude": "10,000", "stdTempF": 23, "stdTempC": -5, "p55": { "mp": { "2100": 19.7, "2200": 19.0, "2300": 18.3, "2400": 17.9 } }, "p65": { "mp": { "2400": 20.0 } } },
      { "altitude": "11,000", "stdTempF": 19, "stdTempC": -7, "p55": { "mp": { "2100": 19.4, "2200": 18.7, "2300": 18.1, "2400": 17.7 } } },
      { "altitude": "12,000", "stdTempF": 16, "stdTempC": -9, "p55": { "mp": { "2200": 18.4, "2300": 17.8, "2400": 17.4 } } },
      { "altitude": "13,000", "stdTempF": 12, "stdTempC": -11, "p55": { "mp": { "2300": 17.5, "2400": 17.2 } } },
      { "altitude": "14,000", "stdTempF": 9, "stdTempC": -13, "p55": { "mp": { "2400": 16.9 } } },
      { "altitude": "15,000", "stdTempF": 5, "stdTempC": -15, "p55": { "mp": {} } }
    ]
  }
};
