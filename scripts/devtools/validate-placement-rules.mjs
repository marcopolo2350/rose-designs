import { readFileSync } from "node:fs";
import path from "node:path";

globalThis.window = globalThis;

await import("../catalog/placement-rules.js");

const root = process.cwd();
const errors = [];
const rules = window.CatalogPlacementRules;
const manifest = JSON.parse(readFileSync(path.join(root, "data", "asset-manifest.json"), "utf8"));
const manifestById = new Map(manifest.map((entry) => [entry.id, entry]));
const placementEntries = manifest.filter((entry) => entry.placement);
rules?.registerAssetPlacement?.(manifest);

function expect(label, condition) {
  if (!condition) errors.push(label);
}

expect("CatalogPlacementRules bridge must be registered", Boolean(rules));
expect(
  "wall art should default to art hanging height",
  rules.defaultElevation({ mountType: "wall", assetKey: "wall_art_01" }) === 5.2,
);
expect(
  "wall sconce should default above eye height",
  rules.defaultElevation({ mountType: "wall", assetKey: "lamp_wall" }) === 5.8,
);
expect(
  "bath towel bars should default below art height",
  rules.defaultElevation({ mountType: "wall", assetKey: "bathroom_towel_bar" }) === 4.2,
);
expect(
  "ceiling lights should track room height",
  rules.defaultElevation({ mountType: "ceiling", assetKey: "lamp_ceiling", roomHeight: 10 }) ===
    9.45,
);
expect(
  "pendants should hang lower than flush ceiling lights",
  rules.defaultElevation({ mountType: "ceiling", assetKey: "lamp_pendant", roomHeight: 10 }) ===
    9.4,
);
expect(
  "surface pieces should default to tabletop height",
  rules.defaultElevation({ mountType: "surface", assetKey: "lamp_table" }) === 2.8,
);
expect(
  "floor pieces should stay on the floor",
  rules.defaultElevation({ mountType: "floor", assetKey: "sofa" }) === 0,
);
expect(
  "manifest should carry placement metadata for mounted or elevated assets",
  placementEntries.length >= 30,
);
for (const entry of manifest) {
  if (["wall", "surface", "ceiling"].includes(entry.mountType)) {
    expect(`${entry.id} should carry manifest placement metadata`, Boolean(entry.placement));
  }
}
for (const [assetKey, elevation] of Object.entries(rules.specificElevations || {})) {
  const placement = manifestById.get(assetKey)?.placement;
  expect(`${assetKey} should define its specific elevation in the manifest`, Boolean(placement));
  expect(
    `${assetKey} manifest elevation should match catalog placement rules`,
    placement?.defaultElevation === elevation,
  );
}
expect(
  "surface manifest metadata should drive table lamp placement",
  rules.defaultElevation({ mountType: "surface", assetKey: "lamp_table" }) === 2.8,
);
expect(
  "manifest ceiling placement should support room-height-relative rules",
  rules.defaultElevation({ mountType: "ceiling", assetKey: "ph_lamp_ceiling", roomHeight: 10 }) ===
    9.45,
);

const stateSource = readFileSync(path.join(root, "scripts", "state.js"), "utf8").replace(
  /\r\n/g,
  "\n",
);
const defaultElevationBlock =
  stateSource.match(/function\s+defaultElevation\s*\([\s\S]*?\n}\nfunction\s+axisYawOffset/)?.[0] ||
  "";
expect(
  "state defaultElevation should delegate to catalog placement rules",
  /CatalogPlacementRules\.defaultElevation/.test(defaultElevationBlock),
);
expect(
  "state defaultElevation should not hard-code wall art keys",
  !/wall_art_0[146]/.test(defaultElevationBlock),
);
expect(
  "state defaultElevation should not hard-code mirror/sconce keys",
  !/(lamp_wall|mirror|curtains|shelving|plant_small)/.test(defaultElevationBlock),
);

if (errors.length) {
  console.error("Placement-rule validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Placement-rule validation passed.");
