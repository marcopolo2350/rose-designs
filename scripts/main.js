const RUNTIME_MODULES = [
  "./scripts/core/app-config.js",
  "./scripts/core/error-reporting.js",
  "./scripts/core/project-schema.js",
  "./scripts/state.js",
  "./scripts/storage.js",
  "./scripts/core/app-state.js",
  "./scripts/ui/shortcuts.js",
  "./scripts/ui.js",
  "./scripts/planner2d.js",
  "./scripts/catalog.js",
  "./scripts/export.js",
  "./scripts/planner3d.js",
  "./scripts/core/history.js",
  "./scripts/cloud/supabase.js",
  "./scripts/walkthrough.js",
];

const RUNTIME_VERSION = "20260426";

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
