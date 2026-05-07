// ── EDITOR ──
async function openEd(room) {
  normalizeRoom(room);
  // Persist the previous room's undo stack before navigating away
  if (curRoom && curRoom.id !== room.id) persistRoomHistory();
  curRoom = room;
  if (window.appState) window.appState.setCurrentRoom(room);
  activeProjectFloorId = room.floorId || "floor_1";
  sel = { type: null, idx: -1 };
  tool = "select";
  undoSt = [];
  redoSt = [];
  multiSelFurnitureIds = [];
  is3D = false;
  drawMode = false;
  // Reset panel state so every room opens on the Build tab with design presets collapsed
  roomPanelGroup = "build";
  designPresetPanelOpen = false;
  pendingDesignPresetId = "";
  document.querySelectorAll(".scr").forEach((s) => s.classList.remove("on"));
  document.getElementById("scrEd").classList.add("on");
  document.getElementById("edT").textContent =
    room.optionName && room.optionName !== "Main" ? `${room.name} · ${room.optionName}` : room.name;
  document.getElementById("dBar").classList.remove("on");
  document.getElementById("mTbar").style.display = "";
  document.getElementById("edT").textContent =
    `${room.projectName && room.projectName !== room.name ? `${room.projectName} · ` : ""}${room.name}${room.optionName && room.optionName !== "Main" ? ` · ${room.optionName}` : ""}${room.floorLabel ? ` · ${room.floorLabel}` : ""}`;
  document.getElementById("threeC").classList.remove("on");
  document.getElementById("b3d").classList.remove("on");
  document.getElementById("vLbl").textContent = "2D Plan";
  document.getElementById("camBtns").classList.remove("on");
  document.getElementById("walkHint").classList.remove("on");
  document
    .querySelectorAll(".tb")
    .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
  stop3D();
  initCan();
  await restoreRoomHistory(room);
  sel = { type: null, idx: -1 };
  panelHidden = !!(typeof isTouchUi === "function" && isTouchUi() && window.innerWidth <= 760);
  showP();
  try {
    if (!getLocal("3d_hint")) setLocal("3d_hint", "1");
  } catch (error) {
    window.reportRoseRecoverableError?.("3D hint storage update failed", error);
  }
  if (window.appState) window.appState.markDirty(false);
  if (typeof startTut === "function") startTut();
}
function exitEd() {
  persistRoomHistory();
  savePrj();
  stop3D();
  if (resH) {
    window.removeEventListener("resize", resH);
    resH = null;
  }
  curRoom = null;
  activeProjectFloorId = null;
  drawMode = false;
  multiSelFurnitureIds = [];
  if (window.appState) window.appState.setCurrentRoom(null);
  document.querySelectorAll(".scr").forEach((s) => s.classList.remove("on"));
  document.getElementById("scrHome").classList.add("on");
  renderHome();
}
function savePrj() {
  if (!curRoom) return;
  persistRoomHistory();
  syncCurrentRoomRecord(true);
}

