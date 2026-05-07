import { readFileSync } from "node:fs";
import path from "node:path";

globalThis.window = globalThis;

await import("../planner3d/walls.js");

const walls = window.Planner3DWalls;
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

class VectorLike {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

class FakeColor {
  constructor(value) {
    this.value = value;
  }

  clone() {
    return new FakeColor(this.value);
  }

  offsetHSL(h, s, l) {
    this.offset = [h, s, l];
    return this;
  }
}

class FakeBoxGeometry {
  constructor(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

class FakeMesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = new VectorLike();
    this.rotation = { y: 0 };
    this.userData = {};
    this.castShadow = false;
    this.receiveShadow = false;
  }
}

class FakeGroup {
  constructor() {
    this.children = [];
    this.position = new VectorLike();
    this.rotation = { y: 0 };
  }

  add(child) {
    this.children.push(child);
  }
}

class FakeMaterial {
  constructor(options = {}) {
    Object.assign(this, options);
    this.options = options;
  }
}

const THREERef = {
  BoxGeometry: FakeBoxGeometry,
  Color: FakeColor,
  Group: FakeGroup,
  Mesh: FakeMesh,
  MeshStandardMaterial: FakeMaterial,
};

expect("Planner3DWalls bridge must be registered", Boolean(walls));

const wallMaterial = {
  transparent: false,
  userData: { isWallSurface: true, styleRoomId: "room-a" },
};
const wallSegment = walls.createWallSegmentMesh(THREERef, {
  angle: 0,
  bottomY: 0,
  material: wallMaterial,
  segmentEnd: 5,
  segmentStart: 1,
  startPoint: { x: 2, y: 3 },
  topY: 8,
});
expect("wall segment mesh must be created", wallSegment instanceof FakeMesh);
expect("wall segment width must match opening slice", wallSegment?.geometry?.width === 4);
expect("wall segment height must match top/bottom", wallSegment?.geometry?.height === 8);
expect("solid wall segment must use thick depth", wallSegment?.geometry?.depth === 0.18);
expect("solid wall segment must cast shadows", wallSegment?.castShadow === true);
expect(
  "solid wall segment must carry cutaway metadata",
  wallSegment?.userData?.roomWallSegment === true,
);
expect("solid wall segment must preserve room id", wallSegment?.userData?.roomId === "room-a");
expect("wall segment x position must be finite", Number.isFinite(wallSegment?.position?.x));

const glassSegment = walls.createWallSegmentMesh(THREERef, {
  angle: Math.PI / 4,
  bottomY: 3,
  material: { opacity: 0.42, transparent: true, userData: {} },
  segmentEnd: 4,
  segmentStart: 2,
  startPoint: { x: 0, y: 0 },
  topY: 7,
});
expect("glass wall segment must use thin depth", glassSegment?.geometry?.depth === 0.04);
expect("glass wall segment must not cast shadows", glassSegment?.castShadow === false);
expect(
  "glass wall segment must not register as cutaway wall",
  !glassSegment?.userData?.roomWallSegment,
);

const door = walls.createDoorLeafGroup(THREERef, {
  angle: 0,
  opening: { height: 7, hinge: "right", swing: "in" },
  openingEnd: 4,
  openingStart: 1,
  startPoint: { x: 0, y: 0 },
  trimColor: new FakeColor("#fff"),
});
expect("door leaf group must be returned", door?.group instanceof FakeGroup);
expect("door leaf must include leaf, inset, and handle", door?.group?.children?.length === 3);
expect("door leaf must expose two style materials", door?.materials?.length === 2);

const windowAssembly = walls.createWindowAssembly(THREERef, {
  angle: 0.25,
  opening: { height: 4, sillHeight: 3 },
  openingEnd: 5,
  openingStart: 2,
  startPoint: { x: 1, y: 2 },
  trimColor: new FakeColor("#eee"),
});
expect("window assembly must expose trim meshes", windowAssembly?.meshes?.length === 7);
expect(
  "window assembly must expose frame and sill materials",
  windowAssembly?.materials?.length === 2,
);
expect(
  "window assembly mesh positions must be finite",
  windowAssembly?.meshes?.every(
    (mesh) => Number.isFinite(mesh.position.x) && Number.isFinite(mesh.position.z),
  ),
);

const hidden = walls.nearestCutawayWalls(
  [
    { id: "far", userData: { wallCenter2D: { x: 20, y: 0 } } },
    { id: "near", userData: { wallCenter2D: { x: 2, y: 0 } } },
    { id: "mid", userData: { wallCenter2D: { x: 8, y: 0 } } },
  ],
  { x: 0, z: 0 },
  2,
);
expect(
  "cutaway walls should be sorted by distance",
  hidden.map((wall) => wall.id).join(",") === "near,mid",
);

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner3d.js"), "utf8");
const wallsSource = readFileSync(path.join(root, "scripts", "planner3d", "walls.js"), "utf8");

for (const name of [
  "createWallSegmentMesh",
  "nearestCutawayWalls",
  "createDoorLeafGroup",
  "createWindowAssembly",
]) {
  expect(
    `walls boundary must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(wallsSource),
  );
}

for (const forbidden of [
  ["wall segment BoxGeometry depth selection", /new\s+THREE\.BoxGeometry\(sw,\s*sh,\s*th\)/],
  ["wall segment glass detection", /const\s+isGlass\s*=\s*mat&&mat\.transparent/],
  ["door trim material offsets", /offsetHSL\(\.015,\s*\.08,\s*-.05\)/],
  ["window trim depth assembly", /const\s+trimDepth\s*=\s*\.06/],
]) {
  expect(`planner3d.js must not own ${forbidden[0]}`, !forbidden[1].test(plannerSource));
}

expect(
  "planner3d.js must delegate wall segment creation",
  /Planner3DWalls\.createWallSegmentMesh/.test(plannerSource),
);
expect(
  "planner3d.js must delegate orbit cutaway ranking",
  /Planner3DWalls\.nearestCutawayWalls/.test(plannerSource),
);
expect(
  "planner3d.js must delegate door leaf assembly",
  /Planner3DWalls\.createDoorLeafGroup/.test(plannerSource),
);
expect(
  "planner3d.js must delegate window assembly",
  /Planner3DWalls\.createWindowAssembly/.test(plannerSource),
);

if (errors.length) {
  console.error("3D wall validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D wall validation passed.");
