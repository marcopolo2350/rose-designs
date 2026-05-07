(function initPlanner3DPlacement() {
  const SURFACE_HOST_KEYS = [
    "nightstand",
    "dresser",
    "desk",
    "tv_console",
    "table_coffee",
    "dining_table",
    "bookshelf",
    "cabinet",
    "shelving",
  ];

  function findNearestWallForPoint(point, room, helpers) {
    const walls = room?.walls || [];
    if (!walls.length) return null;
    let best = null;
    let bestDistance = Infinity;
    walls.forEach((wall) => {
      const start = helpers.wS(room, wall);
      const end = helpers.wE(room, wall);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const wallLength = helpers.wL(room, wall);
      const denominator = dx * dx + dy * dy;
      const t = denominator
        ? Math.max(
            0,
            Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / denominator),
          )
        : 0;
      const projected = { x: start.x + dx * t, y: start.y + dy * t };
      const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { wall, offset: t * wallLength, length: wallLength, point: projected };
      }
    });
    return best || { wall: walls[0], offset: 1, length: helpers.wL(room, walls[0]) };
  }

  function interiorWallNormal(room, wall, helpers) {
    const start = helpers.wS(room, wall);
    const end = helpers.wE(room, wall);
    const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const focus = helpers.getRoomFocus(room);
    const angle = helpers.wA(room, wall);
    const normalA = { x: Math.sin(angle), z: Math.cos(angle) };
    const normalB = { x: -normalA.x, z: -normalA.z };
    const probeA = { x: midpoint.x + normalA.x * 0.35, y: midpoint.y - normalA.z * 0.35 };
    const probeB = { x: midpoint.x + normalB.x * 0.35, y: midpoint.y - normalB.z * 0.35 };
    const distanceA = Math.hypot(probeA.x - focus.x, probeA.y - focus.y);
    const distanceB = Math.hypot(probeB.x - focus.x, probeB.y - focus.y);
    return distanceA < distanceB ? normalA : normalB;
  }

  function findNearestWindowOpening(point, room, helpers) {
    let best = null;
    let bestDistance = Infinity;
    (room?.openings || []).forEach((opening) => {
      if (opening.type !== "window") return;
      const wall = (room.walls || []).find((candidate) => candidate.id === opening.wallId);
      if (!wall) return;
      const start = helpers.wS(room, wall);
      const end = helpers.wE(room, wall);
      const wallLength = helpers.wL(room, wall);
      const t = wallLength ? opening.offset / wallLength : 0;
      const center = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
      const distance = Math.hypot(point.x - center.x, point.y - center.y);
      if (distance < bestDistance) {
        best = { opening, wall, center, length: opening.width };
        bestDistance = distance;
      }
    });
    return best;
  }

  function estimatedSurfaceHeight(furniture) {
    const map = {
      bookshelf: 2.9,
      cabinet: 2.6,
      desk: 2.45,
      dining_table: 2.45,
      dresser: 3.05,
      nightstand: 2.1,
      shelving: 3.4,
      table_coffee: 1.55,
      tv_console: 2.1,
    };
    return map[furniture.assetKey] || Math.max(1.8, furniture.d || 1.5);
  }

  function findNearestSurfaceFurniture(point, room) {
    let best = null;
    let bestDistance = Infinity;
    (room?.furniture || []).forEach((furniture) => {
      if (!SURFACE_HOST_KEYS.includes(furniture.assetKey)) return;
      const distance = Math.hypot(point.x - furniture.x, point.y - furniture.z);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = furniture;
      }
    });
    return best;
  }

  function effectiveWallFacingMode(furniture, registryEntry) {
    if (!(registryEntry?.mountType === "wall" || furniture?.mountType === "wall")) return "free";
    if (registryEntry?.wallFacingMode) return registryEntry.wallFacingMode;
    const key = String(furniture?.assetKey || "").toLowerCase();
    if (/lamp_wall/.test(key)) return "face_interior";
    if (/curtain|blind/.test(key)) return "follow_wall";
    return "follow_wall";
  }

  function wallMountedDepthOffset(furniture, registryEntry) {
    const wallHalf = 0.095;
    const key = String(furniture?.assetKey || "").toLowerCase();
    if (registryEntry?.snapToOpening) return wallHalf + 0.03;
    if (/wall_art|mirror|towel|panel|doorway|shelf|fireplace/.test(key)) return wallHalf + 0.045;
    if (/curtain|blind/.test(key)) return wallHalf + 0.025;
    return wallHalf + Math.min(0.16, Math.max(0.05, (furniture.d || 0.35) * 0.28));
  }

  function wallFacingAdjustment(registryEntry, placement, furniture) {
    const mode = effectiveWallFacingMode(furniture, registryEntry);
    if (mode === "free" || !placement?.wallNormal) return 0;
    const inwardYaw = Math.atan2(placement.wallNormal.x, placement.wallNormal.z);
    if (mode === "face_interior") return inwardYaw;
    if (mode === "face_exterior") return inwardYaw + Math.PI;
    if (mode === "follow_wall") return placement.wallAngleYaw || 0;
    return inwardYaw;
  }

  function computeFurnitureYaw(furniture, registryEntry, placement, helpers) {
    const appRotation =
      (-(Number.isFinite(furniture.rotation) ? furniture.rotation : 0) * Math.PI) / 180;
    const yawOffset =
      (registryEntry?.yawOffset || 0) + helpers.axisYawOffset(registryEntry?.forwardAxis);
    return appRotation + yawOffset + wallFacingAdjustment(registryEntry, placement, furniture);
  }

  function createFurniturePlacement(THREERef, furniture, room, modelRegistry, helpers) {
    const registryEntry = modelRegistry[furniture.assetKey];
    if (furniture.mountType === "ceiling" || registryEntry?.mountType === "ceiling") {
      const focus = helpers.getRoomFocus(room);
      const ceilingDefault = Math.max(7.2, room.height - 0.55);
      const authored = Number.isFinite(furniture.elevation) ? furniture.elevation : null;
      // Respect explicit elevation when the layout authored it (e.g. a 6.6 ft hood
      // hanging over a cooktop) instead of forcing every ceiling mount up to the slab.
      const elevation = authored != null && authored > 0 ? authored : ceilingDefault;
      const placement = {
        position: new THREERef.Vector3(
          furniture.x || focus.x,
          elevation,
          -(furniture.z || focus.y),
        ),
        wallNormal: null,
      };
      placement.rotationY = computeFurnitureYaw(furniture, registryEntry, placement, helpers);
      return placement;
    }

    if (furniture.mountType === "surface" || registryEntry?.mountType === "surface") {
      const host = findNearestSurfaceFurniture({ x: furniture.x, y: furniture.z }, room);
      const baseX = host ? host.x : furniture.x;
      const baseZ = host ? host.z : furniture.z;
      const baseY = host
        ? estimatedSurfaceHeight(host)
        : helpers.defaultElevation(
            "surface",
            furniture.assetKey,
            helpers.resolveLabel(furniture.label),
          );
      const placement = {
        position: new THREERef.Vector3(baseX, baseY, -baseZ),
        host,
        wallNormal: null,
      };
      placement.rotationY = computeFurnitureYaw(furniture, registryEntry, placement, helpers);
      return placement;
    }

    if (furniture.mountType === "wall" || registryEntry?.mountType === "wall") {
      const windowTarget = registryEntry?.snapToOpening
        ? findNearestWindowOpening({ x: furniture.x, y: furniture.z }, room, helpers)
        : null;
      if (registryEntry?.snapToOpening && !windowTarget) return null;
      const nearest = windowTarget
        ? {
            wall: windowTarget.wall,
            offset: windowTarget.opening.offset,
            length: helpers.wL(room, windowTarget.wall),
          }
        : findNearestWallForPoint({ x: furniture.x, y: furniture.z }, room, helpers);
      if (!nearest?.wall) return null;
      const wall = nearest.wall;
      const start = helpers.wS(room, wall);
      const angle = helpers.wA(room, wall);
      const normal = interiorWallNormal(room, wall, helpers);
      const along = Math.max(
        0.4,
        Math.min(nearest.length - 0.4, nearest.offset || nearest.length / 2),
      );
      let mountY =
        furniture.elevation ||
        helpers.defaultElevation("wall", furniture.assetKey, helpers.resolveLabel(furniture.label));
      if (windowTarget && furniture.assetKey === "curtains") {
        mountY = (windowTarget.opening.sillHeight || 3) + (windowTarget.opening.height || 4) + 0.35;
      }
      if (windowTarget && furniture.assetKey === "blinds") {
        mountY = (windowTarget.opening.sillHeight || 3) + (windowTarget.opening.height || 4) - 0.06;
      }
      const base = new THREERef.Vector3(
        start.x + Math.cos(angle) * along,
        mountY,
        -(start.y + Math.sin(angle) * along),
      );
      const depth = wallMountedDepthOffset(furniture, registryEntry);
      base.x += normal.x * depth;
      base.z += normal.z * depth;
      const placement = { position: base, windowTarget, wallNormal: normal, wallAngleYaw: -angle };
      placement.rotationY = computeFurnitureYaw(furniture, registryEntry, placement, helpers);
      return placement;
    }

    const placement = {
      position: new THREERef.Vector3(
        furniture.x,
        Number.isFinite(furniture.elevation)
          ? furniture.elevation
          : registryEntry?.yOffset || furniture.yOffset || 0,
        -furniture.z,
      ),
      wallNormal: null,
    };
    placement.rotationY = computeFurnitureYaw(furniture, registryEntry, placement, helpers);
    return placement;
  }

  window.Planner3DPlacement = Object.freeze({
    createFurniturePlacement,
    effectiveWallFacingMode,
    estimatedSurfaceHeight,
    findNearestSurfaceFurniture,
    findNearestWallForPoint,
    findNearestWindowOpening,
    interiorWallNormal,
    wallMountedDepthOffset,
  });
})();
