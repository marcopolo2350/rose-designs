globalThis.window = globalThis;

await import("../planner2d/geometry.js");

const geometry = window.Planner2DGeometry;
const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

if (geometry.polygonArea(square) !== 100) {
  throw new Error("polygonArea failed for a square");
}

if (!geometry.pointInPolygon2D(5, 5, square) || geometry.pointInPolygon2D(15, 5, square)) {
  throw new Error("pointInPolygon2D failed");
}

if (
  !geometry.pointInPolygonWorldXZ(5, -5, square) ||
  geometry.pointInPolygonWorldXZ(15, -5, square)
) {
  throw new Error("pointInPolygonWorldXZ failed");
}

const closest = geometry.closestPointOnSegment({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 });
if (closest.x !== 5 || closest.y !== 0 || Math.round(closest.distance) !== 5) {
  throw new Error("closestPointOnSegment failed");
}

const intersection = geometry.lineIntersection(
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
  { x: 10, y: 0 },
);
if (!intersection || Math.round(intersection.x) !== 5 || Math.round(intersection.y) !== 5) {
  throw new Error("lineIntersection failed");
}

console.log("Planner geometry validation passed.");
