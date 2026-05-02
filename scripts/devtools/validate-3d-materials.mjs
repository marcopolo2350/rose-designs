import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner3d.js"), "utf8");
const materialsSource = readFileSync(
  path.join(root, "scripts", "planner3d", "materials.js"),
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
  }
  lerp(tint, amount) {
    this.lerpTint = tint;
    this.lerpAmount = amount;
    return this;
  }
  copy(tint) {
    this.copyTint = tint;
    return this;
  }
  multiplyScalar(amount) {
    this.scalar = amount;
    return this;
  }
}

class MeshStandardMaterial {
  constructor(options = {}) {
    Object.assign(this, options);
    if (!this.emissive) this.emissive = new TestColor("#000000");
    this.needsUpdate = false;
  }
  clone() {
    return new MeshStandardMaterial({
      ...this,
      color: this.color,
      emissive: this.emissive,
    });
  }
}

globalThis.window = globalThis;
globalThis.THREE = { MeshStandardMaterial };
globalThis.safeThreeColor = (value, fallback) => new TestColor(value || fallback);
globalThis.getFurnitureVariant = (item) => item?.variant || null;

await import("../planner3d/materials.js");

const materials = window.Planner3DMaterials;
const requiredFunctions = [
  "furnitureMaterialProfile",
  "furnitureBaseTint",
  "premiumVariantMat",
  "applyFurnitureFinishToModel",
  "premiumMat",
];

expect("Planner3DMaterials bridge must be registered", Boolean(materials));
for (const name of requiredFunctions) {
  expect(
    `materials.js must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(materialsSource),
  );
  expect(
    `planner3d.js must not define ${name}()`,
    !new RegExp(`function\\s+${name}\\s*\\(`).test(plannerSource),
  );
  expect(`Planner3DMaterials must expose ${name}`, typeof materials?.[name] === "function");
}

const profile = materials.furnitureMaterialProfile({
  finishColor: "#123456",
  variant: {
    previewColor: "#abcdef",
    accentColor: "#fedcba",
    family: "velvet",
    roughness: 0.37,
    metalness: 0.08,
    tintStrength: 0.61,
  },
});
expect("material profile should use variant family", profile?.family === "velvet");
expect("material profile should preserve roughness", profile?.roughness === 0.37);
expect("material profile should preserve metalness", profile?.metalness === 0.08);
expect("material profile should preserve tint strength", profile?.tintStrength === 0.61);

const baseTint = materials.furnitureBaseTint({ finishColor: "#112233" });
expect("base tint should return a THREE color-compatible object", baseTint instanceof TestColor);

const premium = materials.premiumVariantMat({
  variant: { previewColor: "#999999", family: "metal" },
});
expect(
  "premium variant material should create MeshStandardMaterial",
  premium instanceof MeshStandardMaterial,
);
expect(
  "premium variant material should preserve profile fallback metalness",
  premium.metalness === 0.05,
);

const child = {
  isMesh: true,
  material: new MeshStandardMaterial({
    color: new TestColor("#ffffff"),
    roughness: 0.3,
    metalness: 0.1,
    envMapIntensity: 0.1,
  }),
};
materials.applyFurnitureFinishToModel(
  {
    traverse(callback) {
      callback(child);
    },
  },
  {
    variant: {
      previewColor: "#445566",
      family: "leather",
      roughness: 0.46,
      metalness: 0.03,
      tintStrength: 0.52,
    },
  },
);
expect(
  "finish application should clone and replace the mesh material",
  child.material instanceof MeshStandardMaterial,
);
expect("finish application should mark material for update", child.material.needsUpdate === true);
expect("finish application should adjust material roughness", child.material.roughness > 0.3);
expect(
  "finish application should raise leather/wood environment intensity",
  child.material.envMapIntensity >= 0.9,
);

const plain = materials.premiumMat("#ffffff", 0.2, 0.3);
expect("premiumMat should create MeshStandardMaterial", plain instanceof MeshStandardMaterial);
expect("premiumMat should preserve roughness override", plain.roughness === 0.2);
expect("premiumMat should preserve metalness override", plain.metalness === 0.3);

const order = [...mainSource.matchAll(/["'](\.\/scripts\/[^"']+)["']/g)].map((match) => match[1]);
const materialsIndex = order.indexOf("./scripts/planner3d/materials.js");
const plannerIndex = order.indexOf("./scripts/planner3d.js");
expect("runtime modules must include planner3d/materials.js", materialsIndex >= 0);
expect("runtime modules must include planner3d.js", plannerIndex >= 0);
expect(
  "planner3d/materials.js must load before planner3d.js",
  materialsIndex >= 0 && plannerIndex >= 0 && materialsIndex < plannerIndex,
);
expect(
  "materials boundary should register window.Planner3DMaterials",
  /window\.Planner3DMaterials\s*=\s*Object\.freeze/.test(materialsSource),
);

if (errors.length) {
  console.error("3D materials validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D materials validation passed.");
