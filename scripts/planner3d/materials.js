/* global THREE, getFurnitureVariant, safeThreeColor */
function furnitureMaterialProfile(f) {
  const variant = typeof getFurnitureVariant === "function" ? getFurnitureVariant(f) : null;
  const tintColor = variant?.previewColor || f?.finishColor || "";
  if (!tintColor) return null;
  return {
    tint: safeThreeColor(tintColor, "#D7C4B2"),
    accent: safeThreeColor(variant?.accentColor || tintColor, "#E8DCCF"),
    family: variant?.family || "finish",
    roughness: Number.isFinite(variant?.roughness) ? variant.roughness : 0.74,
    metalness: Number.isFinite(variant?.metalness) ? variant.metalness : 0.05,
    tintStrength: Number.isFinite(variant?.tintStrength) ? variant.tintStrength : 0.48,
  };
}
function furnitureBaseTint(f, fallback = "#D7C4B2") {
  return furnitureMaterialProfile(f)?.tint || safeThreeColor(f?.finishColor || fallback, fallback);
}
function premiumVariantMat(f, colorOverride, roughOverride = null, metalOverride = null) {
  const profile = furnitureMaterialProfile(f);
  const color = colorOverride || profile?.tint || safeThreeColor("#D7C4B2", "#D7C4B2");
  const family = profile?.family || "finish";
  const defaults = {
    fabric: { rough: 0.88, metal: 0.02 },
    boucle: { rough: 0.96, metal: 0.01 },
    linen: { rough: 0.9, metal: 0.01 },
    velvet: { rough: 0.58, metal: 0.02 },
    leather: { rough: 0.48, metal: 0.03 },
    wood: { rough: 0.58, metal: 0.06 },
    metal: { rough: 0.24, metal: 0.84 },
    rug: { rough: 0.97, metal: 0 },
  }[family] || { rough: 0.72, metal: 0.04 };
  return new THREE.MeshStandardMaterial({
    color,
    roughness: roughOverride ?? profile?.roughness ?? defaults.rough,
    metalness: metalOverride ?? profile?.metalness ?? defaults.metal,
  });
}
function applyFurnitureFinishToModel(obj, f) {
  const profile = furnitureMaterialProfile(f);
  if (!obj || !f || !profile) return;
  const tint = profile.tint;
  const family = profile.family || "finish";
  const familyTintStrength =
    {
      fabric: 0.46,
      boucle: 0.42,
      linen: 0.44,
      velvet: 0.58,
      leather: 0.52,
      wood: 0.34,
      metal: 0.24,
      rug: 0.62,
      finish: profile.tintStrength,
    }[family] ?? profile.tintStrength;
  const familyRoughness =
    {
      fabric: 0.9,
      boucle: 0.97,
      linen: 0.92,
      velvet: 0.56,
      leather: 0.46,
      wood: 0.58,
      metal: 0.22,
      rug: 0.98,
      finish: profile.roughness,
    }[family] ?? profile.roughness;
  const familyMetalness =
    {
      fabric: 0.02,
      boucle: 0.01,
      linen: 0.01,
      velvet: 0.02,
      leather: 0.03,
      wood: 0.05,
      metal: 0.88,
      rug: 0,
      finish: profile.metalness,
    }[family] ?? profile.metalness;
  obj.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((mat) => {
        const next = mat.clone();
        if (next.color) next.color.lerp(tint, familyTintStrength);
        if (typeof next.roughness === "number")
          next.roughness = (next.roughness + familyRoughness * 2) / 3;
        if (typeof next.metalness === "number")
          next.metalness = (next.metalness + familyMetalness * 2) / 3;
        if (typeof next.envMapIntensity === "number") {
          if (family === "metal") next.envMapIntensity = Math.max(next.envMapIntensity || 1, 1.45);
          else if (["leather", "wood"].includes(family))
            next.envMapIntensity = Math.max(next.envMapIntensity || 0.6, 0.9);
        }
        if (next.emissive && family === "velvet") next.emissive.copy(tint).multiplyScalar(0.03);
        if (typeof next.needsUpdate !== "undefined") next.needsUpdate = true;
        return next;
      });
    } else {
      const next = child.material.clone();
      if (next.color) next.color.lerp(tint, familyTintStrength);
      if (typeof next.roughness === "number")
        next.roughness = (next.roughness + familyRoughness * 2) / 3;
      if (typeof next.metalness === "number")
        next.metalness = (next.metalness + familyMetalness * 2) / 3;
      if (typeof next.envMapIntensity === "number") {
        if (family === "metal") next.envMapIntensity = Math.max(next.envMapIntensity || 1, 1.45);
        else if (["leather", "wood"].includes(family))
          next.envMapIntensity = Math.max(next.envMapIntensity || 0.6, 0.9);
      }
      if (next.emissive && family === "velvet") next.emissive.copy(tint).multiplyScalar(0.03);
      if (typeof next.needsUpdate !== "undefined") next.needsUpdate = true;
      child.material = next;
    }
  });
}
function premiumMat(color, rough = 0.72, metal = 0.04) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
window.Planner3DMaterials = Object.freeze({
  applyFurnitureFinishToModel,
  furnitureBaseTint,
  furnitureMaterialProfile,
  premiumMat,
  premiumVariantMat,
});
