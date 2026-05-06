import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

globalThis.window = globalThis;

await import("../planner3d/lifecycle.js");

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const planner3d = readFileSync(path.join(currentDir, "../planner3d.js"), "utf8");
if (/innerHTML\s*=\s*(["'])\1/.test(planner3d)) {
  throw new Error(
    "planner3d.js must clear 3D containers through RoseHTML.clear(), not innerHTML=''",
  );
}

const lifecycle = window.Planner3DLifecycle;
let textureDisposed = false;
let materialDisposed = false;
let geometryDisposed = false;
let passDisposed = false;
let rendererDisposed = false;
let contextLost = false;
let removedChild = false;
const removedEvents = [];
const rendererDiagnostics = { debug: { checkShaderErrors: true } };

const material = {
  map: { dispose: () => (textureDisposed = true) },
  dispose: () => (materialDisposed = true),
};
const mesh = {
  geometry: { dispose: () => (geometryDisposed = true) },
  material,
};
const scene = {
  traverse(callback) {
    callback(mesh);
  },
};

lifecycle.disposeSceneGraph(scene);
if (!textureDisposed || !materialDisposed || !geometryDisposed) {
  throw new Error("disposeSceneGraph did not dispose geometry, texture, and material");
}

lifecycle.disposeComposer({ passes: [{ dispose: () => (passDisposed = true) }] });
if (!passDisposed) {
  throw new Error("disposeComposer did not dispose passes");
}

const renderer = {
  _listeners: {
    el: {
      removeEventListener: (name) => removedEvents.push(name),
    },
    pDown() {},
    pUp() {},
    pMove() {},
    pCancel() {},
  },
  dispose: () => (rendererDisposed = true),
  forceContextLoss: () => (contextLost = true),
  domElement: {
    parentNode: {
      removeChild: () => (removedChild = true),
    },
  },
};

lifecycle.disposeRenderer(renderer);
if (!rendererDisposed || !contextLost || !removedChild || renderer._listeners !== null) {
  throw new Error("disposeRenderer did not fully clean renderer");
}
if (
  !["pointerdown", "pointerup", "pointermove", "pointercancel", "lostpointercapture"].every(
    (name) => removedEvents.includes(name),
  )
) {
  throw new Error("disposeRenderer did not remove expected pointer listeners");
}

lifecycle.configureRendererDiagnostics(rendererDiagnostics, { devMode: false });
if (rendererDiagnostics.debug.checkShaderErrors !== false) {
  throw new Error("configureRendererDiagnostics did not disable shader checks outside dev mode");
}
lifecycle.configureRendererDiagnostics(rendererDiagnostics, { devMode: true });
if (rendererDiagnostics.debug.checkShaderErrors !== true) {
  throw new Error("configureRendererDiagnostics did not enable shader checks in dev mode");
}

console.log("3D lifecycle validation passed.");
