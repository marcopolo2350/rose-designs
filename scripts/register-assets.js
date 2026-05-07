#!/usr/bin/env node
/**
 * Rose Designs Asset Registration Script
 *
 * Auto-generates and registers normalized assets into:
 *   - MODEL_REGISTRY (scripts/storage.js)
 *   - FURN_ITEMS (scripts/catalog.js)
 *   - asset-manifest.json (data/)
 *   - verificationTargetSize map (scripts/planner3d.js)
 *
 * Usage: node scripts/register-assets.js
 */

const fs = require("fs");
const path = require("path");

const ACQUISITION_FILE = "./data/asset-acquisitions.json";
const NORMALIZATION_LOG = "./data/normalization-log.json";
const ASSET_MANIFEST = "./data/asset-manifest.json";
const STORAGE_JS = "./scripts/storage.js";
const CATALOG_JS = "./scripts/catalog.js";
const PLANNER3D_JS = "./scripts/planner3d.js";

// Color output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function generateModelRegistryEntry(asset) {
  /**
   * Generates a MODEL_REGISTRY entry for an asset.
   *
   * Template:
   * {assetKey}: {
   *   file: '{filename}.glb',
   *   category: '{category}',
   *   mountType: 'floor',
   *   defaultScale: 1.0,
   *   yOffset: 0,
   *   snapToWall: false,
   *   snapToFloor: true,
   *   fit: 'footprint',
   *   yawOffset: 0,
   *   forwardAxis: '+z',
   *   wallFacingMode: 'free',
   *   defaultFacing: 'forward'
   * }
   */

  const category = asset.category.toLowerCase();
  const isWallMount = asset.mountType === "wall";
  const isCeiling = asset.mountType === "ceiling";

  return {
    id: asset.id,
    code: `${asset.id}: {
    file: '${asset.id}.glb',
    category: '${category}',
    mountType: '${asset.mountType || "floor"}',
    defaultScale: ${asset.defaultScale || 1.0},
    yOffset: ${asset.yOffset || 0},
    snapToWall: ${isWallMount},
    snapToFloor: ${!isWallMount},
    fit: 'footprint',
    yawOffset: 0,
    forwardAxis: '+z',
    wallFacingMode: '${isWallMount ? "face_interior" : "free"}',
    defaultFacing: '${isWallMount ? "interior" : "forward"}'
  }`,
  };
}

function generateFurnItemEntry(asset) {
  /**
   * Generates a FURN_ITEMS entry for an asset.
   *
   * Template:
   * {
   *   label: '{asset.name}',
   *   w: {width},
   *   d: {depth},
   *   icon: '{}',
   *   symbol: 'X',
   *   assetKey: '{id}',
   *   group: '{category}'
   * }
   */

  // Select icon based on category
  const icons = {
    Kitchen: "🍳",
    Bathroom: "🚿",
    "Living Room": "🛋️",
    Bedroom: "🛏️",
    Dining: "🍽️",
  };

  const defaultWidth = asset.realWorldWidth || 2.0;
  const defaultDepth = asset.realWorldDepth || 1.5;
  const symbol = asset.id.charAt(0).toUpperCase();
  const icon = icons[asset.category] || "🪑";

  return {
    id: asset.id,
    code: `  {label:'${asset.name}',w:${defaultWidth},d:${defaultDepth},icon:'${icon}',symbol:'${symbol}',assetKey:'${asset.id}',group:'${asset.category}'}`,
  };
}

function generateAssetManifestEntry(asset) {
  /**
   * Generates an asset-manifest.json entry for an asset.
   * Includes variants, tags, collections, and licensing info.
   */

  const variants = (asset.variants || []).map((v) => ({
    id: v.id,
    label: v.label,
    type: "material",
    family: "finish",
    previewColor: v.color,
    accentColor: v.color,
    roughness: 0.8,
    metalness: 0.1,
    tintStrength: 0.4,
  }));

  return {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    subcategory: asset.id.split("_")[0],
    modelPath: `./assets/models/${asset.id}.glb`,
    thumbnailPath: `./assets/thumbnails/${asset.id}.png`,
    defaultScale: asset.defaultScale || 1.0,
    tags: [asset.category.toLowerCase(), ...(asset.tags || [])],
    collections: asset.collections || [],
    recommendedRoomTypes: asset.recommendedRoomTypes || [],
    variants: variants,
    defaultVariantId: (variants[0] || {}).id || null,
    sourceUrl: asset.sourceUrl,
    sourceLicense: asset.license,
    sourceAttribution: asset.attribution,
    sourceDate: new Date().toISOString().split("T")[0],
  };
}

function generateVerificationSizeEntry(asset) {
  /**
   * Generates a verificationTargetSize map entry.
   * Template: assetKey: { w, d, h }
   */

  const w = Math.max(0.45, asset.realWorldWidth || 2.0);
  const d = Math.max(0.2, asset.realWorldDepth || 1.2);
  const h = Math.max(0.7, asset.realWorldHeight || 2.0);

  return {
    id: asset.id,
    code: `${asset.id}: { w: ${w}, d: ${d}, h: ${h} }`,
  };
}

