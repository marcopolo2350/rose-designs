(function initErrorReporting() {
  function isDevMode() {
    return location.hash.includes("dev") || location.search.includes("dev=1");
  }

  function reportError(context, error, options = {}) {
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error || "Unknown error");
    const payload = { context, detail, dev: isDevMode(), ...options };
    console.error(`[rose-error] ${context}`, error);
    return payload;
  }

  function showFatalLoadScreen(message, detail = "") {
    const title = window.APP_CONFIG?.appName || "Application";
    const root = document.createElement("div");
    root.setAttribute("role", "alert");
    root.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:99999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "background:#f7f2eb",
      "color:#332922",
      "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    ].join(";");
    root.innerHTML =
      `<div style="max-width:540px;background:#fffdf9;border:1px solid #e6d8cc;border-radius:16px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.16)">` +
      `<h1 style="margin:0 0 8px;font-size:24px;font-family:Georgia,serif">${title}</h1>` +
      `<p style="margin:0 0 10px;font-size:15px;font-weight:700">${message}</p>` +
      `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#6d5b4d">The app did not finish loading. Refresh once. If it still fails, use dev mode and copy the console error for diagnosis.</p>` +
      (detail
        ? `<pre style="margin:0;padding:12px;border-radius:10px;background:#f5eee6;color:#5a4a3e;font-size:12px;overflow:auto;white-space:pre-wrap">${detail}</pre>`
        : "") +
      `</div>`;
    document.body.innerHTML = "";
    document.body.appendChild(root);
  }

  window.reportRoseError = reportError;
  window.showRoseFatalLoadScreen = showFatalLoadScreen;
})();