// ── CANVAS ──
function initCan() {
  const w = document.getElementById("cWrap");
  canvas = document.getElementById("edCan");
  ctx = canvas.getContext("2d");
  function rs() {
    canvas.width = w.clientWidth;
    canvas.height = w.clientHeight;
    if (!drawMode && curRoom && curRoom.polygon.length) autoFit();
    draw();
  }
  if (resH) window.removeEventListener("resize", resH);
  resH = rs;
  window.addEventListener("resize", resH);
  rs();
  canvas.removeEventListener("pointerdown", onD);
  canvas.removeEventListener("pointermove", onM);
  canvas.removeEventListener("pointerup", onU);
  canvas.removeEventListener("wheel", onW);
  canvas.addEventListener("pointerdown", onD);
  canvas.addEventListener("pointermove", onM);
  canvas.addEventListener("pointerup", onU);
  canvas.addEventListener("wheel", onW, { passive: false });
}
function autoFit() {
  if (!curRoom || !canvas || !curRoom.polygon.length) return;
  // Multi-room home layout: fit the whole floor if there's more than one room,
  // so sibling-room ghosts stay in frame around the active room.
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let siblings = [curRoom];
  try {
    if (typeof currentFloorRooms === "function") {
      const s = currentFloorRooms(curRoom, curRoom.floorId);
      if (s && s.length) siblings = s;
    }
  } catch (error) {
    window.reportRoseRecoverableError?.("Floor room bounds lookup failed", error);
  }
  siblings.forEach((room) => {
    if (!room || !room.polygon) return;
    room.polygon.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });
  if (!isFinite(minX)) {
    const b = getRoomBounds2D(curRoom);
    minX = b.x0;
    maxX = b.x1;
    minY = b.y0;
    maxY = b.y1;
  }
  const width = Math.max(1, maxX - minX),
    height = Math.max(1, maxY - minY),
    cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2,
    pd = 64;
  const nextScale = Math.min(
    Math.max(120, canvas.width - pd * 2) / width,
    Math.max(120, canvas.height - pd * 2) / height,
    40,
  );
  vScale = Math.max(5, nextScale);
  vOff.x = canvas.width / 2 - cx * vScale;
  vOff.y = canvas.height / 2 - cy * vScale;
}
function tS(p) {
  return { x: p.x * vScale + vOff.x, y: p.y * vScale + vOff.y };
}
function tW(x, y) {
  return { x: (x - vOff.x) / vScale, y: (y - vOff.y) / vScale };
}
function floorPattern2D(mat) {
  // S=96px tile ≈ 4.8ft at vScale=20. Planks are 8px tall = ~5" wide — realistic hardwood strip.
  const S = 96;
  const can = document.createElement("canvas");
  can.width = S;
  can.height = S;
  const c = can.getContext("2d");
  const preset = FLOOR_TYPES.find((f) => f.id === (mat.floorType || "light_oak")) || FLOOR_TYPES[0];
  const baseColor = mat.floor || preset.color;
  c.fillStyle = baseColor;
  c.fillRect(0, 0, S, S);
  if (preset.family === "wood") {
    // 8px plank strip + 1px joint = 9px per row → ~10 rows per 96px tile, looks like fine hardwood
    const pH = 8,
      jH = 1;
    const step = pH + jH;
    for (let y = 0; y < S; y += step) {
      const row = Math.floor(y / step);
      // Subtle plank-to-plank brightness variation
      c.fillStyle = row % 2 === 0 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)";
      c.fillRect(0, y, S, pH);
      // Hairline row joint
      c.fillStyle = "rgba(20,12,4,.32)";
      c.fillRect(0, y + pH, S, jH);
      // Plank end joints — staggered every 3 rows, segments ≈ 48px (2.4ft long)
      const phase = [0, S / 2, S / 4][row % 3];
      for (let x = phase; x < S + 1; x += S / 2) {
        c.fillStyle = "rgba(20,12,4,.20)";
        c.fillRect(x % S, y, 1, pH);
      }
      // Very faint grain streak
      c.strokeStyle = "rgba(255,255,255,.05)";
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo((row * 17) % S, y + 2);
      c.lineTo((row * 17 + 40) % S, y + pH - 2);
      c.stroke();
    }
  } else if (preset.family === "tile") {
    // 24px tile ≈ 14.4 inch tile at vScale=20
    const T = 24;
    for (let y = 0; y < S; y += T)
      for (let x = 0; x < S; x += T) {
        const alt = (x / T + y / T) % 2 === 0;
        c.fillStyle = alt ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)";
        c.fillRect(x + 1, y + 1, T - 2, T - 2);
      }
    // Grout lines — warm grey, 2px
    c.strokeStyle = "rgba(138,124,108,.75)";
    c.lineWidth = 2;
    for (let i = 0; i <= S; i += T) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, S);
      c.stroke();
      c.beginPath();
      c.moveTo(0, i);
      c.lineTo(S, i);
      c.stroke();
    }
  } else if (preset.family === "checker") {
    const T = 24;
    for (let y = 0; y < S; y += T)
      for (let x = 0; x < S; x += T) {
        c.fillStyle = (x / T + y / T) % 2 === 0 ? baseColor : preset.accent || "#888";
        c.fillRect(x, y, T, T);
        c.fillStyle = "rgba(255,255,255,.04)";
        c.fillRect(x + 2, y + 2, T - 4, T - 4);
      }
    c.strokeStyle = "rgba(0,0,0,.18)";
    c.lineWidth = 1.5;
    for (let i = 0; i <= S; i += T) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, S);
      c.stroke();
      c.beginPath();
      c.moveTo(0, i);
      c.lineTo(S, i);
      c.stroke();
    }
  } else {
    // Concrete — subtle surface variation, no obvious grid
    for (let i = 0; i < 20; i++) {
      c.fillStyle = `rgba(255,255,255,${0.02 + (i % 4) * 0.01})`;
      c.fillRect((i * 37) % S, (i * 29) % S, 28 + (i % 3) * 10, 10 + (i % 2) * 6);
    }
    c.strokeStyle = "rgba(0,0,0,.05)";
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(0, i * 34 + 10);
      c.lineTo(S, i * 34 + 6);
      c.stroke();
    }
  }
  return ctx.createPattern(can, "repeat");
}
const referenceImageCache = new Map();
let referenceDragStart = null;
let referenceCalibrationPendingDistance = 0;
function ensurePdfJsReady() {
  const pdfjs = window.pdfjsLib || null;
  if (!pdfjs) return null;
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  return pdfjs;
}
function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function renderPdfReference(pdfSource, pageNumber = 1) {
  const pdfjs = ensurePdfJsReady();
  if (!pdfjs) throw new Error("PDF renderer unavailable");
  const loadingTask = pdfjs.getDocument({ data: dataUrlToUint8Array(pdfSource) });
  const pdf = await loadingTask.promise;
  const pageNum = Math.max(1, Math.min(pdf.numPages || 1, Math.round(pageNumber) || 1));
  const page = await pdf.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.max(
    1.2,
    Math.min(2.4, 1800 / Math.max(baseViewport.width, baseViewport.height, 1)),
  );
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const context = canvas.getContext("2d");
  context.fillStyle = "#f7f3ee";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return {
    src: canvas.toDataURL("image/png"),
    naturalWidth: canvas.width,
    naturalHeight: canvas.height,
    page: pageNum,
    pageCount: pdf.numPages || 1,
  };
}
function ensureReferenceImage(src) {
  if (!src) return Promise.resolve(null);
  const cached = referenceImageCache.get(src);
  if (cached instanceof Promise) return cached;
  if (cached) return Promise.resolve(cached);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      referenceImageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      referenceImageCache.delete(src);
      resolve(null);
    };
    img.src = src;
  });
  referenceImageCache.set(src, promise);
  return promise;
}
function drawReferenceOverlay(room = curRoom) {
  const ref = roomReference(room);
  if (!ref?.src || ref.visible === false || !ctx) return;
  const img = referenceImageCache.get(ref.src);
  if (!img || img instanceof Promise) {
    ensureReferenceImage(ref.src).then((loaded) => {
      if (loaded && room === curRoom) {
        if (!ref.naturalWidth || !ref.naturalHeight) {
          ref.naturalWidth = loaded.naturalWidth || loaded.width || 1;
          ref.naturalHeight = loaded.naturalHeight || loaded.height || 1;
        }
        draw();
        showP?.();
      }
    });
    return;
  }
  const bounds = roomReferenceBounds(ref);
  const topLeft = tS({ x: bounds.x0, y: bounds.y0 });
  const bottomRight = tS({ x: bounds.x1, y: bounds.y1 });
  ctx.save();
  ctx.globalAlpha = Math.max(0.06, Math.min(0.95, ref.opacity || 0.56));
  ctx.drawImage(img, topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  ctx.restore();
  if (ref.locked && !ref.calibrationActive) return;
  ctx.save();
  ctx.strokeStyle = ref.calibrationActive ? "rgba(184,145,142,.9)" : "rgba(124,108,94,.78)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  ctx.setLineDash([]);
  const pts = ref.calibrationPoints || [];
  pts.forEach((pt, idx) => {
    const world = referencePointToWorld(pt, ref);
    const s = tS({ x: world.x, y: world.y });
    ctx.fillStyle = "rgba(255,250,245,.96)";
    ctx.strokeStyle = "rgba(184,145,142,.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(92,77,66,.9)";
    ctx.font = "700 10px Outfit,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(idx + 1), s.x, s.y);
  });
  if (pts.length === 2) {
    const a = referencePointToWorld(pts[0], ref),
      b = referencePointToWorld(pts[1], ref);
    const sa = tS({ x: a.x, y: a.y }),
      sb = tS({ x: b.x, y: b.y });
    ctx.strokeStyle = "rgba(184,145,142,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.stroke();
  }
  const label = referenceDisplayLabel(ref);
  ctx.fillStyle = "rgba(255,250,245,.94)";
  ctx.strokeStyle = "rgba(184,145,142,.32)";
  ctx.lineWidth = 1;
  ctx.fillRect(topLeft.x + 10, topLeft.y + 10, 144, 24);
  ctx.strokeRect(topLeft.x + 10, topLeft.y + 10, 144, 24);
  ctx.fillStyle = "rgba(92,77,66,.9)";
  ctx.font = "700 10px Outfit,sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, topLeft.x + 18, topLeft.y + 22);
  ctx.restore();
}
function referenceHitUnlocked(wp, room = curRoom) {
  const ref = roomReference(room);
  if (!ref?.src || ref.locked || ref.visible === false || ref.calibrationActive) return false;
  return !!referenceWorldToLocal(wp, ref);
}
function persistReferenceOverlayState() {
  if (typeof syncCurrentRoomRecord === "function") syncCurrentRoomRecord(false);
  else if (typeof saveAll === "function") saveAll();
}
function setReferenceOpacity(value) {
  const ref = roomReference();
  if (!ref) return;
  ref.opacity = Math.max(0.08, Math.min(0.95, parseFloat(value) || 0.56));
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
}
function setReferenceScale(value) {
  const ref = roomReference();
  if (!ref) return;
  ref.scale = Math.max(0.1, Math.min(12, parseFloat(value) || 1));
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
}
function setReferenceCenterAxis(axis, value) {
  const ref = roomReference();
  if (!ref) return;
  ref[axis] = parseDistanceInput(value, ref[axis] || 0);
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
}
function toggleReferenceVisibility() {
  const ref = roomReference();
  if (!ref?.src) return;
  ref.visible = !ref.visible;
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
}
function toggleReferenceLock() {
  const ref = roomReference();
  if (!ref?.src) return;
  ref.locked = !ref.locked;
  if (ref.locked) referenceDragStart = null;
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
}
function clearReferenceOverlay() {
  const ref = roomReference();
  if (!ref) return;
  curRoom.referenceOverlay = normalizeReferenceOverlay({}, curRoom);
  referenceDragStart = null;
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
  toast("Reference cleared");
}
function importReferenceAsset() {
  if (!curRoom) return;
  let input = document.getElementById("refAssetInput");
  if (!input) {
    input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,application/pdf";
    input.id = "refAssetInput";
    input.style.display = "none";
    input.addEventListener("change", () => handleReferenceFile(input.files?.[0] || null));
    document.body.appendChild(input);
  }
  input.value = "";
  input.click();
}
function importReferenceImage() {
  importReferenceAsset();
}
function handleReferenceFile(file) {
  if (!file || !curRoom) return;
  const reader = new FileReader();
  const isPdf = (file.type || "").includes("pdf") || /\.pdf$/i.test(file.name || "");
  reader.onload = async () => {
    const src = String(reader.result || "");
    const ref = roomReference(curRoom);
    ref.visible = true;
    ref.locked = true;
    ref.opacity = 0.56;
    ref.calibrationActive = false;
    ref.calibrationPoints = [];
    ref.calibrationDistance = 0;
    ref.sourceName = file.name || "";
    const bounds = getRoomBounds2D(curRoom);
    ref.centerX = bounds.cx;
    ref.centerY = bounds.cy;
    ref.baseWidth = Math.max(8, Math.min(30, bounds.width || 12));
    ref.scale = 1;
    try {
      if (isPdf) {
        const rendered = await renderPdfReference(src, 1);
        ref.sourceType = "pdf";
        ref.pdfSource = src;
        ref.pdfPage = rendered.page;
        ref.pdfPageCount = rendered.pageCount;
        ref.src = rendered.src;
        ref.naturalWidth = rendered.naturalWidth;
        ref.naturalHeight = rendered.naturalHeight;
      } else {
        ref.sourceType = "image";
        ref.pdfSource = "";
        ref.pdfPage = 1;
        ref.pdfPageCount = 0;
        ref.src = src;
        const img = await ensureReferenceImage(src);
        if (img) {
          ref.naturalWidth = img.naturalWidth || img.width || 1;
          ref.naturalHeight = img.naturalHeight || img.height || 1;
        }
      }
      pushU();
      persistReferenceOverlayState();
      draw();
      showP();
      toast(
        isPdf
          ? `Reference PDF loaded${ref.pdfPageCount > 1 ? ` · page 1 of ${ref.pdfPageCount}` : ""}`
          : "Reference image loaded",
      );
    } catch (err) {
      console.warn("Reference import failed", err);
      toast(isPdf ? "Could not load that PDF" : "Could not load that image");
    }
  };
  reader.readAsDataURL(file);
}
async function setReferencePdfPage(nextPage) {
  const ref = roomReference();
  if (!ref?.pdfSource) return;
  const target = Math.max(1, Math.min(ref.pdfPageCount || 1, Math.round(nextPage) || 1));
  if (target === ref.pdfPage) return;
  try {
    const rendered = await renderPdfReference(ref.pdfSource, target);
    ref.src = rendered.src;
    ref.pdfPage = rendered.page;
    ref.pdfPageCount = rendered.pageCount;
    ref.naturalWidth = rendered.naturalWidth;
    ref.naturalHeight = rendered.naturalHeight;
    pushU();
    persistReferenceOverlayState();
    draw();
    showP();
    toast(`Reference page ${ref.pdfPage} loaded`);
  } catch (err) {
    console.warn("Reference PDF page load failed", err);
    toast("Could not switch PDF page");
  }
}
function updateReferenceCalibrationState(message, isError = false) {
  const el = document.getElementById("refCalState");
  if (!el) return;
  el.classList.toggle("custom", !!isError);
  el.textContent = message || "";
}
function resetReferenceCalibrationFlow(ref, toastMessage = "") {
  if (!ref) return;
  ref.calibrationActive = false;
  ref.calibrationPoints = [];
  referenceCalibrationPendingDistance = 0;
  document.getElementById("refCalMod")?.classList.remove("on");
  if (toastMessage) toast(toastMessage);
  draw();
  showP();
}
function openReferenceCalibrationModal(currentDistance) {
  referenceCalibrationPendingDistance = currentDistance;
  const modal = document.getElementById("refCalMod");
  const input = document.getElementById("refCalInput");
  if (!modal || !input) return;
  modal.classList.add("on");
  input.value = distanceInputValue(currentDistance);
  updateReferenceCalibrationState(
    `Overlay line reads ${formatDistance(currentDistance, "friendly")}. Enter the real measured length to lock the tracing scale.`,
  );
  setTimeout(() => {
    input.focus();
    input.select();
  }, 30);
}
function startReferenceCalibration() {
  const ref = roomReference();
  if (!ref?.src) return;
  ref.calibrationActive = true;
  ref.locked = true;
  ref.calibrationPoints = [];
  referenceCalibrationPendingDistance = 0;
  updateReferenceCalibrationState("");
  if (typeof isTouchUi === "function" && isTouchUi() && window.innerWidth <= 760) {
    panelHidden = true;
    hideP?.();
  }
  draw();
  showP();
  toast("Tap two points on the reference");
}
function cancelReferenceCalibration() {
  const ref = roomReference();
  if (!ref) return;
  resetReferenceCalibrationFlow(ref, "Calibration cancelled");
}
function finishReferenceCalibration() {
  const ref = roomReference();
  if (!ref || ref.calibrationPoints.length !== 2) return;
  const [a, b] = ref.calibrationPoints;
  const dx = (b.u - a.u) * roomReferenceWorldSize(ref).width;
  const dy = (b.v - a.v) * roomReferenceWorldSize(ref).height;
  const currentDistance = Math.hypot(dx, dy);
  if (!(currentDistance > 0.05)) {
    toast("Choose two distinct points to calibrate");
    resetReferenceCalibrationFlow(ref);
    return;
  }
  openReferenceCalibrationModal(currentDistance);
}
function cancelReferenceCalibrationModal() {
  const ref = roomReference();
  if (!ref) return;
  resetReferenceCalibrationFlow(ref, "Calibration cancelled");
}
function submitReferenceCalibration() {
  const ref = roomReference();
  const input = document.getElementById("refCalInput");
  if (!ref || !input) return;
  const currentDistance = referenceCalibrationPendingDistance || 0;
  const realDistance = parseDistanceInput(input.value, currentDistance);
  if (!(realDistance > 0)) {
    updateReferenceCalibrationState(
      "Enter a positive measured distance like 12 ft or 3.6 m.",
      true,
    );
    return;
  }
  ref.scale *= realDistance / currentDistance;
  ref.calibrationDistance = realDistance;
  document.getElementById("refCalMod")?.classList.remove("on");
  ref.calibrationActive = false;
  ref.calibrationPoints = [];
  referenceCalibrationPendingDistance = 0;
  pushU();
  persistReferenceOverlayState();
  draw();
  showP();
  toast(`Reference calibrated to ${formatDistance(realDistance, "friendly")}`);
}
function handleReferenceCalibrationClick(wp) {
  const ref = roomReference();
  if (!ref?.calibrationActive) return false;
  const local = referenceWorldToLocal(wp, ref);
  if (!local) {
    toast("Tap a point inside the reference image");
    return true;
  }
  ref.calibrationPoints = [...(ref.calibrationPoints || []), local].slice(0, 2);
  draw();
  showP();
  if (ref.calibrationPoints.length === 2) finishReferenceCalibration();
  return true;
}
document.getElementById("refCalMod")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) cancelReferenceCalibrationModal();
});
document.getElementById("refCalInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitReferenceCalibration();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    cancelReferenceCalibrationModal();
  }
});

