(function initCatalogManifestBoundary() {
  function identity(value) {
    return value;
  }

  function normalizeManifestEntries(entries, helpers = {}) {
    const normalizeGroup = helpers.normalizeCatalogGroup || identity;
    const normalizeArray = helpers.normalizeArrayValue || ((value) => (Array.isArray(value) ? value : []));
    const normalizeVariants =
      helpers.normalizeVariantsValue || ((value) => (Array.isArray(value) ? value : []));

    if (!Array.isArray(entries)) return [];
    return entries.map((entry) => ({
      ...entry,
      category: normalizeGroup(entry.category),
      tags: normalizeArray(entry.tags),
      collections: normalizeArray(entry.collections),
      recommendedRoomTypes: normalizeArray(entry.recommendedRoomTypes),
      variants: normalizeVariants(entry.variants),
      placement:
        entry.placement && typeof entry.placement === "object" && !Array.isArray(entry.placement)
          ? { ...entry.placement }
          : undefined,
    }));
  }

  async function fetchManifest(options = {}) {
    const url = options.url || "./data/asset-manifest.json";
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    const json = await response.json();
    return normalizeManifestEntries(json, options);
  }

  window.RoseCatalogManifest = {
    fetchManifest,
    normalizeManifestEntries,
  };
})();
