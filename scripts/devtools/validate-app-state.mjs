globalThis.window = globalThis;
globalThis.projects = [];
globalThis.curRoom = null;
globalThis.sel = { type: "furniture", idx: 3 };
globalThis.tool = "wall";
globalThis.multiSelFurnitureIds = ["a", "b"];

let drew = false;
let rebuilt = false;
globalThis.draw = () => {
  drew = true;
};
globalThis.scheduleRebuild3D = () => {
  rebuilt = true;
};

await import("../core/app-state.js");

const room = { id: "room-1" };
if (window.appState.dispatch({ type: "room:set-current", room }) !== room) {
  throw new Error("room:set-current did not set current room");
}
if (window.appState.getCurrentRoom() !== room) {
  throw new Error("getCurrentRoom did not return current room");
}

window.appState.dispatch({ type: "selection:clear" });
if (globalThis.sel.type !== null || globalThis.multiSelFurnitureIds.length !== 0) {
  throw new Error("selection:clear did not clear selection state");
}

if (window.appState.dispatch({ type: "editor:set-tool", tool: "door" }) !== "door") {
  throw new Error("editor:set-tool did not set tool");
}

window.appState.dispatch({ type: "render:request" });
if (!drew || !window.appState.runtime.lastRenderedAt) {
  throw new Error("render:request did not render");
}

window.appState.dispatch({ type: "3d:schedule-rebuild" });
if (!rebuilt) {
  throw new Error("3d:schedule-rebuild did not call rebuild");
}

if (!window.appState.dispatch({ type: "dirty:set", value: true })) {
  throw new Error("dirty:set did not mark dirty");
}
window.appState.dispatch({ type: "saved:mark", timestamp: 123 });
if (window.appState.runtime.dirty || window.appState.runtime.lastSavedAt !== 123) {
  throw new Error("saved:mark did not mark saved");
}

let rejectedUnknown = false;
try {
  window.appState.dispatch({ type: "unknown:test" });
} catch (error) {
  rejectedUnknown = String(error.message).includes("Unknown appState action");
}
if (!rejectedUnknown) {
  throw new Error("dispatch did not reject unknown action");
}

console.log("App state validation passed.");
