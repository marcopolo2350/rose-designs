import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner3d.js"), "utf8");
const planner2DSource = readFileSync(path.join(root, "scripts", "planner2d.js"), "utf8");
const texturesSource = readFileSync(path.join(root, "scripts", "planner3d", "textures.js"), "utf8");
const mainSource = readFileSync(path.join(root, "scripts", "main.js"), "utf8");
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

class FakeColor {
  constructor(value) {
    this.value = String(value || "#000000");
    this.l = this.value === "#ffffff" ? 0.9 : 0.35;
  }

  getHSL(target) {
    target.h = 0;
    target.s = 0;
    target.l = this.l;
    return target;
  }

  getHexString() {
    return this.value.replace("#", "").padStart(6, "0").slice(0, 6);
  }

  clone() {
    const next = new FakeColor(this.value);
    next.l = this.l;
    return next;
  }

  lerp(color, amount) {
    this.lerpTarget = color;
    this.lerpAmount = amount;
    return this;
  }
}

class FakeCanvasTexture {
  constructor(canvas) {
    this.image = canvas;
    this.repeat = {
      x: 0,
      y: 0,
      set: (x, y) => {
        this.repeat.x = x;
        this.repeat.y = y;
      },
    };
  }
}

class FakeBufferAttribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
    this.needsUpdate = false;
  }
}

function makeContext(canvas) {
  return {
    beginPath() {
      canvas.ops.push("beginPath");
    },
    bezierCurveTo() {
      canvas.ops.push("bezierCurveTo");
    },
    clearRect() {
      canvas.ops.push("clearRect");
    },
    ellipse() {
      canvas.ops.push("ellipse");
    },
    fill() {
      canvas.ops.push("fill");
    },
    fillRect() {
      canvas.ops.push("fillRect");
    },
    lineTo() {
      canvas.ops.push("lineTo");
    },
    moveTo() {
      canvas.ops.push("moveTo");
    },
    stroke() {
      canvas.ops.push("stroke");
    },
    strokeRect() {
      canvas.ops.push("strokeRect");
    },
    set fillStyle(value) {
      canvas.styles.push(["fill", value]);
    },
    set lineWidth(value) {
      canvas.styles.push(["lineWidth", value]);
    },
    set strokeStyle(value) {
      canvas.styles.push(["stroke", value]);
    },
  };
}

const canvases = [];
const documentRef = {
  createElement(tagName) {
    expect("textures only create canvas elements", tagName === "canvas");
    const canvas = {
      height: 0,
      ops: [],
      styles: [],
      width: 0,
      getContext(kind) {
        expect("textures request 2d canvas context", kind === "2d");
        return makeContext(canvas);
      },
    };
    canvases.push(canvas);
    return canvas;
  },
};

globalThis.window = globalThis;

await import("../planner3d/textures.js");

const textures = window.Planner3DTextures;
const floorTypes = [
  { id: "light_oak", family: "wood", color: "#caa574", repeat: 3 },
  { id: "checker", family: "checker", color: "#ffffff", repeat: 2 },
  { id: "tile", family: "tile", color: "#ddd7cf", repeat: 4 },
  { id: "concrete", family: "concrete", color: "#777777", repeat: 1 },
];
const THREERef = {
  BufferAttribute: FakeBufferAttribute,
  CanvasTexture: FakeCanvasTexture,
  RepeatWrapping: "repeat-wrapping",
};
const safeThreeColor = (value, fallback) => new FakeColor(value || fallback);

const requiredFunctions = [
  "applyPlanarUVs",
  "buildFloorAccentTexture",
  "buildFloorTexture",
  "pickPreset",
];

expect("Planner3DTextures bridge must be registered", Boolean(textures));
for (const name of requiredFunctions) {
  expect(
    `textures.js must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(texturesSource),
  );
  expect(`Planner3DTextures must expose ${name}`, typeof textures?.[name] === "function");
}

expect(
  "planner3d.js must not define floor texture helpers",
  !/\bfunction\s+(?:buildFloorTexture|buildFloorAccentTexture|applyPlanarUVs)\s*\(/.test(
    plannerSource,
  ),
);
expect(
  "planner3d.js must delegate floor textures to Planner3DTextures",
  /Planner3DTextures\.buildFloorTexture/.test(plannerSource) &&
    /Planner3DTextures\.buildFloorAccentTexture/.test(plannerSource) &&
    /Planner3DTextures\.applyPlanarUVs/.test(plannerSource),
);
expect(
  "planner2d.js style refresh must delegate floor textures to Planner3DTextures",
  /Planner3DTextures\.buildFloorTexture/.test(planner2DSource) &&
    /Planner3DTextures\.buildFloorAccentTexture/.test(planner2DSource),
);
expect(
  "textures module must load before planner2d.js",
  mainSource.indexOf("./scripts/planner3d/textures.js") > -1 &&
    mainSource.indexOf("./scripts/planner3d/textures.js") <
      mainSource.indexOf("./scripts/planner2d.js"),
);
expect(
  "textures module must load before planner3d.js",
  mainSource.indexOf("./scripts/planner3d/textures.js") > -1 &&
    mainSource.indexOf("./scripts/planner3d/textures.js") <
      mainSource.indexOf("./scripts/planner3d.js"),
);

const wood = textures.buildFloorTexture({
  THREE: THREERef,
  document: documentRef,
  floorTypes,
  safeThreeColor,
  color: "#a07855",
  type: "light_oak",
});
expect("floor texture uses a 768 canvas", wood.image.width === 768 && wood.image.height === 768);
expect(
  "floor texture sets repeat wrapping",
  wood.wrapS === "repeat-wrapping" && wood.wrapT === "repeat-wrapping",
);
expect("floor texture applies preset repeat", wood.repeat.x === 3 && wood.repeat.y === 3);
expect("wood texture draws canvas operations", wood.image.ops.length > 20);

const checker = textures.buildFloorTexture({
  THREE: THREERef,
  document: documentRef,
  floorTypes,
  safeThreeColor,
  color: "#ffffff",
  type: "checker",
});
expect("checker texture draws enough tile operations", checker.image.ops.length > 20);

const accent = textures.buildFloorAccentTexture({
  THREE: THREERef,
  document: documentRef,
  floorTypes,
  type: "tile",
});
expect(
  "accent texture uses a 1024 canvas",
  accent.image.width === 1024 && accent.image.height === 1024,
);
expect("accent texture applies preset repeat", accent.repeat.x === 4 && accent.repeat.y === 4);

const geometry = {
  attributes: {
    position: {
      count: 3,
      getX(index) {
        return [0, 10, 0][index];
      },
      getY(index) {
        return [0, 0, 5][index];
      },
    },
  },
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
};
textures.applyPlanarUVs(THREERef, geometry, [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 0, y: 5 },
]);
expect(
  "applyPlanarUVs writes a uv BufferAttribute",
  geometry.attributes.uv instanceof FakeBufferAttribute,
);
expect("applyPlanarUVs marks uv dirty", geometry.attributes.uv.needsUpdate === true);
expect(
  "applyPlanarUVs normalizes x/y spans",
  geometry.attributes.uv.array[2] === 1 && geometry.attributes.uv.array[5] === 1,
);

if (errors.length) {
  console.error("3D texture validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D texture validation passed.");
