import { readFileSync } from "node:fs";
import path from "node:path";

globalThis.window = globalThis;

await import("../planner3d/placement.js");

const placement = window.Planner3DPlacement;
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

class FakeVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

const THREERef = { Vector3: FakeVector3 };

const room = {
  height: 9,
  walls: [
    { id: "north", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
    { id: "east", start: { x: 10, y: 0 }, end: { x: 10, y: 10 } },
    { id: "south", start: { x: 10, y: 10 }, end: { x: 0, y: 10 } },
    { id: "west", start: { x: 0, y: 10 }, end: { x: 0, y: 0 } },
  ],
  openings: [{ type: "window", wallId: "north", offset: 5, width: 3, sillHeight: 3, height: 4 }],
  furniture: [
    { assetKey: "desk", d: 2, id: "desk", x: 4, z: 4 },
    { assetKey: "chair", d: 2, id: "chair", x: 8, z: 8 },
  ],
};

const helpers = {
  axisYawOffset(axis) {
    return axis === "x" ? Math.PI / 2 : 0;
  },
  defaultElevation(mountType) {
    return mountType === "wall" ? 5 : 2.25;
  },
  getRoomFocus() {
    return { x: 5, y: 5 };
  },
  resolveLabel(label) {
    return String(label || "");
  },
  wA(_room, wall) {
    return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  },
  wE(_room, wall) {
    return wall.end;
  },
  wL(_room, wall) {
    return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  },
  wS(_room, wall) {
    return wall.start;
  },
};

const registry = {
  curtains: { mountType: "wall", snapToOpening: true },
  lamp_ceiling: { mountType: "ceiling" },
  lamp_table: { mountType: "surface" },
  wall_art_01: { forwardAxis: "z", mountType: "wall" },
};

expect("Planner3DPlacement bridge must be registered", Boolean(placement));
expect(
  "surface host height should use known host table",
  placement.estimatedSurfaceHeight({ assetKey: "desk" }) === 2.45,
);
expect(
  "surface host fallback should use furniture depth",
  placement.estimatedSurfaceHeight({ assetKey: "unknown", d: 3 }) === 3,
);

const nearestWall = placement.findNearestWallForPoint({ x: 9.8, y: 5 }, room, helpers);
expect("nearest wall should resolve east wall", nearestWall?.wall?.id === "east");
expect("nearest wall offset must be finite", Number.isFinite(nearestWall?.offset));

const nearestWindow = placement.findNearestWindowOpening({ x: 5, y: 0.2 }, room, helpers);
expect("nearest window should resolve north opening", nearestWindow?.wall?.id === "north");
expect("nearest window length should match opening width", nearestWindow?.length === 3);

const normal = placement.interiorWallNormal(room, room.walls[0], helpers);
expect("interior wall normal x must be finite", Number.isFinite(normal?.x));
expect("interior wall normal z must be finite", Number.isFinite(normal?.z));

const wallArt = placement.createFurniturePlacement(
  THREERef,
  {
    assetKey: "wall_art_01",
    id: "art",
    label: "Art",
    mountType: "wall",
    rotation: 0,
    x: 5,
    z: 0.2,
  },
  room,
  registry,
  helpers,
);
expect("wall art placement must be created", Boolean(wallArt));
expect("wall art placement must have a wall normal", Boolean(wallArt?.wallNormal));
expect("wall art y should use wall default elevation", wallArt?.position?.y === 5);
expect("wall art rotation must be finite", Number.isFinite(wallArt?.rotationY));

const curtains = placement.createFurniturePlacement(
  THREERef,
  {
    assetKey: "curtains",
    id: "curtains",
    label: "Curtains",
    mountType: "wall",
    rotation: 0,
    x: 5,
    z: 0.2,
  },
  room,
  registry,
  helpers,
);
expect("curtains should snap to window opening", Boolean(curtains?.windowTarget));
expect(
  "curtain mount height should align above window",
  Math.abs(curtains?.position?.y - 7.35) < 0.001,
);

const surfaceLamp = placement.createFurniturePlacement(
  THREERef,
  {
    assetKey: "lamp_table",
    id: "lamp",
    label: "Lamp",
    mountType: "surface",
    rotation: 0,
    x: 4.1,
    z: 4.1,
  },
  room,
  registry,
  helpers,
);
expect("surface item should choose nearby desk host", surfaceLamp?.host?.assetKey === "desk");
expect("surface item y should use host height", surfaceLamp?.position?.y === 2.45);

const ceilingLamp = placement.createFurniturePlacement(
  THREERef,
  {
    assetKey: "lamp_ceiling",
    id: "ceiling",
    label: "Ceiling",
    mountType: "ceiling",
    rotation: 0,
    x: 6,
    z: 6,
  },
  room,
  registry,
  helpers,
);
expect("ceiling item should clamp near room height", ceilingLamp?.position?.y === 8.45);

const floorItem = placement.createFurniturePlacement(
  THREERef,
  { assetKey: "chair", elevation: 0.25, id: "chair", label: "Chair", rotation: 15, x: 6, z: 7 },
  room,
  registry,
  helpers,
);
expect("floor item should keep finite y", floorItem?.position?.y === 0.25);
expect("floor item should keep finite rotation", Number.isFinite(floorItem?.rotationY));

expect(
  "wall depth offset should be specific for art",
  placement.wallMountedDepthOffset({ assetKey: "wall_art_01" }, registry.wall_art_01) === 0.14,
);
expect(
  "wall facing mode should be stable for wall assets",
  placement.effectiveWallFacingMode({ assetKey: "wall_art_01" }, registry.wall_art_01) ===
    "follow_wall",
);

const root = process.cwd();
const plannerSource = readFileSync(path.join(root, "scripts", "planner3d.js"), "utf8");
const placementSource = readFileSync(
  path.join(root, "scripts", "planner3d", "placement.js"),
  "utf8",
);

for (const name of [
  "findNearestWallForPoint",
  "interiorWallNormal",
  "findNearestWindowOpening",
  "estimatedSurfaceHeight",
  "findNearestSurfaceFurniture",
  "effectiveWallFacingMode",
  "wallMountedDepthOffset",
  "createFurniturePlacement",
]) {
  expect(
    `placement boundary must define ${name}()`,
    new RegExp(`function\\s+${name}\\s*\\(`).test(placementSource),
  );
}

for (const forbiddenName of [
  "findNearestWallForPoint",
  "findNearestWindowOpening",
  "estimatedSurfaceHeight",
  "findNearestSurfaceFurniture",
  "effectiveWallFacingMode",
  "wallMountedDepthOffset",
  "computeFurnitureYaw",
]) {
  expect(
    `planner3d.js must not define ${forbiddenName}()`,
    !new RegExp(`function\\s+${forbiddenName}\\s*\\(`).test(plannerSource),
  );
}

expect(
  "planner3d.js must delegate wall normals",
  /Planner3DPlacement\.interiorWallNormal/.test(plannerSource),
);
expect(
  "planner3d.js must delegate furniture placement",
  /Planner3DPlacement\.createFurniturePlacement/.test(plannerSource),
);

if (errors.length) {
  console.error("3D placement validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D placement validation passed.");
