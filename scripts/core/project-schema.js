(function initProjectSchema() {
  const APP_SCHEMA_VERSION = 2;
  const DANGEROUS_IMPORT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function ensureRoomRecordShape(room) {
    assertNoDangerousImportKeys(room, "room");
    if (!room || typeof room !== "object" || Array.isArray(room)) {
      throw new Error("Each imported room must be an object");
    }
    validateStringFields(
      room,
      ["id", "projectId", "projectName", "name", "floorId", "floorLabel"],
      160,
    );
    validateStringFields(room, ["optionName"], 220);
    validateStringFields(room, ["optionNotes"], 2000);
    validatePolygon(room.polygon);
    for (const field of [
      "walls",
      "openings",
      "structures",
      "furniture",
      "dimensionAnnotations",
      "textAnnotations",
    ]) {
      if (room[field] !== undefined && !Array.isArray(room[field])) {
        throw new Error(`Imported room field ${field} must be an array when present`);
      }
    }
    if (Array.isArray(room.furniture)) {
      room.furniture.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          throw new Error(`Furniture ${index + 1} must be an object`);
        }
        validateStringFields(item, ["id", "label", "assetKey", "modelPath", "mountType"], 220);
        for (const numericField of ["x", "y", "z", "w", "d", "h", "rot", "elevation"]) {
          if (item[numericField] !== undefined && !Number.isFinite(Number(item[numericField]))) {
            throw new Error(`Furniture ${index + 1} field ${numericField} must be finite`);
          }
        }
      });
    }
    return room;
  }

  function validateStringFields(record, fields, maxLength) {
    for (const field of fields) {
      const value = record[field];
      if (value === undefined || value === null) continue;
      if (typeof value !== "string") {
        throw new Error(`Field ${field} must be a string`);
      }
      if (value.length > maxLength) {
        throw new Error(`Field ${field} is too long`);
      }
      if (hasUnsupportedControlCharacters(value)) {
        throw new Error(`Field ${field} contains unsupported control characters`);
      }
    }
  }

  function assertNoDangerousImportKeys(value, path) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => assertNoDangerousImportKeys(item, `${path}[${index}]`));
      return;
    }
    for (const key of Object.keys(value)) {
      if (DANGEROUS_IMPORT_KEYS.has(key)) {
        throw new Error(`Imported JSON contains unsafe key ${path}.${key}`);
      }
      assertNoDangerousImportKeys(value[key], `${path}.${key}`);
    }
  }

  function hasUnsupportedControlCharacters(value) {
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31)) {
        return true;
      }
    }
    return false;
  }

  function validatePolygon(polygon) {
    if (!Array.isArray(polygon)) {
      throw new Error("Imported room is missing a polygon array");
    }
    if (polygon.length < 3) {
      throw new Error("Imported room polygon must have at least three points");
    }
    polygon.forEach((point, index) => {
      if (!point || typeof point !== "object" || Array.isArray(point)) {
        throw new Error(`Polygon point ${index + 1} must be an object`);
      }
      if (!Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) {
        throw new Error(`Polygon point ${index + 1} must have finite x and y values`);
      }
    });
  }

  function ensureProjectDocumentShape(parsed) {
    assertNoDangerousImportKeys(parsed, "project");
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
    assertNoDangerousImportKeys(parsed, "project");
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
    ensureRoomRecordShape,
    stampProjectDocument,
    validateImportedProjectDocument,
  };
})();
