import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner2d.js"), "utf8");
const styleSource = readFileSync(
  path.join(root, "scripts", "planner2d", "furniture-style.js"),
  "utf8",
);
const mainSource = readFileSync(path.join(root, "scripts", "main.js"), "utf8");
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

class TestColor {
  constructor(value) {
    this.value = value;
    this.r = value === "#ffffff" ? 1 : 0.1;
    this.g = value === "#ffffff" ? 1 : 0.2;
    this.b = value === "#ffffff" ? 1 : 0.3;
  }
  getHSL(target) {
    target.l = this.value === "#ffffff" || this.value === "#ffeeaa" ? 0.85 : 0.35;
  }
  clone() {
    return new TestColor(this.value);
  }
  offsetHSL() {
    return this;
  }
}

globalThis.window = globalThis;
globalThis.safeThreeColor = (value, fallback) => new TestColor(value || fallback);
globalThis.variantDisplayColor = (f) => f?.variantColor || "";

await import("../planner2d/furniture-style.js");

const style = window.Planner2DFurnitureStyle;
const requiredFunctions = [
  "threeColorToRgba",
  "furniture2DStroke",
  "furniture2DLabelInk",
  "furniture2DTint",
];

expect("Planner2DFurnitureStyle bridge must be registered", Boolean(style));
expect("style boundary must expose group tints", Boolean(style?.FURN_GROUP_TINTS?.Seating));
for (const name of requiredFunctions) {
  expect(
    `furniture-style.js must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(styleSource),
  );
  expect(
    `planner2d.js must not define ${name}()`,
    !new RegExp(`function\\s+${name}\\s*\\(`).test(plannerSource),
  );
  expect(`Planner2DFurnitureStyle must expose ${name}`, typeof style?.[name] === "function");
}
expect(
  "planner2d.js must not define FURN_GROUP_TINTS",
  !/const\s+FURN_GROUP_TINTS/.test(plannerSource),
);

expect(
  "threeColorToRgba should convert normalized color channels",
  style.threeColorToRgba({ r: 1, g: 0.5, b: 0 }, 0.25) === "rgba(255,128,0,0.25)",
);
expect(
  "variant display color should win over group tint",
  style.furniture2DTint({ variantColor: "#ffeeaa" }, { group: "Seating" }) === "#ffeeaa",
);
expect(
  "group tint should cover known groups",
  style.furniture2DTint({}, { group: "Storage" }) === "#6E8A66",
);
expect(
  "unknown group should use fallback tint",
  style.furniture2DTint({}, { group: "Other" }) === "#8A7868",
);
expect(
  "light furniture fill should use dark label ink",
  style.furniture2DLabelInk({ variantColor: "#ffffff" }, { group: "Seating" }) ===
    "rgba(58,44,34,.88)",
);
expect(
  "dark furniture fill should use light label ink",
  style.furniture2DLabelInk({}, { group: "Seating" }) === "rgba(248,244,236,.92)",
);
expect(
  "light furniture fill should use fixed dark stroke",
  style.furniture2DStroke({ variantColor: "#ffffff" }, { group: "Seating" }) ===
    "rgba(68,52,40,.82)",
);
expect(
  "dark furniture fill should derive a rgba stroke",
  style.furniture2DStroke({}, { group: "Seating" }) === "rgba(26,51,77,0.96)",
);

const order = [...mainSource.matchAll(/["'](\.\/scripts\/[^"']+)["']/g)].map((match) => match[1]);
const styleIndex = order.indexOf("./scripts/planner2d/furniture-style.js");
const plannerIndex = order.indexOf("./scripts/planner2d.js");
expect("runtime modules must include planner2d/furniture-style.js", styleIndex >= 0);
expect("runtime modules must include planner2d.js", plannerIndex >= 0);
expect(
  "planner2d/furniture-style.js must load before planner2d.js",
  styleIndex >= 0 && plannerIndex >= 0 && styleIndex < plannerIndex,
);
expect(
  "style boundary should register window.Planner2DFurnitureStyle",
  /window\.Planner2DFurnitureStyle\s*=\s*Object\.freeze/.test(styleSource),
);

if (errors.length) {
  console.error("Furniture style validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Furniture style validation passed.");
