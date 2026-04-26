(function initProjectSchema() {
  const APP_SCHEMA_VERSION = 2;

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function ensureRoomRecordShape(room) {
    if (!room || typeof room !== "object" || Array.isArray(room)) {
      throw new Error("Each imported room must be an object");
    }
    if (!Array.isArray(room.polygon)) {
      throw new Error("Imported room is missing a polygon array");
    }
    return room;
  }

  function ensureProjectDocumentShape(parsed) {
    if (Array.isArray(parsed)) {
      return {
        schemaVersion: APP_SCHEMA_VERSION,
        appVersion: window.APP_VERSION || "0.0.0",
        exportedAt: nowIso(),
        projects: parsed,
      };
    }
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Project import must be a JSON object or array");
    }
    if (!Array.isArray(parsed.projects)) {
      throw new Error("Project import is missing a projects array");
    }
    return parsed;
  }

  function stampProjectDocument(doc) {
    const next = cloneJson(doc);
    next.schemaVersion = Number.isFinite(next.schemaVersion)
      ? next.schemaVersion
      : APP_SCHEMA_VERSION;
    next.appVersion = next.appVersion || window.APP_VERSION || "0.0.0";
    next.exportedAt = next.exportedAt || nowIso();
    return next;
  }

  function validateImportedProjectDocument(parsed) {
    const doc = stampProjectDocument(ensureProjectDocumentShape(parsed));
    const rooms = doc.projects.map((room, index) => {
      try {
        return ensureRoomRecordShape(cloneJson(room));
      } catch (error) {
        throw new Error(`Room ${index + 1}: ${error.message}`);
      }
    });
    return { document: doc, rooms };
  }

  function buildExportDocument(projects, activeProfile) {
    return stampProjectDocument({
      schemaVersion: APP_SCHEMA_VERSION,
      appVersion: window.APP_VERSION || "0.0.0",
      exportedAt: nowIso(),
      activeProfile: activeProfile || "default",
      projects: cloneJson(projects || []),
    });
  }

  window.RoseProjectSchema = {
    APP_SCHEMA_VERSION,
    buildExportDocument,
    ensureProjectDocumentShape,
    stampProjectDocument,
    validateImportedProjectDocument,
  };
})();