function extractAssetsFromAcquisitions() {
  /**
   * Reads asset-acquisitions.json and flattens to single array.
   */
  const data = JSON.parse(fs.readFileSync(ACQUISITION_FILE, "utf8"));
  const assets = [...data.kitchenAssets, ...data.bathroomAssets, ...data.livingRoomUpgrades];
  return assets;
}

function generateModelRegistryCode(assets) {
  /**
   * Generates the complete MODEL_REGISTRY code block.
   */
  const entries = assets.map(generateModelRegistryEntry);
  const code = entries.map((e) => e.code).join(",\n  ");
  return `/* AUTO-GENERATED: Free Premium Assets Sprint */\n  ${code}`;
}

function generateFurnItemsCode(assets) {
  /**
   * Generates the complete FURN_ITEMS array entries.
   */
  const entries = assets.map(generateFurnItemEntry);
  const code = entries.map((e) => e.code).join(",\n");
  return `/* AUTO-GENERATED: Free Premium Assets Sprint */\n${code},`;
}

function generateAssetManifestJSON(assets) {
  /**
   * Generates complete asset-manifest.json with all entries.
   */
  const existingManifest = fs.existsSync(ASSET_MANIFEST)
    ? JSON.parse(fs.readFileSync(ASSET_MANIFEST, "utf8"))
    : [];

  // Merge new assets with existing ones, deduplicating by id
  const existingIds = new Set(existingManifest.map((a) => a.id));
  const newAssets = assets.filter((a) => !existingIds.has(a.id));

  const manifest = [...existingManifest, ...newAssets.map(generateAssetManifestEntry)];

  return manifest;
}

function generateVerificationCodeBlock(assets) {
  /**
   * Generates verificationTargetSize() entries.
   */
  const entries = assets.map(generateVerificationSizeEntry);
  const code = entries.map((e) => e.code).join(",\n  ");
  return `/* AUTO-GENERATED: Free Premium Assets Sprint */\n  ${code}`;
}

function main() {
  log("\n╔════════════════════════════════════════════════════════════╗", "blue");
  log("║  Rose Designs Asset Registration                          ║", "blue");
  log("╚════════════════════════════════════════════════════════════╝", "blue");

  // 1. Load acquisitions
  log("\n[1/4] Reading asset-acquisitions.json...", "yellow");
  const assets = extractAssetsFromAcquisitions();
  log(`  ✓ Loaded ${assets.length} assets`, "green");

  // 2. Generate code blocks
  log("\n[2/4] Generating registration code...", "yellow");
  const modelRegistry = generateModelRegistryCode(assets);
  const furnItems = generateFurnItemsCode(assets);
  const verificationSizes = generateVerificationCodeBlock(assets);
  const manifest = generateAssetManifestJSON(assets);
  log(`  ✓ Generated MODEL_REGISTRY, FURN_ITEMS, verificationTargetSize entries`, "green");

  // 3. Show code snippets (for manual insertion)
  log("\n[3/4] Code snippets for manual integration:", "yellow");
  log("\n--- Paste into scripts/storage.js (MODEL_REGISTRY, after line 193) ---", "blue");
  log(modelRegistry.slice(0, 300) + "...", "blue");

  log("\n--- Paste into scripts/catalog.js (FURN_ITEMS array) ---", "blue");
  log("[\n" + furnItems.slice(0, 300) + "...", "blue");

  log("\n--- verificationTargetSize() entries for scripts/planner3d.js ---", "blue");
  log(verificationSizes.slice(0, 300) + "...", "blue");

  // 4. Write asset-manifest.json (auto-generated)
  log("\n[4/4] Writing asset-manifest.json...", "yellow");
  fs.writeFileSync(ASSET_MANIFEST, JSON.stringify(manifest, null, 2));
  log(`  ✓ Wrote ${manifest.length} total assets to asset-manifest.json`, "green");

  // Summary
  log("\n╔════════════════════════════════════════════════════════════╗", "blue");
  log("║  NEXT STEPS                                                ║", "blue");
  log("╚════════════════════════════════════════════════════════════╝", "blue");
  log("\n1. Copy MODEL_REGISTRY entries into scripts/storage.js (line ~193)", "yellow");
  log("2. Copy FURN_ITEMS entries into scripts/catalog.js (line ~100)", "yellow");
  log("3. Copy verificationTargetSize entries into scripts/planner3d.js (line ~1310)", "yellow");
  log("4. asset-manifest.json has been auto-updated ✓", "green");
  log("\n5. Run: npm run generate-thumbnails", "yellow");
  log("6. Commit changes to git", "yellow");
  log("\n");
}

main();
