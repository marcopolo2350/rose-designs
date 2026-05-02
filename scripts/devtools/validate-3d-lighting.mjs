globalThis.window = globalThis;

await import("../planner3d/lighting.js");

const lighting = window.Planner3DLighting;
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

expect("Planner3DLighting bridge must be registered", Boolean(lighting));
expect("night HDRI should use evening environment", lighting.hdriForTimeOfDay(0.05) === "evening");
expect(
  "morning HDRI should use daylight environment",
  lighting.hdriForTimeOfDay(0.3) === "daylight",
);
expect("golden hour HDRI should use warm environment", lighting.hdriForTimeOfDay(0.72) === "warm");
expect("noon sky must not collapse to white", lighting.skyColor(0.5).toLowerCase() !== "#ffffff");
expect("noon exposure should stay controlled", lighting.exposureForTimeOfDay(0.5, false) <= 1.12);
expect(
  "photo exposure may lift but should stay bounded",
  lighting.exposureForTimeOfDay(0.5, true) <= 1.2,
);
expect(
  "noon should be brighter than night",
  lighting.directionalIntensityForTimeOfDay(0.5) > lighting.directionalIntensityForTimeOfDay(0.02),
);
expect(
  "hemisphere light should be brighter at noon than night",
  lighting.hemisphereIntensityForTimeOfDay(0.5) > lighting.hemisphereIntensityForTimeOfDay(0.02),
);

if (errors.length) {
  console.error("3D lighting validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D lighting validation passed.");
