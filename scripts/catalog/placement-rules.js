(function initCatalogPlacementRules() {
  const assetPlacements = new Map();

  const SPECIFIC_ELEVATIONS = Object.freeze({
    wall_art_01: 5.2,
    wall_art_04: 5.2,
    wall_art_06: 5.2,
    mirror: 5,
    bathroom_mirror: 5,
    ph_mirror_ornate: 5,
    ph_ornate_mirror_01: 5,
    lamp_wall: 5.8,
    ph_lamp_pipe: 5.8,
    curtains: 7.2,
    blinds: 5.8,
    shelf_small: 5.5,
    shelving: 5.5,
    ph_shelf_01: 5.5,
    bathroom_towel_bar: 4.2,
    thi_towel_rack: 4.2,
    thi_fireplace: 1.8,
    kn_paneling: 4.5,
    kn_doorway_open: 0,
    plant_small: 2.9,
    lamp_table: 2.8,
  });

  function roomHeightOrDefault(roomHeight) {
    return Math.max(8, Number(roomHeight) || 9);
  }

  function ceilingElevation(assetKey, roomHeight) {
    const height = roomHeightOrDefault(roomHeight);
    if (/chandelier|pendant|hood/i.test(assetKey || "")) return Math.max(7.2, height - 0.6);
    return Math.max(7.2, height - 0.55);
  }

  function elevationFromPlacementRule(rule, roomHeight) {
    if (Number.isFinite(rule)) return rule;
    if (!rule || typeof rule !== "object") return null;
    if (rule.relativeTo === "ceiling") {
      const height = roomHeightOrDefault(roomHeight);
      const offset = Number.isFinite(rule.offset) ? rule.offset : 0.55;
      const min = Number.isFinite(rule.min) ? rule.min : 7.2;
      return Math.max(min, height - offset);
    }
    return null;
  }

  function registerAssetPlacement(entries = []) {
    assetPlacements.clear();
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (!entry?.id || !entry.placement || typeof entry.placement !== "object") continue;
      assetPlacements.set(entry.id, entry.placement);
    }
  }

  function defaultElevation({ mountType, assetKey, type, roomHeight } = {}) {
    const key = assetKey || "";
    const registered = assetPlacements.get(key);
    const registeredElevation = elevationFromPlacementRule(
      registered?.defaultElevation,
      roomHeight,
    );
    if (Number.isFinite(registeredElevation)) return registeredElevation;
    if (Number.isFinite(SPECIFIC_ELEVATIONS[key])) return SPECIFIC_ELEVATIONS[key];
    if (mountType === "ceiling") return ceilingElevation(key, roomHeight);
    if (mountType === "wall") return 5;
    if (mountType === "surface") return 2.8;
    if (type === "lamp") return 0;
    return 0;
  }

  window.CatalogPlacementRules = Object.freeze({
    defaultElevation,
    registerAssetPlacement,
    specificElevations: SPECIFIC_ELEVATIONS,
  });
})();
