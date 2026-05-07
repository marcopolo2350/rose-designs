// Runtime material audit. Walks every mesh in a loaded GLB and upgrades
// PBR properties in place so the whole catalog reads as "considered" instead of
// "flat GLB default". Called automatically in placeFurnitureInScene → patchGLBMaterials(root).
//
//   - Adds roughness *variance* where roughness is suspiciously uniform (Blender default 0.5)
//   - Bumps metalness on small metal props (hardware, handles, brass)
//   - Adds subtle clearcoat on painted surfaces (keyword: white/beige/paint)
//   - Clamps emissive intensity so stray GLBs don't blow out bloom
//   - Enables anisotropic filtering on maps for sharp textures at grazing angles
//
// Exposes:  window.patchGLBMaterials(root, renderer?)  — idempotent per-material (dataKey marker)

(function () {
  if (typeof window === "undefined") return;
  const DATA_KEY = "_roseMaterialAudited";
  function classify(name) {
    const n = String(name || "").toLowerCase();
    if (/brass|gold|copper|chrome|steel|metal|handle|knob|hinge|nail|screw|rod|bar/.test(n))
      return "metal";
    if (/fabric|cloth|linen|cotton|wool|pillow|cushion|throw|curtain|drape|rug|carpet/.test(n))
      return "fabric";
    if (/wood|oak|walnut|pine|maple|grain/.test(n)) return "wood";
    if (/paint|white|beige|cream|lacquer|gloss/.test(n)) return "paint";
    if (/glass|window|mirror|transparent/.test(n)) return "glass";
    if (/leather/.test(n)) return "leather";
    if (/plant|leaf|foliage/.test(n)) return "foliage";
    if (/tile|ceramic|porcelain/.test(n)) return "ceramic";
    return "default";
  }
  function patchMaterial(mat, meshName, renderer) {
    if (!mat || mat[DATA_KEY]) return;
    mat[DATA_KEY] = true;
    if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) return;
    const cls = classify(mat.name || meshName);
    switch (cls) {
      case "metal":
        mat.metalness = Math.max(mat.metalness || 0, 0.82);
        mat.roughness = Math.min(Math.max(mat.roughness || 0.5, 0.18), 0.38);
        break;
      case "fabric":
        mat.metalness = 0;
        mat.roughness = Math.max(mat.roughness || 0.5, 0.86);
        break;
      case "wood":
        mat.metalness = Math.min(mat.metalness || 0.05, 0.08);
        mat.roughness = Math.max(Math.min(mat.roughness || 0.5, 0.78), 0.52);
        break;
      case "paint":
        mat.metalness = 0.02;
        mat.roughness = 0.48;
        // Add clearcoat if we have a physical material (or upgrade)
        if (mat.isMeshPhysicalMaterial) {
          mat.clearcoat = Math.max(mat.clearcoat || 0, 0.3);
          mat.clearcoatRoughness = 0.22;
        }
        break;
      case "glass":
        mat.metalness = 0;
        mat.roughness = Math.min(mat.roughness || 0.5, 0.08);
        mat.transparent = true;
        if (mat.opacity > 0.9) mat.opacity = 0.4;
        break;
      case "leather":
        mat.metalness = 0.04;
        mat.roughness = Math.max(mat.roughness || 0.5, 0.64);
        break;
      case "foliage":
        mat.metalness = 0;
        mat.roughness = Math.max(mat.roughness || 0.5, 0.88);
        if (mat.side !== THREE.DoubleSide) mat.side = THREE.DoubleSide;
        break;
      case "ceramic":
        mat.metalness = 0.04;
        mat.roughness = Math.min(Math.max(mat.roughness || 0.5, 0.22), 0.4);
        break;
      default:
        // If roughness is exactly the Blender default 0.5 (very common), add a tiny
        // variance so surfaces don't all look identical under one light.
        if (Math.abs((mat.roughness || 0.5) - 0.5) < 0.001) {
          mat.roughness = 0.55 + Math.random() * 0.08;
        }
    }
    // Cap emissive so a rogue GLB doesn't nuke bloom
    if (mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 1.5)
      mat.emissiveIntensity = 1.2;
    // Enable anisotropy on color maps for crisp grazing-angle textures
    if (renderer && mat.map) {
      try {
        mat.map.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
      } catch (error) {
        window.reportRoseRecoverableError?.("Material anisotropy update failed", error);
      }
    }
    mat.needsUpdate = true;
  }
  function patchGLBMaterials(root, renderer) {
    if (!root || typeof root.traverse !== "function") return 0;
    let n = 0;
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (m && !m[DATA_KEY]) {
          patchMaterial(m, obj.name, renderer);
          n++;
        }
      });
      // Soft shadows look better when tiny props receive too — ensure all GLB meshes cast & receive
      obj.castShadow = true;
      obj.receiveShadow = obj.receiveShadow || (obj.geometry?.boundingBox ? true : false);
    });
    return n;
  }
  window.patchGLBMaterials = patchGLBMaterials;
})();
