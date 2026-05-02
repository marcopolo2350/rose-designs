(function initPlanner3DLighting() {
  const SKY_STOPS = Object.freeze([
    { t: 0.0, c: "#0a0f1e" },
    { t: 0.14, c: "#c8b8b0" },
    { t: 0.3, c: "#d6e1eb" },
    { t: 0.5, c: "#dfe8ee" },
    { t: 0.72, c: "#e2c297" },
    { t: 0.86, c: "#d4b9a7" },
    { t: 1.0, c: "#0a0f1e" },
  ]);

  const DIRECTIONAL_STOPS = Object.freeze([
    { t: 0.0, c: "#7f91b8" },
    { t: 0.18, c: "#f1c7a4" },
    { t: 0.5, c: "#fff1d2" },
    { t: 0.72, c: "#f2b16f" },
    { t: 0.92, c: "#9ba9d0" },
    { t: 1.0, c: "#7f91b8" },
  ]);

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function lerpHex(a, b, t) {
    const ah = parseInt(a.replace("#", ""), 16);
    const bh = parseInt(b.replace("#", ""), 16);
    const ar = (ah >> 16) & 255;
    const ag = (ah >> 8) & 255;
    const ab = ah & 255;
    const br = (bh >> 16) & 255;
    const bg = (bh >> 8) & 255;
    const bb = bh & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const blue = Math.round(ab + (bb - ab) * t);
    return `#${((1 << 24) | (r << 16) | (g << 8) | blue).toString(16).slice(1)}`;
  }

  function colorAt(stops, value) {
    const t = clamp01(value);
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let index = 0; index < stops.length - 1; index += 1) {
      if (t >= stops[index].t && t <= stops[index + 1].t) {
        a = stops[index];
        b = stops[index + 1];
        break;
      }
    }
    const localT = (t - a.t) / Math.max(0.0001, b.t - a.t);
    return lerpHex(a.c, b.c, localT);
  }

  function hdriForTimeOfDay(value) {
    const t = clamp01(value);
    if (t < 0.18 || t > 0.9) return "evening";
    if (t > 0.62) return "warm";
    return "daylight";
  }

  function exposureForTimeOfDay(value, photoMode = false) {
    const t = clamp01(value);
    const base = 0.68 + Math.sin(t * Math.PI) * 0.42;
    return base * (photoMode ? 1.08 : 1);
  }

  function directionalIntensityForTimeOfDay(value) {
    const t = clamp01(value);
    return 1.2 + Math.sin(t * Math.PI) * 1.9;
  }

  function hemisphereIntensityForTimeOfDay(value) {
    const t = clamp01(value);
    return 0.34 + Math.sin(t * Math.PI) * 0.62;
  }

  window.Planner3DLighting = Object.freeze({
    skyColor: (value) => colorAt(SKY_STOPS, value),
    directionalColor: (value) => colorAt(DIRECTIONAL_STOPS, value),
    directionalIntensityForTimeOfDay,
    exposureForTimeOfDay,
    hdriForTimeOfDay,
    hemisphereIntensityForTimeOfDay,
  });
})();
