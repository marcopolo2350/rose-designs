/**
 * Transitional cloud sync boundary.
 * This file keeps the existing browser-global surface for compatibility while isolating
 * the cloud implementation under scripts/cloud/.
 */

const CLOUD_KEYS = {
  url: "rose_cloud_url",
  key: "rose_cloud_key",
  enabled: "rose_cloud_enabled",
  lastSync: "rose_cloud_last_sync",
};

let cloudClient = null;
let cloudBusy = false;

function cloudGetConfig() {
  try {
    return {
      url: localStorage.getItem(CLOUD_KEYS.url) || "",
      key: localStorage.getItem(CLOUD_KEYS.key) || "",
      enabled: localStorage.getItem(CLOUD_KEYS.enabled) === "1",
    };
  } catch (error) {
    window.reportRoseRecoverableError?.("cloud-config-read", error);
    return { url: "", key: "", enabled: false };
  }
}

function cloudSetConfig(url, key, enabled) {
  try {
    localStorage.setItem(CLOUD_KEYS.url, url || "");
    localStorage.setItem(CLOUD_KEYS.key, key || "");
    localStorage.setItem(CLOUD_KEYS.enabled, enabled ? "1" : "0");
  } catch (error) {
    window.reportRoseRecoverableError?.("cloud-config-write", error);
    return;
  }
  cloudClient = null;
}

function cloudEscapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cloudValidateProjectPayload(payload) {
  if (!window.RoseProjectSchema) return payload;
  return window.RoseProjectSchema.validateImportedProjectDocument({ projects: [payload] }).rooms[0];
}

async function cloudEnsureClient() {
  if (cloudClient) return cloudClient;
  const { url, key, enabled } = cloudGetConfig();
  if (!enabled || !url || !key) {
    return null;
  }
  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load supabase-js"));
      document.head.appendChild(s);
    });
  }
  cloudClient = window.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cloudClient;
}

async function cloudSignInAnonymous() {
  const client = await cloudEnsureClient();
  if (!client) return null;
  const existing = await client.auth.getSession();
  if (existing?.data?.session) return existing.data.session;
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw new Error(error.message);
  return data.session;
}

async function cloudPullProjects() {
  if (cloudBusy) return [];
  const client = await cloudEnsureClient();
  if (!client) return [];
  await cloudSignInAnonymous();
  const profile = typeof activeProfile !== "undefined" ? activeProfile : "default";
  cloudBusy = true;
  try {
    const { data, error } = await client
      .from("rose_projects")
      .select("id,payload,updated_at,deleted")
      .eq("profile", profile);
    if (error) throw new Error(error.message);
    const rows = (data || []).filter((row) => !row.deleted).map((row) => row.payload);
    return rows
      .map((payload) => {
        try {
          return cloudValidateProjectPayload(payload);
        } catch (error) {
          window.reportRoseRecoverableError?.("cloud-pull-invalid-payload", error);
          return null;
        }
      })
      .filter(Boolean);
  } finally {
    cloudBusy = false;
  }
}

async function cloudPushProjects(localProjects) {
  if (cloudBusy) return false;
  const client = await cloudEnsureClient();
  if (!client) return false;
  await cloudSignInAnonymous();
  const profile = typeof activeProfile !== "undefined" ? activeProfile : "default";
  const rows = (localProjects || []).map((project) => {
    const payload = cloudValidateProjectPayload(project);
    return {
      id: payload.id,
      profile,
      payload,
      updated_at: new Date(payload.updatedAt || Date.now()).toISOString(),
      deleted: false,
    };
  });
  if (!rows.length) return true;
  cloudBusy = true;
  try {
    const { error } = await client.from("rose_projects").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
    localStorage.setItem(CLOUD_KEYS.lastSync, new Date().toISOString());
    return true;
  } finally {
    cloudBusy = false;
  }
}

function cloudMerge(localList, remoteList) {
  const byId = new Map();
  (localList || []).forEach((project) => byId.set(project.id, project));
  (remoteList || []).forEach((remoteProject) => {
    const localProject = byId.get(remoteProject.id);
    if (!localProject) {
      byId.set(remoteProject.id, remoteProject);
      return;
    }
    byId.set(
      remoteProject.id,
      (remoteProject.updatedAt || 0) > (localProject.updatedAt || 0) ? remoteProject : localProject,
    );
  });
  return [...byId.values()];
}

async function cloudSyncAfterSave() {
  const { enabled } = cloudGetConfig();
  if (!enabled || typeof projects === "undefined") return;
  try {
    await cloudPushProjects(projects);
  } catch (error) {
    window.reportRoseError?.("cloud-sync-after-save", error);
  }
}

async function cloudSyncOnLoad(localProjects) {
  const { enabled } = cloudGetConfig();
  if (!enabled) return localProjects || [];
  try {
    const remoteProjects = await cloudPullProjects();
    return cloudMerge(localProjects || [], remoteProjects || []);
  } catch (error) {
    window.reportRoseError?.("cloud-sync-on-load", error);
    return localProjects || [];
  }
}

function cloudStatusText() {
  const { url, key, enabled } = cloudGetConfig();
  if (!url || !key) return "Not configured";
  if (!enabled) return "Configured (disabled)";
  const last = localStorage.getItem(CLOUD_KEYS.lastSync);
  return last ? `Synced ${new Date(last).toLocaleString()}` : "Enabled (not yet synced)";
}

