(function initPlanner2DGeometry() {
  function polygonArea(polygon) {
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
    }
    return Math.abs(area / 2);
  }

  function distancePoint(a, b) {
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  }

  function closestPointOnSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    if (!len) return { x: a.x, y: a.y, t: 0, distance: distancePoint(point, a) };
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len));
    const x = a.x + dx * t;
    const y = a.y + dy * t;
    return { x, y, t, distance: Math.hypot(point.x - x, point.y - y) };
  }

  function lineIntersection(a1, a2, b1, b2) {
    const dax = a2.x - a1.x;
    const day = a2.y - a1.y;
    const dbx = b2.x - b1.x;
    const dby = b2.y - b1.y;
    const den = dax * dby - day * dbx;
    if (Math.abs(den) < 1e-6) return null;
    const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / den;
    const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: a1.x + t * dax, y: a1.y + t * day };
  }

  function pointInPolygon2D(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointInPolygonWorldXZ(x, z, polygon) {
    return pointInPolygon2D(x, -z, polygon);
  }

  window.Planner2DGeometry = Object.freeze({
    closestPointOnSegment,
    distancePoint,
    lineIntersection,
    pointInPolygon2D,
    pointInPolygonWorldXZ,
    polygonArea,
  });
})();
