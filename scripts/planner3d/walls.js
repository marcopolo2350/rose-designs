(function initPlanner3DWalls() {
  function colorClone(THREERef, color, fallback = 0xffffff) {
    if (color?.clone) return color.clone();
    return new THREERef.Color(color || fallback);
  }

  function createWallSegmentMesh(
    THREERef,
    { startPoint, angle, segmentStart, segmentEnd, bottomY, topY, material },
  ) {
    const width = segmentEnd - segmentStart;
    const height = topY - bottomY;
    if (width < 0.01 || height < 0.01) return null;

    const isGlass = material && material.transparent && (material.opacity || 1) < 0.9;
    const depth = isGlass ? 0.04 : 0.18;
    const mesh = new THREERef.Mesh(new THREERef.BoxGeometry(width, height, depth), material);
    mesh.castShadow = !isGlass;
    mesh.receiveShadow = !isGlass;

    const midpoint = (segmentStart + segmentEnd) / 2;
    mesh.position.set(
      startPoint.x + Math.cos(angle) * midpoint,
      (bottomY + topY) / 2,
      -(startPoint.y + Math.sin(angle) * midpoint),
    );
    mesh.rotation.y = -angle;

    if (!isGlass && material?.userData?.isWallSurface) {
      mesh.userData.roomWallSegment = true;
      mesh.userData.wallCenter2D = { x: mesh.position.x, y: -mesh.position.z };
      mesh.userData.roomId = material.userData.styleRoomId || "";
    }
    return mesh;
  }

  function nearestCutawayWalls(walls, cameraPos, limit = 3) {
    if (!cameraPos) return [];
    const cam2D = { x: cameraPos.x, y: -cameraPos.z };
    return walls
      .map((wall) => ({
        wall,
        distance: Math.hypot(
          (wall.userData?.wallCenter2D?.x || 0) - cam2D.x,
          (wall.userData?.wallCenter2D?.y || 0) - cam2D.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.min(limit, walls.length))
      .map((entry) => entry.wall);
  }

  function createDoorLeafGroup(
    THREERef,
    { startPoint, angle, openingStart, openingEnd, opening, trimColor },
  ) {
    const width = Math.max(0.55, openingEnd - openingStart);
    const doorWidth = Math.max(0.45, width - 0.12);
    const doorHeight = Math.max(2.1, (opening.height || 7) - 0.08);
    const hingeRight = opening.hinge === "right";
    const swingIn = opening.swing !== "out";
    const hingeOffset = hingeRight ? openingEnd - 0.04 : openingStart + 0.04;
    const pivot = new THREERef.Group();
    pivot.position.set(
      startPoint.x + Math.cos(angle) * hingeOffset,
      0.02,
      -(startPoint.y + Math.sin(angle) * hingeOffset),
    );
    pivot.rotation.y = -angle;
    pivot.rotation.y += (swingIn ? -1 : 1) * (hingeRight ? 1 : -1) * Math.PI * 0.5;

    const doorMat = new THREERef.MeshStandardMaterial({
      color: colorClone(THREERef, trimColor).offsetHSL(0.015, 0.08, -0.05),
      roughness: 0.54,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const insetMat = new THREERef.MeshStandardMaterial({
      color: colorClone(THREERef, trimColor).offsetHSL(0.01, 0.05, 0.08),
      roughness: 0.44,
      metalness: 0.03,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const handleMat = new THREERef.MeshStandardMaterial({
      color: 0x8b8479,
      roughness: 0.24,
      metalness: 0.72,
    });

    const leaf = new THREERef.Mesh(new THREERef.BoxGeometry(doorWidth, doorHeight, 0.08), doorMat);
    leaf.castShadow = true;
    leaf.position.set(
      hingeRight ? -doorWidth / 2 : doorWidth / 2,
      doorHeight / 2,
      hingeRight ? 0.03 : -0.03,
    );
    pivot.add(leaf);

    const inset = new THREERef.Mesh(
      new THREERef.BoxGeometry(
        Math.max(0.2, doorWidth - 0.34),
        Math.max(0.4, doorHeight - 0.7),
        0.02,
      ),
      insetMat,
    );
    inset.position.set(
      hingeRight ? -doorWidth / 2 : doorWidth / 2,
      doorHeight / 2,
      hingeRight ? -0.02 : 0.02,
    );
    pivot.add(inset);

    const handle = new THREERef.Mesh(new THREERef.BoxGeometry(0.05, 0.24, 0.03), handleMat);
    handle.position.set(
      hingeRight ? -(doorWidth - 0.16) : doorWidth - 0.16,
      doorHeight * 0.52,
      hingeRight ? -0.045 : 0.045,
    );
    pivot.add(handle);

    return { group: pivot, materials: [doorMat, insetMat] };
  }

  function createWindowAssembly(
    THREERef,
    { startPoint, angle, openingStart, openingEnd, opening, trimColor },
  ) {
    const width = Math.max(0.8, openingEnd - openingStart);
    const height = Math.max(1.6, opening.height || 4);
    const sill = opening.sillHeight || 3;
    const midpoint = (openingStart + openingEnd) / 2;
    const centerX = startPoint.x + Math.cos(angle) * midpoint;
    const centerZ = -(startPoint.y + Math.sin(angle) * midpoint);
    const frameMat = new THREERef.MeshStandardMaterial({
      color: colorClone(THREERef, trimColor).offsetHSL(0.01, 0.04, 0.03),
      roughness: 0.5,
      metalness: 0.03,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const sillMat = new THREERef.MeshStandardMaterial({
      color: colorClone(THREERef, trimColor).offsetHSL(0.02, 0.03, -0.02),
      roughness: 0.58,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const trimDepth = 0.06;
    const meshes = [
      new THREERef.Mesh(new THREERef.BoxGeometry(width + 0.04, 0.08, trimDepth), frameMat),
      new THREERef.Mesh(new THREERef.BoxGeometry(width + 0.04, 0.08, trimDepth), frameMat),
      new THREERef.Mesh(new THREERef.BoxGeometry(0.08, height, trimDepth), frameMat),
      new THREERef.Mesh(new THREERef.BoxGeometry(0.08, height, trimDepth), frameMat),
      new THREERef.Mesh(new THREERef.BoxGeometry(0.05, height - 0.18, trimDepth * 0.8), frameMat),
      new THREERef.Mesh(new THREERef.BoxGeometry(width - 0.14, 0.05, trimDepth * 0.8), frameMat),
      new THREERef.Mesh(new THREERef.BoxGeometry(width + 0.14, 0.06, 0.18), sillMat),
    ];

    meshes[0].position.set(centerX, sill + height - 0.04, centerZ);
    meshes[1].position.set(centerX, sill + 0.04, centerZ);
    meshes[2].position.set(
      startPoint.x + Math.cos(angle) * (openingStart + 0.04),
      sill + height / 2,
      -(startPoint.y + Math.sin(angle) * (openingStart + 0.04)),
    );
    meshes[3].position.set(
      startPoint.x + Math.cos(angle) * (openingEnd - 0.04),
      sill + height / 2,
      -(startPoint.y + Math.sin(angle) * (openingEnd - 0.04)),
    );
    meshes[4].position.set(centerX, sill + height / 2, centerZ);
    meshes[5].position.set(centerX, sill + height / 2, centerZ);
    meshes[6].position.set(centerX, sill - 0.07, centerZ + 0.02);
    meshes.forEach((mesh) => {
      mesh.rotation.y = -angle;
    });

    return { materials: [frameMat, sillMat], meshes };
  }

  window.Planner3DWalls = Object.freeze({
    createDoorLeafGroup,
    createWallSegmentMesh,
    createWindowAssembly,
    nearestCutawayWalls,
  });
})();
