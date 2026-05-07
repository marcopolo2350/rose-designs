const RUNTIME_MODULES = [
  "./scripts/core/app-config.js",
  "./scripts/core/html.js",
  "./scripts/core/error-reporting.js",
  "./scripts/core/storage-keys.js",
  "./scripts/core/storage-service.js",
  "./scripts/core/project-schema.js",
  "./scripts/planner2d/geometry.js",
  "./scripts/planner2d/furniture-style.js",
  "./scripts/planner2d/reference-overlay.js",
  "./scripts/planner3d/textures.js",
  "./scripts/catalog/placement-rules.js",
  "./scripts/state.js",
  "./scripts/storage.js",
  "./scripts/planner2d/snapping.js",
  "./scripts/core/app-state.js",
  "./scripts/core/history.js",
  "./scripts/ui/shortcuts.js",
  "./scripts/ui.js",
  "./scripts/planner2d.js",
  "./scripts/catalog/manifest.js",
  "./scripts/catalog.js",
  "./scripts/export/filenames.js",
  "./scripts/export/downloads.js",
  "./scripts/export/project-json.js",
  "./scripts/export/png.js",
  "./scripts/export/print.js",
  "./scripts/export/svg.js",
  "./scripts/export/pdf.js",
  "./scripts/planner3d/lifecycle.js",
  "./scripts/planner3d/lighting.js",
  "./scripts/planner3d/camera.js",
  "./scripts/planner3d/materials.js",
  "./scripts/planner3d/model-loader.js",
  "./scripts/planner3d/placement.js",
  "./scripts/planner3d/room-shell.js",
  "./scripts/planner3d/walls.js",
  "./scripts/planner3d.js",
  "./scripts/cloud/supabase.js",
  "./scripts/walkthrough.js",
];

const RUNTIME_VERSION =
  document.querySelector('meta[name="application-version"]')?.getAttribute("content") || "local";

async function loadClassicScript(src) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${src}?v=${RUNTIME_VERSION}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function bootRuntime() {
  const startedAt = performance.now();
  for (const src of RUNTIME_MODULES) {
    await loadClassicScript(src);
  }
  if (typeof window.boot !== "function") {
    throw new Error("Runtime boot function was not registered");
  }
  await window.boot();
  document.body?.setAttribute("data-runtime-ready", "1");
  window.dispatchEvent(new window.CustomEvent("rose:runtime-ready"));
  if (location.hash.includes("dev") || location.search.includes("dev=1")) {
    console.info(
      `[rose-runtime] booted ${RUNTIME_MODULES.length} modules in ${Math.round(performance.now() - startedAt)}ms`,
    );
  }
}

bootRuntime().catch((error) => {
  const payload = window.reportRoseError
    ? window.reportRoseError("runtime-boot", error)
    : { detail: String(error) };
  if (window.showRoseFatalLoadScreen) {
    window.showRoseFatalLoadScreen("The app could not finish loading.", payload.detail);
    return;
  }
  throw error;
});