async function cloudTestConnection() {
  try {
    const client = await cloudEnsureClient();
    if (!client) return { ok: false, msg: "Missing URL or key, or library failed to load" };
    const { error } = await client.from("rose_projects").select("id").limit(1);
    if (error) return { ok: false, msg: error.message };
    return { ok: true, msg: "Connection OK" };
  } catch (error) {
    return { ok: false, msg: String(error.message || error) };
  }
}

function openCloudSyncSettings() {
  const existing = document.getElementById("cloudSyncModal");
  if (existing) existing.remove();
  const cfg = cloudGetConfig();
  const wrap = document.createElement("div");
  wrap.id = "cloudSyncModal";
  wrap.style.cssText =
    "position:fixed;inset:0;background:rgba(20,16,12,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
  wrap.innerHTML = `
    <div style="background:#FDFAF5;border:1px solid #E6D8CC;border-radius:18px;max-width:560px;width:100%;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.22);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#332922;" role="dialog" aria-modal="true" aria-labelledby="cloudSyncTitle">
      <h3 id="cloudSyncTitle" style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;">Cloud Sync</h3>
      <p style="margin:0 0 16px;color:#7B6B5E;font-size:13px;line-height:1.5;">Experimental. Syncs rooms to Supabase across devices. Local editing remains the primary source of truth.</p>
      <div style="font-size:12px;background:#F5EEE3;padding:10px 12px;border-radius:8px;margin-bottom:16px;color:#5A4C40;">Status: <strong>${cloudEscapeAttribute(cloudStatusText())}</strong></div>
      <div style="font-size:12px;background:#FFF4E8;padding:10px 12px;border-radius:8px;margin-bottom:16px;color:#7A5531;">Conflict policy today: timestamp-based merge with validation. This is still experimental and should not be treated as robust collaborative sync.</div>
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Supabase project URL</label>
      <input id="cloudUrl" type="text" placeholder="https://xxxxx.supabase.co" value="${cloudEscapeAttribute(cfg.url)}" style="width:100%;padding:10px 12px;border:1px solid #D9CBBF;border-radius:8px;font-family:inherit;font-size:13px;margin-bottom:14px;box-sizing:border-box;">
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Anon public key</label>
      <input id="cloudKey" type="password" placeholder="eyJhbGciOi..." value="${cloudEscapeAttribute(cfg.key)}" style="width:100%;padding:10px 12px;border:1px solid #D9CBBF;border-radius:8px;font-family:inherit;font-size:13px;margin-bottom:14px;box-sizing:border-box;">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:20px;">
        <input id="cloudEnabled" type="checkbox" ${cfg.enabled ? "checked" : ""}>
        <span>Enable cloud sync on save and load</span>
      </label>
      <div id="cloudTestResult" style="font-size:12px;margin-bottom:14px;min-height:16px;"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <button id="cloudTestBtn" type="button" style="padding:10px 16px;border-radius:8px;border:1px solid #D9CBBF;background:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Test connection</button>
        <button id="cloudDisableBtn" type="button" style="padding:10px 16px;border-radius:8px;border:1px solid #D9CBBF;background:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Disable</button>
        <button id="cloudCancelBtn" type="button" style="padding:10px 16px;border-radius:8px;border:1px solid #D9CBBF;background:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Cancel</button>
        <button id="cloudSaveBtn" type="button" style="padding:10px 16px;border-radius:8px;border:none;background:#C48C86;color:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Save</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  wrap.addEventListener("click", (event) => {
    if (event.target === wrap) close();
  });
  document.getElementById("cloudCancelBtn")?.addEventListener("click", close);
  document.getElementById("cloudDisableBtn")?.addEventListener("click", () => {
    cloudSetConfig("", "", false);
    if (typeof toast === "function") toast("Cloud sync disabled");
    close();
  });
  document.getElementById("cloudTestBtn")?.addEventListener("click", async () => {
    const url = document.getElementById("cloudUrl").value.trim();
    const key = document.getElementById("cloudKey").value.trim();
    cloudSetConfig(url, key, true);
    const result = document.getElementById("cloudTestResult");
    result.textContent = "Testing...";
    result.style.color = "#7B6B5E";
    const test = await cloudTestConnection();
    result.textContent = test.msg;
    result.style.color = test.ok ? "#3A7A3A" : "#B14A3A";
  });
  document.getElementById("cloudSaveBtn")?.addEventListener("click", () => {
    const url = document.getElementById("cloudUrl").value.trim();
    const key = document.getElementById("cloudKey").value.trim();
    const enabled = document.getElementById("cloudEnabled").checked;
    cloudSetConfig(url, key, enabled);
    if (typeof toast === "function") toast(enabled ? "Cloud sync enabled" : "Cloud sync disabled");
    close();
  });
}

window.openCloudSyncSettings = openCloudSyncSettings;
window.cloudSync = {
  afterSave: cloudSyncAfterSave,
  getConfig: cloudGetConfig,
  merge: cloudMerge,
  onLoad: cloudSyncOnLoad,
  pull: cloudPullProjects,
  push: cloudPushProjects,
  setConfig: cloudSetConfig,
  statusText: cloudStatusText,
  testConnection: cloudTestConnection,
  validatePayload: cloudValidateProjectPayload,
};
