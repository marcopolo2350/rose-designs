/**
 * Transitional cloud sync boundary.
 * This file keeps the existing browser-global surface for compatibility while isolating
 * the cloud implementation under scripts/cloud/.
 */

const LEGACY_CLOUD_KEYS = {
  url: "rose_cloud_url",
  key: "rose_cloud_key",
  enabled: "rose_cloud_enabled",
  lastSync: "rose_cloud_last_sync",
};

const CLOUD_KEYS = {
  url: window.storageKey("cloud::url", { global: true }),
  key: window.storageKey("cloud::key", { global: true }),
  enabled: window.storageKey("cloud::enabled", { global: true }),
  lastSync: window.storageKey("cloud::last_sync", { global: true }),
};

let cloudClient = null;
let cloudBusy = false;

function cloudGetConfig() {
  try {
    return {
      url: cloudGetLocal("url") || "",
      key: cloudGetLocal("key") || "",
      enabled: cloudGetLocal("enabled") === "1",
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

function cloudGetLocal(key) {
  const value = localStorage.getItem(CLOUD_KEYS[key]);
  if (value !== null) return value;
  return localStorage.getItem(LEGACY_CLOUD_KEYS[key]);
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
  const last = cloudGetLocal("lastSync");
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

function cloudModalNode(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function cloudField(labelText, input) {
  const group = cloudModalNode("div", "cloud-field");
  const label = cloudModalNode("label", "cloud-label", labelText);
  label.htmlFor = input.id;
  group.append(label, input);
  return group;
}

function cloudButton(id, label, variant = "") {
  const button = cloudModalNode("button", `cloud-btn${variant ? ` ${variant}` : ""}`, label);
  button.id = id;
  button.type = "button";
  return button;
}

function openCloudSyncSettings() {
  const existing = document.getElementById("cloudSyncModal");
  if (existing) existing.remove();
  const cfg = cloudGetConfig();
  const wrap = cloudModalNode("div", "cloud-sync-overlay");
  wrap.id = "cloudSyncModal";
  const card = cloudModalNode("div", "cloud-sync-card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-labelledby", "cloudSyncTitle");

  const title = cloudModalNode("h3", "cloud-title", "Cloud Sync");
  title.id = "cloudSyncTitle";
  const copy = cloudModalNode(
    "p",
    "cloud-copy",
    "Experimental. Syncs rooms to Supabase across devices. Local editing remains the primary source of truth.",
  );

  const status = cloudModalNode("div", "cloud-callout cloud-status");
  status.append("Status: ");
  status.appendChild(cloudModalNode("strong", "", cloudStatusText()));
  const conflict = cloudModalNode(
    "div",
    "cloud-callout cloud-warning",
    "Conflict policy today: timestamp-based merge with validation. This is still experimental and should not be treated as robust collaborative sync.",
  );

  const urlInput = cloudModalNode("input", "cloud-input");
  urlInput.id = "cloudUrl";
  urlInput.type = "text";
  urlInput.placeholder = "https://xxxxx.supabase.co";
  urlInput.value = cfg.url;

  const keyInput = cloudModalNode("input", "cloud-input");
  keyInput.id = "cloudKey";
  keyInput.type = "password";
  keyInput.placeholder = "eyJhbGciOi...";
  keyInput.value = cfg.key;

  const enabledInput = cloudModalNode("input", "");
  enabledInput.id = "cloudEnabled";
  enabledInput.type = "checkbox";
  enabledInput.checked = cfg.enabled;
  const enabledLabel = cloudModalNode("label", "cloud-checkbox");
  enabledLabel.append(
    enabledInput,
    cloudModalNode("span", "", "Enable cloud sync on save and load"),
  );

  const result = cloudModalNode("div", "cloud-test-result");
  result.id = "cloudTestResult";

  const actions = cloudModalNode("div", "cloud-actions");
  const testBtn = cloudButton("cloudTestBtn", "Test connection");
  const disableBtn = cloudButton("cloudDisableBtn", "Disable");
  const cancelBtn = cloudButton("cloudCancelBtn", "Cancel");
  const saveBtn = cloudButton("cloudSaveBtn", "Save", "primary");
  actions.append(testBtn, disableBtn, cancelBtn, saveBtn);

  card.append(
    title,
    copy,
    status,
    conflict,
    cloudField("Supabase project URL", urlInput),
    cloudField("Anon public key", keyInput),
    enabledLabel,
    result,
    actions,
  );
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  const setResult = (message, ok) => {
    result.textContent = message;
    result.className = `cloud-test-result ${ok == null ? "" : ok ? "ok" : "fail"}`.trim();
  };
  wrap.addEventListener("click", (event) => {
    if (event.target === wrap) close();
  });
  wrap.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...card.querySelectorAll("button,input")].filter(
      (node) => !node.disabled && node.offsetParent !== null,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      event.stopPropagation();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      event.stopPropagation();
      first.focus();
    }
  });
  cancelBtn.addEventListener("click", close);
  disableBtn.addEventListener("click", () => {
    cloudSetConfig("", "", false);
    if (typeof toast === "function") toast("Cloud sync disabled");
    close();
  });
  testBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    const key = keyInput.value.trim();
    cloudSetConfig(url, key, true);
    setResult("Testing...", null);
    const test = await cloudTestConnection();
    setResult(test.msg, test.ok);
  });
  saveBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    const key = keyInput.value.trim();
    const enabled = enabledInput.checked;
    cloudSetConfig(url, key, enabled);
    if (typeof toast === "function") toast(enabled ? "Cloud sync enabled" : "Cloud sync disabled");
    close();
  });
  urlInput.focus();
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
