globalThis.window = {
  APP_VERSION: "schema-test",
};

await import("../core/project-schema.js");

const schema = globalThis.window.RoseProjectSchema;
const validRoom = {
  id: "room-1",
  name: "Living Room",
  polygon: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
  furniture: [{ id: "furn-1", label: "Sofa", x: 3, y: 4, w: 5, d: 2, h: 3 }],
};

function expectPass(label, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`${label} failed unexpectedly: ${error.message}`);
    process.exit(1);
  }
}

function expectFail(label, fn, expectedText) {
  try {
    fn();
  } catch (error) {
    if (!String(error.message).includes(expectedText)) {
      console.error(`${label} failed with the wrong error: ${error.message}`);
      process.exit(1);
    }
    return;
  }
  console.error(`${label} passed unexpectedly.`);
  process.exit(1);
}

expectPass("valid project document", () => {
  const result = schema.validateImportedProjectDocument({ projects: [validRoom] });
  if (result.rooms.length !== 1) throw new Error("Expected one room");
});

expectPass("legacy room array document", () => {
  const result = schema.validateImportedProjectDocument([validRoom]);
  if (result.document.schemaVersion !== schema.APP_SCHEMA_VERSION) {
    throw new Error("Expected legacy array to be stamped");
  }
});

expectPass("export document metadata", () => {
  const doc = schema.buildExportDocument([validRoom], "rose");
  if (!doc.schemaVersion || !doc.appVersion || !doc.exportedAt || doc.activeProfile !== "rose") {
    throw new Error("Expected export metadata");
  }
});

expectFail(
  "invalid polygon point",
  () =>
    schema.validateImportedProjectDocument({
      projects: [{ ...validRoom, polygon: [{ x: 1, y: 2 }] }],
    }),
  "at least three points",
);

expectFail(
  "unsafe room text",
  () =>
    schema.validateImportedProjectDocument({ projects: [{ ...validRoom, name: "Bad\u0000Name" }] }),
  "unsupported control characters",
);

expectFail(
  "invalid furniture geometry",
  () =>
    schema.validateImportedProjectDocument({
      projects: [{ ...validRoom, furniture: [{ id: "furn-1", label: "Sofa", x: "nope" }] }],
    }),
  "must be finite",
);

expectFail(
  "unsafe prototype key",
  () =>
    schema.validateImportedProjectDocument(
      JSON.parse(
        '{"projects":[{"id":"room-1","name":"Room","polygon":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1}],"furniture":[{"id":"furn-1","label":"Sofa","__proto__":{"polluted":true}}]}]}',
      ),
    ),
  "unsafe key",
);

expectFail(
  "unsafe constructor key",
  () =>
    schema.validateImportedProjectDocument(
      JSON.parse(
        '{"projects":[{"id":"room-1","name":"Room","polygon":[{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1}],"constructor":{"prototype":{"polluted":true}}}]}',
      ),
    ),
  "unsafe key",
);

console.log("Project schema validation passed.");