function pendingFurniturePreviewItem() {
  if (!pendFurnPreviewKey) return null;
  return (
    FURN_ITEM_BY_KEY.get(pendFurnPreviewKey) ||
    FURN_ITEMS.find((item) => item.assetKey === pendFurnPreviewKey) ||
    null
  );
}
function pendingFurnitureCollision(room, state) {
  if (!room || !state?.item) return null;
  const radius = Math.max(0.85, Math.max(state.item.w || 2, state.item.d || 1.5) * 0.44);
  return (
    (room.furniture || []).find(
      (f) =>
        Math.hypot((f.x || 0) - state.snapped.x, (f.z || 0) - state.snapped.z) <
        radius + Math.max(0.75, Math.max(f.w || 2, f.d || 1.5) * 0.34),
    ) || null
  );
}
function floorRoomForPlacementPoint(wp, room = curRoom) {
  if (!wp || !room) return room;
  const floorRooms = (
    typeof currentFloorRooms === "function"
      ? currentFloorRooms(room, room.floorId || activeProjectFloorId)
      : [room]
  ).filter(Boolean);
  const direct = floorRooms.find(
    (candidate) => candidate?.polygon?.length && pointInsideRoom2D(wp, candidate),
  );
  if (direct) return direct;
  const nearby = floorRooms.find(
    (candidate) => candidate?.polygon?.length && pointNearRoom2D(wp, candidate, 1.4),
  );
  return nearby || room;
}
function rotatedPlacementCorners(centerX, centerZ, width, depth, rotationDeg = 0, inset = 1) {
  const hw = Math.max(0.08, (width || 2) * 0.5 * inset);
  const hd = Math.max(0.08, (depth || 1.5) * 0.5 * inset);
  const an = ((rotationDeg || 0) * Math.PI) / 180;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([dx, dz]) => ({
    x: centerX + dx * Math.cos(an) - dz * Math.sin(an),
    y: centerZ + dx * Math.sin(an) + dz * Math.cos(an),
  }));
}
function getPendingFurniturePlacementState(room = curRoom) {
  if (!room || !pendFurnPos) return null;
  const item = pendingFurniturePreviewItem();
  if (!item) return null;
  const targetRoom = floorRoomForPlacementPoint(pendFurnPos, room);
  const reg = item.assetKey ? MODEL_REGISTRY[item.assetKey] : null;
  const wallMounted = isWallMountedFurnitureItem(item, reg);
  const snapped = snapFurnitureForItem(item, pendFurnPos.x, pendFurnPos.y, targetRoom);
  const wallSnap = snapped?.wallSnap || null;
  const previewRotation = Number.isFinite(wallSnap?.angle)
    ? Math.round(((-wallSnap.angle * 180) / Math.PI) * 10) / 10
    : 0;
  const corners = rotatedPlacementCorners(
    snapped.x,
    snapped.z,
    item.w || 2,
    item.d || 1.5,
    previewRotation,
    1,
  );
  const insideCorners = rotatedPlacementCorners(
    snapped.x,
    snapped.z,
    item.w || 2,
    item.d || 1.5,
    previewRotation,
    0.8,
  );
  const inside = wallMounted
    ? !!wallSnap?.valid
    : insideCorners.every(
        (pt) => pointInsideRoom2D(pt, targetRoom) || pointNearRoom2D(pt, targetRoom, 0.18),
      );
  const structureBlocked = wallMounted
    ? false
    : collidesWithStructure(snapped.x, -snapped.z, targetRoom);
  const collision = wallMounted ? null : pendingFurnitureCollision(targetRoom, { item, snapped });
  let reason = "";
  if (!inside) reason = wallMounted ? "Move onto a wall" : "Move fully inside the room";
  else if (structureBlocked) reason = "Target overlaps a built-in or closet";
  else if (collision) reason = `Too close to ${collision.label || "another piece"}`;
  let nearestWall = wallSnap
    ? { idx: wallSnap.idx, distance: wallSnap.distance, angle: wallSnap.angle }
    : null;
  if (!nearestWall) {
    targetRoom.walls.forEach((wall, idx) => {
      const dist = psw({ x: snapped.x, y: snapped.z }, wS(targetRoom, wall), wE(targetRoom, wall));
      if (!nearestWall || dist < nearestWall.distance) nearestWall = { idx, distance: dist };
    });
  }
  const windowTarget =
    reg?.snapToOpening && typeof findNearestWindowOpening === "function"
      ? findNearestWindowOpening({ x: snapped.x, y: snapped.z }, targetRoom)
      : null;
  if (reg?.snapToOpening && !windowTarget) reason = "Place this on a window wall";
  return {
    item,
    snapped,
    corners,
    inside,
    structureBlocked,
    collision,
    valid: inside && !structureBlocked && !collision && (!reg?.snapToOpening || !!windowTarget),
    reason,
    nearestWall,
    windowTarget,
    wallMounted,
    wallSnap,
    targetRoom,
    previewRotation,
  };
}
function drawPendingFurniturePlacement(room) {
  if (!pendFurnPos) return;
  const state = getPendingFurniturePlacementState(room);
  if (!state) return;
  const { item, snapped, nearestWall, targetRoom } = state;
  const screen = tS({ x: snapped.x, y: snapped.z });
  const width = (item?.w || 2) * vScale;
  const depth = (item?.d || 1.5) * vScale;
  const tone = safeThreeColor(
    furniture2DTint(
      {
        variantId:
          typeof getSelectedCatalogVariant === "function"
            ? getSelectedCatalogVariant(item)?.id
            : "",
        finishColor: "",
      },
      item,
    ),
    "#B8918E",
  );
  const valid = !!state.valid;
  const accent = valid
    ? safeThreeColor("#8FB47C", "#8FB47C")
    : safeThreeColor("#C67B72", "#C67B72");
  const fill = threeColorToRgba(valid ? tone.clone().lerp(accent, 0.24) : accent, 0.24);
  const stroke = threeColorToRgba(
    valid ? accent.clone().offsetHSL(0, 0.02, -0.08) : accent.clone().offsetHSL(0, 0.04, -0.02),
    0.92,
  );
  const glow = threeColorToRgba(
    valid ? accent.clone().offsetHSL(0, 0.05, 0.08) : accent.clone().offsetHSL(0, 0.04, 0.05),
    0.28,
  );
  if (lastFurnitureSnapState?.guides?.length) {
    ctx.save();
    ctx.strokeStyle = threeColorToRgba(accent, 0.52);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    lastFurnitureSnapState.guides.forEach((guide) => {
      if (guide.type === "axis-x") {
        const sp = tS({ x: guide.x, y: 0 });
        ctx.beginPath();
        ctx.moveTo(sp.x, 0);
        ctx.lineTo(sp.x, canvas.height);
        ctx.stroke();
      } else if (guide.type === "axis-y") {
        const sp = tS({ x: 0, y: guide.y });
        ctx.beginPath();
        ctx.moveTo(0, sp.y);
        ctx.lineTo(canvas.width, sp.y);
        ctx.stroke();
      }
    });
    ctx.restore();
  }
  if (nearestWall && nearestWall.distance <= 1.1) {
    const wall = targetRoom.walls[nearestWall.idx];
    const a = tS(wS(targetRoom, wall)),
      b = tS(wE(targetRoom, wall));
    ctx.save();
    ctx.strokeStyle = threeColorToRgba(accent, 0.78);
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(screen.x, screen.y);
  if (Number.isFinite(state.previewRotation))
    ctx.rotate((-(state.previewRotation || 0) * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-width / 2, -depth / 2, width, depth, Math.max(12, Math.min(width, depth) * 0.16));
  ctx.fillStyle = fill;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  const arrowY = -Math.max(18, depth * 0.32);
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 14);
  ctx.moveTo(0, arrowY);
  ctx.lineTo(-8, arrowY + 10);
  ctx.lineTo(8, arrowY + 10);
  ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = stroke;
  ctx.fill();
  const activeVariant =
    typeof getSelectedCatalogVariant === "function" ? getSelectedCatalogVariant(item) : null;
  const label = `${item?.label || pendFurnPreviewLabel || "Placement"}${activeVariant?.label ? ` · ${activeVariant.label}` : ""}`;
  const snapText = furnitureSnap ? "snap on" : "free place";
  const info = `${label} · ${state.valid ? "ready" : "adjust"} · ${formatDistance(snapped.x, "compact")}, ${formatDistance(snapped.z, "compact")} · ${snapText}`;
  ctx.font = `700 ${Math.max(8, vScale * 0.22)}px Outfit,sans-serif`;
  const infoW = Math.max(88, ctx.measureText(info).width + 18);
  const pillY = -Math.max(depth / 2 + 20, 32);
  ctx.fillStyle = "rgba(250,247,242,.94)";
  ctx.fillRect(-infoW / 2, pillY - 10, infoW, 20);
  ctx.strokeStyle = "rgba(184,145,142,.34)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-infoW / 2, pillY - 10, infoW, 20);
  ctx.fillStyle = "rgba(92,77,66,.88)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(info, 0, pillY);
  if (!state.valid && state.reason) {
    const reasonW = Math.max(96, ctx.measureText(state.reason).width + 18);
    ctx.fillStyle = "rgba(255,247,245,.96)";
    ctx.fillRect(-reasonW / 2, pillY + 16, reasonW, 20);
    ctx.strokeStyle = "rgba(198,123,114,.34)";
    ctx.strokeRect(-reasonW / 2, pillY + 16, reasonW, 20);
    ctx.fillStyle = "rgba(137,76,69,.9)";
    ctx.fillText(state.reason, 0, pillY + 26);
  }
  ctx.restore();
}

// ── DRAW 2D ──
// Whole-home ghost layer: when the current project has multiple rooms on the
// same floor, render the sibling rooms behind the active room as faded outlines
// with labels. This lets the user see the whole house layout while they edit
// one room at a time, so "Add Room" no longer feels like it "wipes" the view.
function drawHomeLayoutGhosts() {
  if (!curRoom || typeof currentFloorRooms !== "function") return;
  let siblings;
  try {
    siblings = currentFloorRooms(curRoom, curRoom.floorId);
  } catch (_) {
    return;
  }
  if (!siblings || siblings.length < 2) return;
  const activeId = curRoom.id;
  siblings.forEach((room) => {
    if (!room || room.id === activeId || !room.polygon || room.polygon.length < 3) return;
    ctx.save();
    ctx.beginPath();
    room.polygon.forEach((p, i) => {
      const s = tS(p);
      if (!i) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = room.materials?.floor || "#EDE4D8";
    ctx.globalAlpha = 0.18;
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "rgba(92,77,66,.45)";
    ctx.lineWidth = Math.max(1.2, vScale * 0.06);
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Room label at centroid
    let cx = 0,
      cy = 0;
    room.polygon.forEach((p) => {
      cx += p.x;
      cy += p.y;
    });
    cx /= room.polygon.length;
    cy /= room.polygon.length;
    const sc = tS({ x: cx, y: cy });
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "rgba(51,41,34,.75)";
    ctx.font = `500 ${Math.max(10, vScale * 0.32)}px Outfit,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(room.name || "Room", sc.x, sc.y - 8);
    ctx.font = `400 ${Math.max(8, vScale * 0.22)}px Outfit,sans-serif`;
    ctx.fillStyle = "rgba(92,77,66,.7)";
    ctx.fillText("tap to edit", sc.x, sc.y + 8);
    ctx.restore();
  });
}
// Hit-test sibling ghosts so users can tap to jump into another room on the floor.
function hitTestHomeLayoutGhost(wp) {
  if (!curRoom || typeof currentFloorRooms !== "function") return null;
  let siblings;
  try {
    siblings = currentFloorRooms(curRoom, curRoom.floorId);
  } catch (_) {
    return null;
  }
  if (!siblings || siblings.length < 2) return null;
  for (const room of siblings) {
    if (!room || room.id === curRoom.id || !room.polygon || room.polygon.length < 3) continue;
    // Simple point-in-polygon
    let inside = false;
    for (let i = 0, j = room.polygon.length - 1; i < room.polygon.length; j = i++) {
      const pi = room.polygon[i],
        pj = room.polygon[j];
      const intersect =
        pi.y > wp.y !== pj.y > wp.y &&
        wp.x < ((pj.x - pi.x) * (wp.y - pi.y)) / (pj.y - pi.y || 1e-9) + pi.x;
      if (intersect) inside = !inside;
    }
    if (inside) return room;
  }
  return null;
}
function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  // Multi-room home layout ghosts (other rooms on this floor, behind current)
  if (curRoom && curRoom.polygon?.length && !drawMode) drawHomeLayoutGhosts();
  // Empty state.
  try {
    const es = document.getElementById("emptyState");
    if (es) {
      const show = !curRoom || !curRoom.polygon || curRoom.polygon.length < 3;
      es.classList.toggle(
        "on",
        !!show && !drawMode && !document.getElementById("scrEd")?.classList.contains("mode-3d"),
      );
    }
  } catch (error) {
    window.reportRoseRecoverableError?.("2D empty-state visibility update failed", error);
  }
  if (drawMode) {
    if (curRoom && roomLayerVisible(curRoom, "reference")) drawReferenceOverlay(curRoom);
    drawFD();
    return;
  }
  if (!curRoom) return;
  const r = curRoom;
  const showWalls = roomLayerVisible(r, "walls");
  const showOpenings = roomLayerVisible(r, "openings");
  const showExistingFurniture = roomLayerVisible(r, "furniture_existing");
  const showNewFurniture = roomLayerVisible(r, "furniture_new");
  const showRoomLabels = roomLayerVisible(r, "room_labels");
  const showDimensions = roomLayerVisible(r, "dimensions");
  if (roomLayerVisible(r, "reference")) drawReferenceOverlay(r);
  if (!curRoom.polygon.length) return;
  if (showWalls) {
    // Wall paint wash
    ctx.save();
    ctx.beginPath();
    r.polygon.forEach((p, i) => {
      const s = tS(p);
      if (!i) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = r.materials.wall || WALL_PALETTES[0].color;
    ctx.globalAlpha = 0.42;
    ctx.fill();
    ctx.restore();
    // Floor
    ctx.save();
    ctx.beginPath();
    r.polygon.forEach((p, i) => {
      const s = tS(p);
      if (!i) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = floorPattern2D(r.materials) || r.materials.floor;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  drawPendingFurniturePlacement(r);
  // Structures
  r.structures.forEach((st, i) => {
    ctx.save();
    const is = sel.type === "structure" && sel.idx === i;
    if (st.type === "closet" && st.rect) {
      const fin =
        CLOSET_FINISHES.find((f) => f.id === (st.finish || "white_painted")) || CLOSET_FINISHES[0];
      const a = tS({ x: st.rect.x, y: st.rect.y }),
        b = tS({ x: st.rect.x + st.rect.w, y: st.rect.y + st.rect.h });
      ctx.fillStyle = fin.body;
      ctx.strokeStyle = is ? "#B8918E" : fin.trim;
      ctx.lineWidth = is ? 2.5 : 1.5;
      if (is) ctx.setLineDash([5, 3]);
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.setLineDash([]);
      const midX = (a.x + b.x) / 2;
      ctx.strokeStyle = fin.trim;
      ctx.beginPath();
      ctx.moveTo(midX, a.y + 4);
      ctx.lineTo(midX, b.y - 4);
      ctx.stroke();
      ctx.fillStyle = fin.trim;
      ctx.font = `${Math.max(9, vScale * 0.35)}px Outfit,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("closet", (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (st.type === "partition" && st.line) {
      const a = tS(st.line.a),
        b = tS(st.line.b);
      ctx.strokeStyle = is ? "#B8918E" : "#5C4D42";
      ctx.lineWidth = Math.max(3, vScale * 0.15);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  });
  // Walls
  if (showWalls)
    r.walls.forEach((w) => {
      const a = tS(wS(r, w)),
        b = tS(wE(r, w));
      ctx.strokeStyle = r.materials.wall;
      ctx.lineWidth = Math.max(4, w.thickness * vScale);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = r.materials.trim || "rgba(51,41,34,.2)";
      ctx.lineWidth = Math.max(1.2, vScale * 0.04);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (showDimensions) {
        const l = wL(r, w),
          mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2,
          an = wA(r, w);
        ctx.save();
        ctx.translate(mx, my);
        let la = an;
        if (la > Math.PI / 2) la -= Math.PI;
        if (la < -Math.PI / 2) la += Math.PI;
        ctx.rotate(la);
        ctx.fillStyle = "rgba(51,41,34,.35)";
        ctx.font = `500 ${Math.max(9, vScale * 0.28)}px Outfit,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(formatDistance(l, "compact"), 0, -Math.max(4, w.thickness * vScale * 0.6));
        ctx.restore();
      }
    });
  // Openings
  if (showOpenings)
    r.openings.forEach((op, i) => {
      const w = r.walls.find((x) => x.id === op.wallId);
      if (!w) return;
      const a = wS(r, w),
        b = wE(r, w),
        wl = wL(r, w);
      if (!wl) return;
      const an = wA(r, w),
        t = op.offset / wl;
      const sc = tS({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
        hw = (op.width / 2) * vScale,
        is = sel.type === "opening" && sel.idx === i,
        wt = Math.max(3, w.thickness * vScale * 0.6);
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(an);
      if (op.type === "door") {
        ctx.fillStyle = r.materials.floor;
        ctx.fillRect(-hw, -wt, hw * 2, wt * 2);
        ctx.strokeStyle = is ? "#B8918E" : r.materials.trim || "rgba(51,41,34,.2)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        const sd = op.swing === "in" ? 1 : -1,
          hingeX = op.hinge === "right" ? hw : -hw,
          startAng = op.hinge === "right" ? Math.PI : 0;
        ctx.arc(hingeX, 0, op.width * vScale, startAng, startAng + sd * (Math.PI / 2), sd < 0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = is ? "#B8918E" : "#5C4D42";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (op.hinge === "right") {
          ctx.moveTo(hw, 0);
          ctx.lineTo(-hw, 0);
        } else {
          ctx.moveTo(-hw, 0);
          ctx.lineTo(hw, 0);
        }
        ctx.stroke();
      } else if (op.type === "window") {
        ctx.fillStyle = "rgba(180,210,230,.3)";
        ctx.fillRect(-hw, -wt * 0.7, hw * 2, wt * 1.4);
        ctx.strokeStyle = is ? "#B8918E" : r.materials.trim || "#5B8FA8";
        ctx.lineWidth = is ? 2 : 1.5;
        ctx.strokeRect(-hw, -wt * 0.7, hw * 2, wt * 1.4);
        ctx.beginPath();
        ctx.moveTo(0, -wt * 0.7);
        ctx.lineTo(0, wt * 0.7);
        ctx.stroke();
      }
      if (is && showDimensions) {
        ctx.fillStyle = "#B8918E";
        ctx.font = `600 ${Math.max(8, vScale * 0.22)}px Outfit,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`${formatDistance(op.offset, "compact")} offset`, 0, wt + 2);
      }
      ctx.restore();
    });
  // Furniture
  r.furniture.forEach((f, i) => {
    if (f.source === "existing" && !showExistingFurniture) return;
    if (f.source !== "existing" && !showNewFurniture) return;
    const renderState = getFurnitureRenderState(f, r);
    if (!renderState.visible) return;
    const sc = tS({ x: f.x, y: f.z }),
      hw = ((f.w || 2) * vScale) / 2,
      hd = ((f.d || 1.5) * vScale) / 2,
      isPrimary = sel.type === "furniture" && sel.idx === i,
      isGroup = isFurnitureSelected(i),
      is = isPrimary || isGroup;
    const item =
      FURN_ITEMS.find((x) => x.assetKey === f.assetKey) ||
      FURN_ITEMS.find((x) => x.label === f.label);
    const tint = furniture2DTint(f, item);
    const existingStyle = renderState.style;
    const ghosted = renderState.ghost;
    const baseStroke = furniture2DStroke(f, item);
    const labelInk = furniture2DLabelInk(f, item);
    ctx.save();
    ctx.translate(sc.x, sc.y);
    ctx.rotate(((f.rotation || 0) * Math.PI) / 180);
    if (f.assetKey === "sofa_l") {
      const rr = Math.min(hw, hd) * 0.18,
        seatDepth = hd * 1.08,
        legWidth = hw * 1.04;
      ctx.beginPath();
      ctx.roundRect(-hw, -hd, hw * 2, seatDepth, rr);
      ctx.roundRect(-hw, -hd, legWidth, hd * 2, rr);
    } else {
      const rr = Math.min(hw, hd) * 0.22;
      ctx.beginPath();
      ctx.roundRect(-hw, -hd, hw * 2, hd * 2, rr);
    }
    // Stronger shadow for light-colored pieces so they lift off the floor
    const fillC = safeThreeColor(existingStyle?.fill || tint, "#B8A898");
    const fillHSL = { h: 0, s: 0, l: 0 };
    fillC.getHSL(fillHSL);
    const shadowStrength = ghosted ? 0.06 : fillHSL.l > 0.65 ? 0.3 : 0.18;
    ctx.shadowColor = `rgba(40,28,18,${shadowStrength})`;
    ctx.shadowBlur = Math.max(5, Math.min(18, Math.min(hw, hd) * 0.28));
    ctx.shadowOffsetY = Math.max(2, Math.min(10, hd * 0.12));
    ctx.fillStyle = existingStyle?.fill || tint;
    ctx.globalAlpha = existingStyle ? (ghosted ? 0.42 : 0.66) : is ? 0.96 : 0.94;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = isPrimary
      ? "#B8918E"
      : isGroup
        ? "rgba(184,145,142,.82)"
        : existingStyle?.stroke || baseStroke;
    ctx.lineWidth = is ? 2.6 : existingStyle ? 1.9 : 1.55;
    ctx.stroke();
    if (is) {
      ctx.setLineDash(isPrimary ? [6, 4] : [4, 4]);
      ctx.strokeStyle = isPrimary ? "rgba(184,145,142,.5)" : "rgba(184,145,142,.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (existingStyle && !is) {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = existingStyle.stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const wallMounted =
      item?.mountType === "wall" ||
      f.mountType === "wall" ||
      MODEL_REGISTRY[f.assetKey]?.mountType === "wall";
    if (!wallMounted) {
      const facingY = -Math.max(10, hd * 0.66);
      ctx.beginPath();
      ctx.moveTo(0, facingY);
      ctx.lineTo(-Math.max(5, hw * 0.14), facingY + Math.max(8, hd * 0.18));
      ctx.lineTo(Math.max(5, hw * 0.14), facingY + Math.max(8, hd * 0.18));
      ctx.closePath();
      ctx.fillStyle = isPrimary
        ? "#B8918E"
        : isGroup
          ? "rgba(184,145,142,.8)"
          : "rgba(92,77,66,.72)";
      ctx.fill();
    }
    ctx.fillStyle = isPrimary ? "#8E6E6B" : isGroup ? "rgba(112,88,86,.76)" : labelInk;
    ctx.font = `700 ${Math.max(11, vScale * 0.34)}px Outfit,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      (item && item.symbol) || item?.icon || "\u25A3",
      0,
      wallMounted ? 0 : -Math.min(7, hd * 0.16),
    );
    if (showRoomLabels) {
      ctx.font = `600 ${Math.max(8, vScale * 0.24)}px Outfit,sans-serif`;
      const labelY = -hd - 12;
      const labelText = f.label || "Item";
      const labelW = Math.max(34, ctx.measureText(labelText).width + 12);
      ctx.fillStyle = "rgba(250,247,242,.88)";
      ctx.beginPath();
      ctx.roundRect(-labelW / 2, labelY - 8, labelW, 16, 6);
      ctx.fill();
      ctx.fillStyle = isPrimary ? "#8E6E6B" : isGroup ? "rgba(112,88,86,.76)" : labelInk;
      ctx.fillText(labelText, 0, labelY);
    }
    if (existingStyle && currentPlanViewMode(r) !== "existing") {
      ctx.fillStyle = "rgba(250,247,242,.92)";
      const badgeText = f.redesignAction.toUpperCase() + (f.locked ? " • LOCKED" : "");
      ctx.fillRect(-Math.max(34, hw * 0.7), hd + 4, Math.max(68, hw * 1.4), 16);
      ctx.fillStyle = existingStyle.stroke;
      ctx.font = `700 ${Math.max(7, vScale * 0.18)}px Outfit,sans-serif`;
      ctx.fillText(badgeText, 0, hd + 12);
    }
    ctx.restore();
  });
  drawPlanLegend(r);
  // Measurements
  if (showMeasurements && showDimensions && r.polygon.length >= 3) {
    const b = getRoomBounds2D(r),
      area = polygonArea(r.polygon);
    const center = tS({ x: b.cx, y: b.cy });
    // Overall bounding dimensions
    const tl = tS({ x: b.x0, y: b.y0 }),
      tr = tS({ x: b.x1, y: b.y0 }),
      bl = tS({ x: b.x0, y: b.y1 }),
      br = tS({ x: b.x1, y: b.y1 });
    const off = Math.max(24, vScale * 1.2);
    drawDimLine(ctx, tl.x, tl.y - off, tr.x, tr.y - off, 0, formatDistance(b.width));
    drawDimLine(ctx, tr.x + off, tl.y, br.x + off, br.y, 0, formatDistance(b.height));
    // Room label
    if (showRoomLabels) {
      ctx.save();
      ctx.fillStyle = "rgba(250,247,242,.88)";
      ctx.font = "700 12px Outfit,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const roomName = r.name || "Room";
      const roomNameW = ctx.measureText(roomName).width + 18;
      ctx.fillRect(center.x - roomNameW / 2, center.y - vScale * 0.15 - 9, roomNameW, 18);
      ctx.fillStyle = "rgba(92,77,66,.84)";
      ctx.fillText(roomName, center.x, center.y - vScale * 0.15);
      ctx.restore();
    }
    // Area label
    ctx.save();
    ctx.fillStyle = "rgba(142,110,107,.7)";
    ctx.font = "600 11px Outfit,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(250,247,242,.8)";
    const areaText = formatArea(area);
    ctx.fillRect(
      center.x - areaText.length * 3.4 - 6,
      center.y + vScale * 0.8 - 8,
      areaText.length * 6.8 + 12,
      16,
    );
    ctx.fillStyle = "rgba(142,110,107,.75)";
    ctx.fillText(areaText, center.x, center.y + vScale * 0.8);
    ctx.restore();
  }
  drawTextAnnotations(r);
  drawDimensionAnnotations(r);
  // Vertices
  r.polygon.forEach((p, i) => {
    const s = tS(p),
      is = sel.type === "vertex" && sel.idx === i;
    ctx.beginPath();
    ctx.arc(s.x, s.y, is ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = is ? "#B8918E" : "#FFF";
    ctx.strokeStyle = is ? "#8E6E6B" : "#8B7E74";
    ctx.lineWidth = is ? 2.5 : 1.5;
    ctx.fill();
    ctx.stroke();
  });
  // Pending
  if (closetSt && pendEnd) {
    const a = tS(closetSt),
      b = tS(pendEnd);
    ctx.fillStyle = "rgba(139,126,116,.06)";
    ctx.strokeStyle = "#B8918E";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.setLineDash([]);
  }
  if (partSt && pendEnd) {
    const a = tS(partSt),
      b = tS(pendEnd);
    ctx.strokeStyle = "#8E6E6B";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (dimAnnStart && pendDimEnd) {
    const a = tS(dimAnnStart),
      b = tS(pendDimEnd);
    ctx.save();
    ctx.strokeStyle = "rgba(184,145,142,.84)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  drawPlanSnapGuides();
  // Render fading snap-alignment pulses.
  if (window._snapPulses && window._snapPulses.length) {
    const now = performance.now();
    const alive = [];
    ctx.save();
    window._snapPulses.forEach((p) => {
      const age = now - p.t;
      if (age > 520) return;
      const k = age / 520,
        ease = 1 - Math.pow(1 - k, 3);
      const sp = tS({ x: p.x, y: -p.z });
      const rad = 8 + ease * 22;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(184,145,142,${(1 - ease) * 0.85})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      alive.push(p);
    });
    ctx.restore();
    window._snapPulses = alive;
    if (alive.length && typeof requestAnimationFrame === "function")
      requestAnimationFrame(() => draw());
  }
}

function drawFD() {
  if (drawPts.length > 0) {
    ctx.beginPath();
    drawPts.forEach((p, i) => {
      const s = tS(p);
      if (!i) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    if (drawCur) {
      const c = tS(drawCur);
      ctx.lineTo(c.x, c.y);
    }
    ctx.strokeStyle = "#B8918E";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (drawPts.length >= 3 && drawCur) {
      const f = tS(drawPts[0]),
        c = tS(drawCur);
      if (Math.hypot(f.x - c.x, f.y - c.y) < 20) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(184,145,142,.3)";
        ctx.fill();
      }
    }
    drawPts.forEach((p, i) => {
      const s = tS(p);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? "#B8918E" : "#FFF";
      ctx.strokeStyle = "#8E6E6B";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });
    for (let i = 0; i < drawPts.length - 1; i++) {
      const a = tS(drawPts[i]),
        b = tS(drawPts[i + 1]),
        l = Math.sqrt(
          (drawPts[i + 1].x - drawPts[i].x) ** 2 + (drawPts[i + 1].y - drawPts[i].y) ** 2,
        );
      ctx.fillStyle = "rgba(51,41,34,.4)";
      ctx.font = "500 10px Outfit,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(formatDistance(l, "compact"), (a.x + b.x) / 2, (a.y + b.y) / 2 - 6);
    }
  }
  if (drawCur) {
    const c = tS(drawCur);
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(184,145,142,.5)";
    ctx.fill();
    if (drawPts.length > 0) {
      const lp = drawPts[drawPts.length - 1],
        l = Math.sqrt((drawCur.x - lp.x) ** 2 + (drawCur.y - lp.y) ** 2);
      ctx.fillStyle = "#B8918E";
      ctx.font = "600 11px Outfit,sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(formatDistance(l, "compact"), c.x + 10, c.y - 6);
    }
  }
}

function drawGrid() {
  const s = 1,
    tl = tW(0, 0),
    br = tW(canvas.width, canvas.height),
    sx = Math.floor(tl.x / s) * s,
    sy = Math.floor(tl.y / s) * s;
  ctx.strokeStyle = "rgba(139,126,116,.04)";
  ctx.lineWidth = 1;
  for (let x = sx; x <= br.x; x += s) {
    const px = x * vScale + vOff.x;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();
  }
  for (let y = sy; y <= br.y; y += s) {
    const py = y * vScale + vOff.y;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
  }
}
function annotationScreenBox(note) {
  if (!ctx) return null;
  const s = tS({ x: note.x, y: note.z });
  ctx.save();
  ctx.font = `700 ${Math.max(11, Number(note.fontSize) || 14)}px Outfit,sans-serif`;
  const width = Math.max(48, ctx.measureText(note.text || "Note").width + 16);
  ctx.restore();
  return { x: s.x - width / 2, y: s.y - 14, w: width, h: 22, cx: s.x, cy: s.y };
}
function drawTextAnnotations(room = curRoom) {
  if (!ctx || !roomLayerVisible(room, "annotations")) return;
  (room.textAnnotations || []).forEach((note, i) => {
    const box = annotationScreenBox(note);
    if (!box) return;
    const is = sel.type === "annotation" && sel.idx === i;
    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate(((note.rotation || 0) * Math.PI) / 180);
    ctx.fillStyle = "rgba(255,250,245,.94)";
    ctx.strokeStyle = is ? "#B8918E" : "rgba(142,110,107,.34)";
    ctx.lineWidth = is ? 2 : 1.2;
    ctx.beginPath();
    ctx.roundRect(-box.w / 2, -box.h / 2, box.w, box.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = note.color || "#8E6E6B";
    ctx.font = `700 ${Math.max(11, Number(note.fontSize) || 14)}px Outfit,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(note.text || "Note", 0, 0);
    ctx.restore();
  });
}
function dimensionAnnotationMidpoint(note) {
  return { x: ((note.x1 || 0) + (note.x2 || 0)) / 2, y: ((note.z1 || 0) + (note.z2 || 0)) / 2 };
}
function dimensionAnnotationLabel(note) {
  const dx = (note.x2 || 0) - (note.x1 || 0),
    dy = (note.z2 || 0) - (note.z1 || 0);
  return (note.label || "").trim() || formatDistance(Math.hypot(dx, dy));
}
function dimensionAnnotationScreenBox(note) {
  if (!ctx) return null;
  const mid = dimensionAnnotationMidpoint(note);
  const s = tS({ x: mid.x, y: mid.y });
  const label = dimensionAnnotationLabel(note);
  ctx.save();
  ctx.font = `700 ${Math.max(10, Number(note.fontSize) || 13)}px Outfit,sans-serif`;
  const width = Math.max(56, ctx.measureText(label).width + 18);
  ctx.restore();
  return { x: s.x - width / 2, y: s.y - 14, w: width, h: 28, cx: s.x, cy: s.y };
}
function drawDimensionAnnotations(room = curRoom) {
  if (!ctx || !roomLayerVisible(room, "dimensions")) return;
  (room.dimensionAnnotations || []).forEach((note, i) => {
    const a = tS({ x: note.x1, y: note.z1 }),
      b = tS({ x: note.x2, y: note.z2 });
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = Math.hypot(dx, dy);
    if (len < 4) return;
    const nx = -dy / len,
      ny = dx / len,
      off = (note.offset || 0.8) * Math.max(10, vScale * 0.3);
    const ax = a.x + nx * off,
      ay = a.y + ny * off,
      bx = b.x + nx * off,
      by = b.y + ny * off;
    const is = sel.type === "dim_annotation" && sel.idx === i;
    ctx.save();
    ctx.strokeStyle = is ? "#B8918E" : note.color || "#8E6E6B";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = is ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(ax, ay);
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(bx, by);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    drawArrowTick(ctx, ax, ay, dx / len, dy / len, 6);
    drawArrowTick(ctx, bx, by, -dx / len, -dy / len, 6);
    const label = dimensionAnnotationLabel(note);
    const mx = (ax + bx) / 2,
      my = (ay + by) / 2;
    let ang = Math.atan2(dy, dx);
    if (ang > Math.PI / 2) ang -= Math.PI;
    if (ang < -Math.PI / 2) ang += Math.PI;
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.font = `700 ${Math.max(10, Number(note.fontSize) || 13)}px Outfit,sans-serif`;
    const labelW = Math.max(56, ctx.measureText(label).width + 18);
    ctx.fillStyle = "rgba(255,250,245,.96)";
    ctx.strokeStyle = is ? "#B8918E" : "rgba(142,110,107,.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-labelW / 2, -10, labelW, 20, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = note.color || "#8E6E6B";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}
function drawPlanSnapGuides() {
  if (!ctx || !lastPlanSnapState?.guides?.length) return;
  ctx.save();
  ctx.strokeStyle = "rgba(184,145,142,.7)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([6, 6]);
  lastPlanSnapState.guides.forEach((guide) => {
    if (guide.type === "axis-x") {
      const sp = tS({ x: guide.x, y: 0 });
      ctx.beginPath();
      ctx.moveTo(sp.x, 0);
      ctx.lineTo(sp.x, canvas.height);
      ctx.stroke();
    } else if (guide.type === "axis-y") {
      const sp = tS({ x: 0, y: guide.y });
      ctx.beginPath();
      ctx.moveTo(0, sp.y);
      ctx.lineTo(canvas.width, sp.y);
      ctx.stroke();
    } else if (guide.type === "segment" && guide.a && guide.b) {
      const a = tS(guide.a),
        b = tS(guide.b);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else if (guide.type === "point") {
      const p = tS({ x: guide.x, y: guide.y });
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ctx.restore();
}

// ── POINTER EVENTS ──
function gP(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function onD(e) {
  const p = gP(e),
    wp = tW(p.x, p.y);
  isDrag = true;
  dStart = p;
  pendEnd = null;
  if (drawMode) {
    let pt = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    if (drawPts.length > 0 && angSnap) pt = snapAng(drawPts[drawPts.length - 1], pt);
    pt = { x: Math.round(pt.x * 2) / 2, y: Math.round(pt.y * 2) / 2 };
    if (drawPts.length >= 3) {
      const f = tS(drawPts[0]);
      if (Math.hypot(f.x - p.x, f.y - p.y) < 20) {
        closeRoom();
        return;
      }
    }
    drawPts.push(pt);
    draw();
    return;
  }
  if (handleReferenceCalibrationClick(wp)) {
    isDrag = false;
    dOrig = null;
    return;
  }
  if (tool === "furniture" && document.getElementById("furnPickOv")) {
    updatePendingFurnitureTarget(wp);
    draw();
    return;
  }
  if (tool === "select") {
    const h = hitTest(p),
      modMulti = !!(e.shiftKey || e.metaKey || e.ctrlKey || multiSelectMode);
    if (h) {
      panelHidden = false;
      if (h.type === "furniture") {
        const clicked = curRoom.furniture[h.idx];
        const alreadySelected = isFurnitureSelected(h.idx);
        if (modMulti) {
          setFurnitureSelection(h.idx, { toggle: true });
          isDrag = false;
          dOrig = null;
          showP();
          draw();
          return;
        }
        if (alreadySelected && groupSelectionActive()) {
          sel = { type: "furniture", idx: h.idx };
          const selectedItems = selectedFurnitureRecords();
          if (selectedItems.every((item) => item.locked)) {
            isDrag = false;
            dOrig = null;
          } else {
            dOrig = selectedItems.map((item) => ({
              id: item.id,
              x: item.x,
              z: item.z,
              locked: item.locked,
            }));
          }
        } else {
          setFurnitureSelection(h.idx);
          dOrig = clicked.locked ? null : { x: clicked.x, z: clicked.z };
        }
      } else {
        clearFurnitureSelection();
        sel = h;
        if (h.type === "vertex") dOrig = { ...curRoom.polygon[h.idx] };
        else if (h.type === "opening") dOrig = { ...curRoom.openings[h.idx] };
        else if (h.type === "structure") {
          const st = curRoom.structures[h.idx];
          dOrig = st.rect
            ? { ...st.rect }
            : st.line
              ? { a: { ...st.line.a }, b: { ...st.line.b } }
              : null;
        } else if (h.type === "annotation") dOrig = { ...curRoom.textAnnotations[h.idx] };
        else if (h.type === "dim_annotation") dOrig = { ...curRoom.dimensionAnnotations[h.idx] };
      }
      showP();
    } else {
      // Multi-room home layout: tap on a ghost sibling room to jump into it.
      const ghostRoom = hitTestHomeLayoutGhost(wp);
      if (ghostRoom) {
        clearFurnitureSelection();
        isDrag = false;
        dOrig = null;
        if (typeof openEd === "function") openEd(ghostRoom);
        else curRoom = ghostRoom;
        if (typeof toast === "function") toast(`Editing ${ghostRoom.name || "room"}`);
        return;
      }
      if (referenceHitUnlocked(wp, curRoom)) {
        clearFurnitureSelection();
        sel = { type: null, idx: -1 };
        const ref = roomReference(curRoom);
        referenceDragStart = { x: ref.centerX, y: ref.centerY };
        panelHidden = true;
        hideP();
        draw();
        return;
      }
      clearFurnitureSelection();
      sel = { type: null, idx: -1 };
      panelHidden = true;
      dOrig = { ...vOff };
      hideP();
    }
  } else if (tool === "draw" || tool === "vertex") {
    const nw = findNW(wp);
    if (nw !== null) addVtx(nw, wp);
  } else if (tool === "door" || tool === "window") {
    const existing = hitTest(p);
    if (existing && existing.type === "opening") {
      tool = "select";
      document
        .querySelectorAll(".tb")
        .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
      panelHidden = false;
      sel = existing;
      dOrig = { ...curRoom.openings[existing.idx] };
      showP();
    } else {
      const n = findNWO(wp);
      if (n) {
        const w = curRoom.walls[n.wi];
        const op = {
          id: uid(),
          type: tool,
          wallId: w.id,
          offset: n.off,
          width: tool === "door" ? 3 : 2.5,
          height: tool === "door" ? 7 : 4,
          sillHeight: tool === "window" ? 3 : 0,
          swing: "in",
          hinge: "left",
        };
        curRoom.openings.push(op);
        sel = { type: "opening", idx: curRoom.openings.length - 1 };
        dOrig = { ...op };
        pushU();
        showP();
        toast(tool === "door" ? "Door placed" : "Window placed");
      }
    }
  } else if (tool === "closet") {
    closetSt = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    pendEnd = closetSt;
  } else if (tool === "partition") {
    partSt = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    pendEnd = partSt;
  } else if (tool === "dim") {
    dimAnnStart = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    pendDimEnd = dimAnnStart;
  } else if (tool === "annotation") {
    const text = window.prompt("Add note", "New note");
    if (text && text.trim()) {
      curRoom.textAnnotations.push({
        id: uid(),
        text: text.trim(),
        x: Math.round(wp.x * 2) / 2,
        z: Math.round(wp.y * 2) / 2,
        color: "#8E6E6B",
        fontSize: 14,
        rotation: 0,
      });
      sel = { type: "annotation", idx: curRoom.textAnnotations.length - 1 };
      tool = "select";
      document
        .querySelectorAll(".tb")
        .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
      panelHidden = false;
      pushU();
      showP();
      toast("Annotation added");
    } else {
      tool = "select";
      document
        .querySelectorAll(".tb")
        .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
    }
  } else if (tool === "furniture") {
    showFurnPicker(wp);
  }
  draw();
}
function onM(e) {
  const p = gP(e),
    wp = tW(p.x, p.y);
  if (drawMode) {
    let pt = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    if (drawPts.length > 0 && angSnap) pt = snapAng(drawPts[drawPts.length - 1], pt);
    drawCur = { x: Math.round(pt.x * 2) / 2, y: Math.round(pt.y * 2) / 2 };
    draw();
    return;
  }
  if (tool === "furniture" && document.getElementById("furnPickOv") && isDrag) {
    updatePendingFurnitureTarget(wp);
    draw();
    return;
  }
  if (!isDrag) return;
  if (tool === "select" && referenceDragStart) {
    const dx = (p.x - dStart.x) / vScale,
      dy = (p.y - dStart.y) / vScale;
    const ref = roomReference(curRoom);
    ref.centerX = Math.round((referenceDragStart.x + dx) * 4) / 4;
    ref.centerY = Math.round((referenceDragStart.y + dy) * 4) / 4;
    draw();
    showP();
    return;
  }
  if (tool === "select" && sel.type === "vertex" && dOrig) {
    const dx = (p.x - dStart.x) / vScale,
      dy = (p.y - dStart.y) / vScale;
    curRoom.polygon[sel.idx].x = Math.round((dOrig.x + dx) * 2) / 2;
    curRoom.polygon[sel.idx].y = Math.round((dOrig.y + dy) * 2) / 2;
    curRoom.walls = genWalls(curRoom);
    draw();
  } else if (tool === "select" && sel.type === "opening" && dOrig) {
    updateOpeningFromPoint(sel.idx, wp);
    draw();
    showP();
  } else if (tool === "select" && sel.type === "structure" && dOrig) {
    const st = curRoom.structures[sel.idx],
      dx = (p.x - dStart.x) / vScale,
      dy = (p.y - dStart.y) / vScale;
    if (st.rect) {
      st.rect.x = Math.round((dOrig.x + dx) * 2) / 2;
      st.rect.y = Math.round((dOrig.y + dy) * 2) / 2;
    } else if (st.line && dOrig.a) {
      st.line.a = {
        x: Math.round((dOrig.a.x + dx) * 2) / 2,
        y: Math.round((dOrig.a.y + dy) * 2) / 2,
      };
      st.line.b = {
        x: Math.round((dOrig.b.x + dx) * 2) / 2,
        y: Math.round((dOrig.b.y + dy) * 2) / 2,
      };
    }
    draw();
  } else if (tool === "select" && sel.type === "annotation" && dOrig) {
    const note = curRoom.textAnnotations[sel.idx],
      dx = (p.x - dStart.x) / vScale,
      dy = (p.y - dStart.y) / vScale;
    if (note) {
      note.x = Math.round((dOrig.x + dx) * 2) / 2;
      note.z = Math.round((dOrig.z + dy) * 2) / 2;
    }
    draw();
    showP();
  } else if (tool === "select" && sel.type === "dim_annotation" && dOrig) {
    const note = curRoom.dimensionAnnotations[sel.idx],
      dx = (p.x - dStart.x) / vScale,
      dy = (p.y - dStart.y) / vScale;
    if (note) {
      note.x1 = Math.round((dOrig.x1 + dx) * 2) / 2;
      note.z1 = Math.round((dOrig.z1 + dy) * 2) / 2;
      note.x2 = Math.round((dOrig.x2 + dx) * 2) / 2;
      note.z2 = Math.round((dOrig.z2 + dy) * 2) / 2;
    }
    draw();
    showP();
  } else if (tool === "select" && sel.type === "furniture" && dOrig) {
    const dx = (p.x - dStart.x) / vScale,
      dy = (p.y - dStart.y) / vScale;
    if (Array.isArray(dOrig)) {
      const primaryId = curRoom.furniture[sel.idx]?.id || dOrig[0]?.id;
      const primary = dOrig.find((item) => item.id === primaryId) || dOrig[0];
      let moveX = dx,
        moveZ = dy;
      let wallRotation = null;
      if (primary) {
        const snapped = snapFurnitureForItem(primary, primary.x + dx, primary.z + dy, curRoom);
        moveX = snapped.x - primary.x;
        moveZ = snapped.z - primary.z;
        if (primary.mountType === "wall" && Number.isFinite(snapped?.wallSnap?.angle))
          wallRotation = Math.round(((-snapped.wallSnap.angle * 180) / Math.PI) * 10) / 10;
      }
      dOrig.forEach((origin) => {
        const item = curRoom.furniture.find((f) => f.id === origin.id);
        if (!item || origin.locked || item.locked) return;
        item.x = Math.round((origin.x + moveX) * 2) / 2;
        item.z = Math.round((origin.z + moveZ) * 2) / 2;
        if (item.mountType === "wall" && Number.isFinite(wallRotation))
          item.rotation = wallRotation;
      });
    } else {
      const f = curRoom.furniture[sel.idx];
      if (f && !f.locked) {
        const snapped = snapFurnitureForItem(f, dOrig.x + dx, dOrig.z + dy, curRoom);
        f.x = Math.round(snapped.x * 2) / 2;
        f.z = Math.round(snapped.z * 2) / 2;
        if (f.mountType === "wall" && Number.isFinite(snapped?.wallSnap?.angle))
          f.rotation = Math.round(((-snapped.wallSnap.angle * 180) / Math.PI) * 10) / 10;
      }
    }
    draw();
  } else if (tool === "select" && !sel.type && dOrig) {
    vOff.x = dOrig.x + (p.x - dStart.x);
    vOff.y = dOrig.y + (p.y - dStart.y);
    draw();
  } else if (tool === "closet" && closetSt) {
    pendEnd = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    draw();
  } else if (tool === "partition" && partSt) {
    let pt = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    pendEnd = angSnap ? snapAng(partSt, pt) : pt;
    draw();
  } else if (tool === "dim" && dimAnnStart) {
    pendDimEnd = resolvePlanSnap({ x: wp.x, y: wp.y }, curRoom, { snapGrid: true }).point;
    draw();
  }
}
function onU() {
  if (referenceDragStart) {
    referenceDragStart = null;
    isDrag = false;
    dOrig = null;
    pushU();
    persistReferenceOverlayState();
    showP();
    return;
  }
  if (tool === "furniture" && document.getElementById("furnPickOv")) {
    isDrag = false;
    dOrig = null;
    updateCatalogPendingUi?.();
    return;
  }
  if (tool === "select" && sel.type && dOrig) {
    pushU();
    showP();
  }
  if (tool === "closet" && closetSt && pendEnd) {
    const x = Math.min(closetSt.x, pendEnd.x),
      y = Math.min(closetSt.y, pendEnd.y),
      w = Math.abs(pendEnd.x - closetSt.x),
      h = Math.abs(pendEnd.y - closetSt.y);
    if (w > 0.8 && h > 0.8) {
      const rect = {
        x: Math.round(x * 2) / 2,
        y: Math.round(y * 2) / 2,
        w: Math.round(Math.max(w, 1) * 2) / 2,
        h: Math.round(Math.max(h, 1) * 2) / 2,
      };
      if (rectInsideRoom(rect, curRoom) || rectNearRoom(rect, curRoom, 2)) {
        const cl = {
          id: uid(),
          type: "closet",
          rect,
          height: curRoom.height,
          look: "cabinetry",
          finish: curRoom.materials.closetStyle || "white_shaker",
        };
        curRoom.structures.push(cl);
        const ci = curRoom.structures.length - 1;
        tool = "select";
        document
          .querySelectorAll(".tb")
          .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
        sel = { type: "structure", idx: ci };
        panelHidden = false;
        pushU();
        showP();
        toast("Closet created");
      } else toast("Closet must stay near the room");
    } else if (w > 0.1 || h > 0.1) toast("Drag a larger area for closet");
    closetSt = null;
    pendEnd = null;
    draw();
  }
  if (tool === "partition" && partSt && pendEnd) {
    const dx = pendEnd.x - partSt.x,
      dy = pendEnd.y - partSt.y,
      len = Math.hypot(dx, dy);
    if (
      len > 1.2 &&
      (pointInsideRoom2D(partSt, curRoom) || pointNearRoom2D(partSt, curRoom, 2)) &&
      (pointInsideRoom2D(pendEnd, curRoom) || pointNearRoom2D(pendEnd, curRoom, 2))
    ) {
      const st = {
        id: uid(),
        type: "partition",
        line: {
          a: { x: Math.round(partSt.x * 2) / 2, y: Math.round(partSt.y * 2) / 2 },
          b: { x: Math.round(pendEnd.x * 2) / 2, y: Math.round(pendEnd.y * 2) / 2 },
        },
      };
      curRoom.structures.push(st);
      sel = { type: "structure", idx: curRoom.structures.length - 1 };
      tool = "select";
      document
        .querySelectorAll(".tb")
        .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
      panelHidden = false;
      pushU();
      showP();
      toast("Interior wall added");
    } else if (len > 0.2) toast("Keep the wall near the room");
    partSt = null;
    pendEnd = null;
    draw();
  }
  if (tool === "dim" && dimAnnStart && pendDimEnd) {
    const dx = pendDimEnd.x - dimAnnStart.x,
      dy = pendDimEnd.y - dimAnnStart.y,
      len = Math.hypot(dx, dy);
    if (len > 0.8) {
      curRoom.dimensionAnnotations.push({
        id: uid(),
        x1: Math.round(dimAnnStart.x * 2) / 2,
        z1: Math.round(dimAnnStart.y * 2) / 2,
        x2: Math.round(pendDimEnd.x * 2) / 2,
        z2: Math.round(pendDimEnd.y * 2) / 2,
        label: "",
        color: "#8E6E6B",
        fontSize: 13,
        offset: 0.8,
      });
      sel = { type: "dim_annotation", idx: curRoom.dimensionAnnotations.length - 1 };
      tool = "select";
      document
        .querySelectorAll(".tb")
        .forEach((b) => b.classList.toggle("on", b.dataset.t === "select"));
      panelHidden = false;
      pushU();
      showP();
      toast("Dimension note added");
    }
    dimAnnStart = null;
    pendDimEnd = null;
    draw();
  }
  isDrag = false;
  dOrig = null;
}
function onW(e) {
  e.preventDefault();
  const p = gP(e),
    wb = tW(p.x, p.y);
  vScale = Math.max(5, Math.min(80, vScale * (e.deltaY > 0 ? 0.9 : 1.1)));
  const wa = tW(p.x, p.y);
  vOff.x += (wa.x - wb.x) * vScale;
  vOff.y += (wa.y - wb.y) * vScale;
  draw();
}

// ── HIT TEST ──
function hitTest(sp) {
  const r = curRoom,
    hr = 18;
  for (let i = r.openings.length - 1; i >= 0; i--) {
    const op = r.openings[i],
      w = r.walls.find((x) => x.id === op.wallId);
    if (!w) continue;
    const a = wS(r, w),
      b = wE(r, w),
      wl = wL(r, w);
    if (!wl) continue;
    const an = wA(r, w),
      t = op.offset / wl,
      s = tS({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
      dx = sp.x - s.x,
      dy = sp.y - s.y,
      lx = dx * Math.cos(-an) - dy * Math.sin(-an),
      ly = dx * Math.sin(-an) + dy * Math.cos(-an),
      pad = hr * 0.65;
    if (
      Math.abs(lx) <= (op.width * vScale) / 2 + pad &&
      Math.abs(ly) <= Math.max(hr, Math.max(6, w.thickness * vScale))
    )
      return { type: "opening", idx: i };
  }
  for (let i = r.polygon.length - 1; i >= 0; i--) {
    const s = tS(r.polygon[i]);
    if (Math.hypot(s.x - sp.x, s.y - sp.y) < hr) return { type: "vertex", idx: i };
  }
  for (let i = r.structures.length - 1; i >= 0; i--) {
    const st = r.structures[i];
    if (st.rect) {
      const a = tS({ x: st.rect.x, y: st.rect.y }),
        b = tS({ x: st.rect.x + st.rect.w, y: st.rect.y + st.rect.h });
      if (sp.x >= a.x && sp.x <= b.x && sp.y >= a.y && sp.y <= b.y)
        return { type: "structure", idx: i };
    } else if (st.line) {
      const a = tS(st.line.a),
        b = tS(st.line.b);
      if (psd(sp.x, sp.y, a.x, a.y, b.x, b.y) < hr) return { type: "structure", idx: i };
    }
  }
  for (let i = (r.dimensionAnnotations || []).length - 1; i >= 0; i--) {
    const note = r.dimensionAnnotations[i],
      a = tS({ x: note.x1, y: note.z1 }),
      b = tS({ x: note.x2, y: note.z2 }),
      box = dimensionAnnotationScreenBox(note);
    if (psd(sp.x, sp.y, a.x, a.y, b.x, b.y) < 12) return { type: "dim_annotation", idx: i };
    if (box && sp.x >= box.x && sp.x <= box.x + box.w && sp.y >= box.y && sp.y <= box.y + box.h)
      return { type: "dim_annotation", idx: i };
  }
  for (let i = (r.textAnnotations || []).length - 1; i >= 0; i--) {
    const note = r.textAnnotations[i],
      box = annotationScreenBox(note);
    if (box && sp.x >= box.x && sp.x <= box.x + box.w && sp.y >= box.y && sp.y <= box.y + box.h)
      return { type: "annotation", idx: i };
  }
  for (let i = r.furniture.length - 1; i >= 0; i--) {
    if (pointInFurniture2D(sp, r.furniture[i])) return { type: "furniture", idx: i };
  }
  return null;
}
function psd(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay,
    l = dx * dx + dy * dy;
  if (!l) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function psw(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l = dx * dx + dy * dy;
  if (!l) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
function pointInsideRoom2D(pt, room) {
  return pointInPolygon(pt.x, -pt.y, room.polygon);
}
function pointNearRoom2D(pt, room, margin = 1.5) {
  if (pointInsideRoom2D(pt, room)) return true;
  // Check if point is within margin of the polygon bounding box (for hallways/adjacent rooms)
  const b = getRoomBounds2D(room);
  return (
    pt.x >= b.x0 - margin && pt.x <= b.x1 + margin && pt.y >= b.y0 - margin && pt.y <= b.y1 + margin
  );
}
function rectInsideRoom(rect, room) {
  const pts = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
  return pts.every((pt) => pointInsideRoom2D(pt, room));
}
function rectNearRoom(rect, room, margin = 1.5) {
  const pts = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
  return pts.every((pt) => pointNearRoom2D(pt, room, margin));
}
function pointInFurniture2D(sp, f) {
  const s = tS({ x: f.x, y: f.z }),
    dx = sp.x - s.x,
    dy = sp.y - s.y,
    an = (-(f.rotation || 0) * Math.PI) / 180;
  const lx = dx * Math.cos(an) - dy * Math.sin(an),
    ly = dx * Math.sin(an) + dy * Math.cos(an);
  if (f.assetKey === "sofa_l") {
    const w = f.w || 6,
      d = f.d || 3.6,
      seatDepth = d * 0.56,
      legWidth = w * 0.52;
    const inLong = Math.abs(lx) <= (w / 2) * vScale && Math.abs(ly) <= (seatDepth / 2) * vScale;
    const inReturn =
      lx <= (-w / 2 + legWidth) * vScale &&
      lx >= (-w / 2) * vScale &&
      ly >= (-d / 2) * vScale &&
      ly <= (d / 2) * vScale;
    return inLong || inReturn;
  }
  return Math.abs(lx) <= ((f.w || 2) * vScale) / 2 && Math.abs(ly) <= ((f.d || 1.5) * vScale) / 2;
}
function roomStyleChanged() {
  pushU();
  draw();
  if (!sel.type || sel.idx < 0) showP();
  applyRoomStyleToScene();
  scheduleRebuild3D();
}
function scheduleRebuild3D(delay = 90) {
  if (!is3D) return;
  if (rebuild3DTimer) clearTimeout(rebuild3DTimer);
  rebuild3DTimer = setTimeout(() => {
    rebuild3DTimer = null;
    if (is3D) rebuild3D();
  }, delay);
}
function applyRoomStyleToScene() {
  if (!is3D || !scene || !ren || !curRoom) return;
  const style = scene.userData?.styleTargets;
  if (!style) return;
  const resolveMaterialTarget = (entry) => entry?.material || entry?.mat || entry;
  const resolveNodeTarget = (entry) => entry?.node || entry?.mesh || entry?.light || entry;
  const resolveTargetRoom = (entry) => entry?.room || curRoom;
  const styleForRoom = (room) => {
    const lightState =
      typeof computeSceneLightingState === "function" ? computeSceneLightingState(room) : null;
    const preset = lightState?.preset || getLightingPreset(room);
    const wallColor = safeThreeColor(room.materials.wall, WALL_PALETTES[0].color);
    const wallFinish =
      WALL_PALETTES.find((w) => w.id === (room.materials.wallFinish || "warm_white")) ||
      WALL_PALETTES[0];
    const trimColor = safeThreeColor(room.materials.trim, TRIM_COLORS[0]);
    const floorPreset =
      FLOOR_TYPES.find((f) => f.id === room.materials.floorType) || FLOOR_TYPES[0];
    const floorColor = safeThreeColor(room.materials.floor, floorPreset.color);
    const ceilingColor = safeThreeColor(room.materials.ceiling, "#FAF7F2").multiplyScalar(
      Math.max(0.86, Math.min(1.18, room.materials.ceilingBrightness || 1)),
    );
    return {
      room,
      lightState,
      preset,
      wallColor,
      wallFinish,
      trimColor,
      floorPreset,
      floorColor,
      ceilingColor,
    };
  };
  const roomStyles = new Map();
  const getStyle = (room) => {
    const key = room?.id || curRoom.id;
    if (!roomStyles.has(key)) roomStyles.set(key, styleForRoom(room || curRoom));
    return roomStyles.get(key);
  };
  (style.wallMats || []).forEach((entry) => {
    const mat = resolveMaterialTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (mat?.color) {
      mat.color.copy(roomStyle.wallColor);
      mat.roughness = 0.62 - roomStyle.wallFinish.sheen * 0.14;
      mat.metalness = 0.01;
      if (mat.emissive) {
        mat.emissive
          .copy(roomStyle.wallColor)
          .multiplyScalar(roomStyle.room.materials.wallColorCustom ? 0.11 : 0.045);
      }
      mat.needsUpdate = true;
    }
  });
  (style.trimMats || []).forEach((entry) => {
    const mat = resolveMaterialTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (mat?.color) {
      mat.color.copy(roomStyle.trimColor);
      mat.needsUpdate = true;
    }
  });
  (style.floorMats || []).forEach((entry) => {
    const mat = resolveMaterialTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (mat?.color) {
      mat.color.copy(roomStyle.floorColor);
      mat.roughness = Math.max(
        0.78,
        Number.isFinite(roomStyle.floorPreset.roughness) ? roomStyle.floorPreset.roughness : 0.86,
      );
      mat.metalness = 0;
      mat.needsUpdate = true;
    }
  });
  const floorReflectors = style.floorReflectors || [style.floorReflector].filter(Boolean);
  floorReflectors.forEach((reflector) => {
    if (reflector?.parent) {
      reflector.parent.remove(reflector);
      reflector.material?.dispose?.();
      reflector.geometry?.dispose?.();
    }
  });
  style.floorReflector = null;
  (style.ceilingMats || []).forEach((entry) => {
    const mat = resolveMaterialTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (mat?.color) {
      mat.color.copy(roomStyle.ceilingColor);
      mat.needsUpdate = true;
    }
  });
  (style.floorMeshes || [style.floorMesh].filter(Boolean)).forEach((entry) => {
    const mesh = resolveNodeTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (mesh?.material?.map) {
      mesh.material.map.dispose?.();
      mesh.material.map = window.Planner3DTextures.buildFloorTexture({
        THREE,
        document,
        floorTypes: FLOOR_TYPES,
        safeThreeColor,
        color: roomStyle.room.materials.floor,
        type: roomStyle.room.materials.floorType || "light_oak",
      });
      mesh.material.map.needsUpdate = true;
      mesh.material.needsUpdate = true;
    }
  });
  (style.floorAccents || [style.floorAccent].filter(Boolean)).forEach((entry) => {
    const mesh = resolveNodeTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (mesh?.material) {
      const accentTone = roomStyle.floorColor
        .clone()
        .lerp(safeThreeColor("#ffffff", "#ffffff"), 0.46);
      mesh.material.color?.copy(accentTone);
      mesh.material.opacity =
        roomStyle.floorPreset.family === "checker"
          ? 0.36
          : roomStyle.floorPreset.family === "tile"
            ? 0.42
            : roomStyle.floorPreset.family === "concrete"
              ? 0.24
              : 0.34;
      mesh.material.needsUpdate = true;
    }
    if (mesh?.material?.map) {
      mesh.material.map.dispose?.();
      mesh.material.map = window.Planner3DTextures.buildFloorAccentTexture({
        THREE,
        document,
        floorTypes: FLOOR_TYPES,
        type: roomStyle.room.materials.floorType || "light_oak",
      });
      mesh.material.map.needsUpdate = true;
      mesh.material.needsUpdate = true;
    }
  });
  const activeLightState = getStyle(curRoom).lightState;
  const activePreset = getStyle(curRoom).preset;
  ren.toneMapping = THREE.ACESFilmicToneMapping;
  ren.toneMappingExposure = activeLightState?.exposure ?? activePreset.exposure;
  scene.background = (
    activeLightState?.background || safeThreeColor(activePreset.background, "#0f141c")
  ).clone();
  scene.fog = new THREE.Fog(
    scene.background.getHex(),
    activeLightState?.fogNear ?? activePreset.fogNear ?? 28,
    activeLightState?.fogFar ?? activePreset.fogFar ?? 82,
  );
  if (style.hemiLight) {
    style.hemiLight.intensity = activeLightState?.hemiIntensity ?? activePreset.ambient * 1.18;
    style.hemiLight.groundColor.copy(
      activeLightState?.warmColor || safeThreeColor(activePreset.warm, 0xfff1d3),
    );
  }
  if (style.ambLight) {
    style.ambLight.intensity = (activeLightState?.ambientIntensity ?? activePreset.ambient) * 0.76;
    style.ambLight.color.copy(
      activeLightState?.warmColor || safeThreeColor(activePreset.warm, 0xfff1d3),
    );
  }
  if (style.dirLight) {
    style.dirLight.intensity = activeLightState?.dirIntensity ?? activePreset.dir;
    style.dirLight.color.copy(
      activeLightState?.dirColor || safeThreeColor(activePreset.dirColor, 0xffffff),
    );
    if (activeLightState?.sunPosition)
      style.dirLight.position.set(
        activeLightState.sunPosition.x,
        activeLightState.sunPosition.y,
        activeLightState.sunPosition.z,
      );
  }
  if (style.fillLight) {
    style.fillLight.intensity = activeLightState?.fillIntensity ?? activePreset.ambient * 0.52;
    if (activeLightState?.fillPosition)
      style.fillLight.position.set(
        activeLightState.fillPosition.x,
        activeLightState.fillPosition.y,
        activeLightState.fillPosition.z,
      );
  }
  (style.ceilingLights || [style.ceilingLight].filter(Boolean)).forEach((entry) => {
    const light = resolveNodeTarget(entry),
      roomStyle = getStyle(resolveTargetRoom(entry));
    if (light) light.intensity = 0.28 * (roomStyle.room.materials.ceilingBrightness || 1);
  });
  (style.practicalLights || []).forEach((entry) => {
    if (!entry?.light) return;
    const roomStyle = getStyle(resolveTargetRoom(entry));
    const baseIntensity = Number(entry.baseIntensity) || 1;
    const baseDistance = Number(entry.baseDistance) || 6;
    entry.light.intensity =
      baseIntensity *
      Math.max(
        0.08,
        roomStyle.lightState?.practicalMultiplier ?? (roomStyle.preset.practical || 0.04),
      ) *
      (roomStyle.room.materials.ceilingBrightness || 1);
    if ("distance" in entry.light)
      entry.light.distance =
        baseDistance *
        (((roomStyle.lightState?.practicalMultiplier ?? roomStyle.preset.practical) || 0) > 0.8
          ? 1.08
          : 1);
    if (entry.light.color?.copy)
      entry.light.color.copy(
        roomStyle.lightState?.warmColor || safeThreeColor(roomStyle.preset.warm, 0xfff1d3),
      );
  });
}
function setAdjRoomWidth(v) {
  adjRoomCfg.width = Math.max(6, Math.min(30, parseDistanceInput(v, adjRoomCfg.width || 10)));
  showP();
}
function setAdjRoomDepth(v) {
  adjRoomCfg.depth = Math.max(6, Math.min(30, parseDistanceInput(v, adjRoomCfg.depth || 10)));
  showP();
}
function wallMatchesSide(room, wall, side, b) {
  const a = wS(room, wall),
    e = wE(room, wall),
    eps = 0.01;
  if ((side === "east" || side === "west") && Math.abs(a.x - e.x) < eps) {
    const x = a.x;
    if (side === "east" && Math.abs(x - b.x1) < eps) return true;
    if (side === "west" && Math.abs(x - b.x0) < eps) return true;
  }
  if ((side === "south" || side === "north") && Math.abs(a.y - e.y) < eps) {
    const y = a.y;
    if (side === "south" && Math.abs(y - b.y1) < eps) return true;
    if (side === "north" && Math.abs(y - b.y0) < eps) return true;
  }
  return false;
}
function oppositeSide(side) {
  return { north: "south", south: "north", east: "west", west: "east" }[side] || "south";
}
function directionLabel(side) {
  return { north: "up", south: "down", east: "right", west: "left" }[side] || side;
}
function attachAdjacentRoom(side, width = adjRoomCfg.width, depth = adjRoomCfg.depth) {
  if (!curRoom || !curRoom.polygon?.length) return;
  const b = getRoomBounds2D(curRoom);
  const shared = Math.max(
    6,
    Math.min(width, side === "east" || side === "west" ? b.height : b.width),
  );
  const roomDepth = Math.max(6, depth);
  let poly, name;
  if (side === "east" || side === "west") {
    const midY = b.cy,
      start = midY - shared / 2,
      end = midY + shared / 2;
    const x0 = side === "east" ? b.x1 : b.x0 - roomDepth;
    const x1 = side === "east" ? b.x1 + roomDepth : b.x0;
    poly = [
      { x: x0, y: start },
      { x: x1, y: start },
      { x: x1, y: end },
      { x: x0, y: end },
    ];
  } else {
    const midX = b.cx,
      start = midX - shared / 2,
      end = midX + shared / 2;
    const y0 = side === "south" ? b.y1 : b.y0 - roomDepth;
    const y1 = side === "south" ? b.y1 + roomDepth : b.y0;
    poly = [
      { x: start, y: y0 },
      { x: end, y: y0 },
      { x: end, y: y1 },
      { x: start, y: y1 },
    ];
  }
  name = `${curRoom.name} ${side.charAt(0).toUpperCase() + side.slice(1)}`;
  const nextOrder = projectMainRooms(curRoom).length;
  const newRoom = normalizeRoom({
    id: uid(),
    projectId: curRoom.projectId,
    projectName: curRoom.projectName,
    floorId: curRoom.floorId,
    floorLabel: curRoom.floorLabel,
    floorOrder: curRoom.floorOrder,
    roomOrder: nextOrder,
    name,
    height: curRoom.height,
    wallThickness: curRoom.wallThickness || 0.5,
    polygon: poly,
    openings: [],
    structures: [],
    furniture: [],
    materials: JSON.parse(JSON.stringify(curRoom.materials || {})),
    roomType: curRoom.roomType || "living_room",
    designPreset: curRoom.designPreset || "",
    mood: curRoom.mood || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    favorite: curRoom.favorite,
  });
  const currentBounds = getRoomBounds2D(curRoom);
  const currentWall = curRoom.walls.find((w) => wallMatchesSide(curRoom, w, side, currentBounds));
  if (currentWall) {
    const doorWidth = Math.min(4, Math.max(3, wL(curRoom, currentWall) - 1));
    curRoom.openings.push({
      id: uid(),
      type: "door",
      wallId: currentWall.id,
      offset: wL(curRoom, currentWall) / 2,
      width: doorWidth,
      height: 7,
      swing: "in",
      hinge: "left",
    });
  }
  const opposite = oppositeSide(side);
  const targetBounds = getRoomBounds2D(newRoom);
  const targetWall = newRoom.walls.find((w) => wallMatchesSide(newRoom, w, opposite, targetBounds));
  if (targetWall) {
    const doorWidth = Math.min(4, Math.max(3, wL(newRoom, targetWall) - 1));
    newRoom.openings.push({
      id: uid(),
      type: "door",
      wallId: targetWall.id,
      offset: wL(newRoom, targetWall) / 2,
      width: doorWidth,
      height: 7,
      swing: "in",
      hinge: "left",
    });
  }
  curRoom.connections = [
    ...(curRoom.connections || []).filter((link) => link.roomId !== newRoom.id),
    { roomId: newRoom.id, side, via: "door", label: newRoom.name },
  ];
  newRoom.connections = [{ roomId: curRoom.id, side: opposite, via: "door", label: curRoom.name }];
  projects.push(newRoom);
  saveAll();
  renderHome();
  openEd(newRoom);
  toast(`Room added ${directionLabel(side)}`);
}
function clampOpeningToWall(op) {
  if (!curRoom || !op) return;
  const wall = curRoom.walls.find((x) => x.id === op.wallId);
  if (!wall) return;
  const wl = wL(curRoom, wall),
    half = Math.max(0.5, (op.width || 2.5) / 2);
  op.offset = Math.max(half, Math.min(wl - half, op.offset || half));
}
function updateOpeningFromPoint(idx, wp) {
  const op = curRoom?.openings?.[idx];
  const target = findNWO(wp);
  if (!op || !target) return;
  const wall = curRoom.walls[target.wi];
  if (!wall) return;
  op.wallId = wall.id;
  op.offset = target.off;
  clampOpeningToWall(op);
}
function findNW(wp) {
  let b = -1,
    bd = Infinity;
  const snapDist = Math.max(2, 3 / Math.max(1, vScale / 20));
  curRoom.walls.forEach((w, i) => {
    const d = psw(wp, wS(curRoom, w), wE(curRoom, w));
    if (d < bd) {
      bd = d;
      b = i;
    }
  });
  return bd < snapDist ? b : null;
}
function findNWO(wp) {
  let best = null,
    bd = Infinity;
  const snapDist = Math.max(2, 3 / Math.max(1, vScale / 20));
  curRoom.walls.forEach((w, i) => {
    const d = psw(wp, wS(curRoom, w), wE(curRoom, w));
    if (d < bd && d < snapDist) {
      const a = wS(curRoom, w),
        b = wE(curRoom, w),
        dx = b.x - a.x,
        dy = b.y - a.y,
        wl = wL(curRoom, w),
        t = ((wp.x - a.x) * dx + (wp.y - a.y) * dy) / (dx * dx + dy * dy);
      bd = d;
      best = { wi: i, off: Math.round(Math.max(1.5, Math.min(wl - 1.5, t * wl)) * 4) / 4 };
    }
  });
  return best;
}
function addVtx(wi, wp) {
  const w = curRoom.walls[wi];
  curRoom.polygon.splice(w.startIdx + 1, 0, {
    x: Math.round(wp.x * 2) / 2,
    y: Math.round(wp.y * 2) / 2,
  });
  curRoom.walls = genWalls(curRoom);
  sel = { type: "vertex", idx: w.startIdx + 1 };
  pushU();
  showP();
  draw();
  toast("Vertex added");
}

function setTool(t) {
  tool = t === "wall" ? "draw" : t;
  document.querySelectorAll(".tb").forEach((b) => b.classList.toggle("on", b.dataset.t === t));
  closetSt = null;
  pendEnd = null;
  dimAnnStart = null;
  pendDimEnd = null;
  lastPlanSnapState = null;
  if (
    t !== "furniture" &&
    typeof closeFurnPick === "function" &&
    document.getElementById("furnPickOv")
  )
    closeFurnPick();
  if (t !== "select") {
    clearFurnitureSelection();
    sel = { type: null, idx: -1 };
    if (isTouchUi() && window.innerWidth <= 760) panelHidden = true;
    hideP();
  } else if (isTouchUi() && window.innerWidth <= 760 && !sel.type) {
    panelHidden = true;
    hideP();
  }
  draw();
}
