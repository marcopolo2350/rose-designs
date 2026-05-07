/* global MODEL_REGISTRY, closestPointOnSegment, findNearestWindowOpening, getRoomFocus, snapFurniturePoint, wA, wE, wL, wS */
const BACK_TO_WALL_CATEGORIES = new Set([
  "sofa",
  "bed",
  "dresser",
  "desk",
  "bookshelf",
  "tv_console",
  "storage",
]);
function isWallMountedFurnitureItem(
  item,
  reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null,
) {
  return item?.mountType === "wall" || reg?.mountType === "wall";
}
function shouldOrientBackToWall(item, reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null) {
  if (isWallMountedFurnitureItem(item, reg)) return false;
  const cat = String(reg?.category || item?.category || "").toLowerCase();
  return BACK_TO_WALL_CATEGORIES.has(cat);
}
function backToWallRotationDegrees(item, point, room = curRoom) {
  if (!room?.walls?.length || typeof wA !== "function") return null;
  const halfDepth = Math.max(0.5, (item?.d || 1.5) * 0.5);
  const threshold = halfDepth + 2.0;
  const source = { x: point?.x || 0, y: Number.isFinite(point?.z) ? point.z : point?.y || 0 };
  let best = null;
  (room.walls || []).forEach((wall) => {
    const a = wS(room, wall);
    const b = wE(room, wall);
    const proj = closestPointOnSegment(source, a, b);
    if (!best || proj.distance < best.distance) best = { wall, distance: proj.distance };
  });
  if (!best || best.distance > threshold) return null;
  const wall = best.wall;
  const angle = wA(room, wall);
  const a = wS(room, wall);
  const b = wE(room, wall);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const focus = typeof getRoomFocus === "function" ? getRoomFocus(room) : { x: mid.x, y: mid.y };
  const normalA = { x: Math.sin(angle), z: Math.cos(angle) };
  const normalB = { x: -normalA.x, z: -normalA.z };
  const probeA = { x: mid.x + normalA.x * 0.4, y: mid.y - normalA.z * 0.4 };
  const probeB = { x: mid.x + normalB.x * 0.4, y: mid.y - normalB.z * 0.4 };
  const distA = Math.hypot(probeA.x - focus.x, probeA.y - focus.y);
  const distB = Math.hypot(probeB.x - focus.x, probeB.y - focus.y);
  const interior = distA < distB ? normalA : normalB;
  const yawDesired = Math.atan2(interior.x, interior.z);
  let rotationDeg = (-yawDesired * 180) / Math.PI;
  if (rotationDeg < 0) rotationDeg += 360;
  return Math.round(rotationDeg * 10) / 10;
}
function wallSnapForFurniture(
  item,
  point,
  room = curRoom,
  reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null,
) {
  if (!room || !item || !isWallMountedFurnitureItem(item, reg)) return null;
  const source = { x: point?.x || 0, y: Number.isFinite(point?.z) ? point.z : point?.y || 0 };
  const openingTarget =
    reg?.snapToOpening && typeof findNearestWindowOpening === "function"
      ? findNearestWindowOpening(source, room)
      : null;
  if (reg?.snapToOpening && !openingTarget) return { valid: false, windowTarget: null };
  let best = null;
  if (openingTarget) {
    const wall = openingTarget.wall;
    const idx = (room.walls || []).findIndex((candidate) => candidate?.id === wall?.id);
    if (!wall || idx < 0) return { valid: false, windowTarget: null };
    best = {
      wall,
      idx,
      length: wL(room, wall),
      offset: openingTarget.opening?.offset || 0,
      distance: 0,
      point: closestPointOnSegment(source, wS(room, wall), wE(room, wall)),
    };
  } else {
    (room.walls || []).forEach((wall, idx) => {
      const a = wS(room, wall);
      const b = wE(room, wall);
      const projection = closestPointOnSegment(source, a, b);
      if (!best || projection.distance < best.distance) {
        best = {
          wall,
          idx,
          length: wL(room, wall),
          offset: (projection.t || 0) * wL(room, wall),
          distance: projection.distance,
          point: projection,
        };
      }
    });
  }
  if (!best) return null;
  const padding = Math.max(0.32, Math.min((item.w || 2) * 0.5 + 0.08, (best.length || 0) * 0.45));
  const along = Math.max(
    padding,
    Math.min(
      (best.length || 0) - padding,
      Number.isFinite(best.offset) ? best.offset : (best.length || 0) / 2,
    ),
  );
  const angle = wA(room, best.wall);
  const a = wS(room, best.wall);
  const snapped = {
    x: Math.round((a.x + Math.cos(angle) * along) * 2) / 2,
    z: Math.round((a.y + Math.sin(angle) * along) * 2) / 2,
  };
  return {
    valid: true,
    wall: best.wall,
    idx: best.idx,
    length: best.length,
    offset: along,
    distance: best.distance || 0,
    snapped,
    angle,
    windowTarget: openingTarget || null,
  };
}
function snapFurnitureForItem(item, x, z, room = curRoom) {
  const reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null;
  const base = snapFurniturePoint(x, z);
  const wallSnap = wallSnapForFurniture(item, { x: base.x, z: base.z }, room, reg);
  if (wallSnap?.valid) return { ...wallSnap.snapped, wallSnap };
  return base;
}
window.Planner2DSnapping = Object.freeze({
  backToWallRotationDegrees,
  isWallMountedFurnitureItem,
  shouldOrientBackToWall,
  snapFurnitureForItem,
  wallSnapForFurniture,
});
