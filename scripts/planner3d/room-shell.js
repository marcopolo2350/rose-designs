(function initPlanner3DRoomShell() {
  function createPlanShape(THREERef, polygon = []) {
    const shape = new THREERef.Shape();
    polygon.forEach((point, index) => {
      const x = Number(point?.x) || 0;
      const y = Number(point?.y) || 0;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return shape;
  }

  function polygonToVector3(THREERef, polygon = []) {
    return polygon.map((point) => {
      const x = Number(point?.x) || 0;
      const y = Number(point?.y) || 0;
      return new THREERef.Vector3(x, 0, -y);
    });
  }

  function roomBoundsBox(THREERef, polygon = []) {
    const points = polygonToVector3(THREERef, polygon);
    if (!points.length) return new THREERef.Box3();
    return new THREERef.Box3().setFromPoints(points);
  }

  function createPlanGeometry(THREERef, polygon, applyPlanarUVs) {
    const geometry = new THREERef.ShapeGeometry(createPlanShape(THREERef, polygon));
    return typeof applyPlanarUVs === "function" ? applyPlanarUVs(geometry, polygon) : geometry;
  }

  function configureTextureAnisotropy(texture, renderer, onError) {
    if (!texture) return texture;
    texture.needsUpdate = true;
    try {
      texture.anisotropy = Math.min(16, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
    } catch (error) {
      if (typeof onError === "function") onError(error);
    }
    return texture;
  }

  window.Planner3DRoomShell = Object.freeze({
    configureTextureAnisotropy,
    createPlanGeometry,
    createPlanShape,
    polygonToVector3,
    roomBoundsBox,
  });
})();
