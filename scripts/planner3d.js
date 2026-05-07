let cameraScript = null,
  walkthroughTrayOpen = false,
  photoMode = false,
  photoTrayOpen = false,
  presentationShot = "hero",
  composer = null,
  last2DViewState = null;
// HDRI environment maps (Poly Haven CC0, served via jsDelivr). Cached across scene rebuilds.
const HDRI_SOURCES = {
  daylight:
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/royal_esplanade_1k.hdr",
  evening:
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/moonless_golf_1k.hdr",
  warm: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/venice_sunset_1k.hdr",
};
const _hdriCache = new Map();
function _resolveHdriKey(id) {
  return id === "evening" || id === "night" || id === "moody" || id === "lamp_lit"
    ? "evening"
    : id === "warm" ||
        id === "sunset" ||
        id === "warm_evening" ||
        id === "soft_lamp_glow" ||
        id === "golden_hour" ||
        id === "dawn"
      ? "warm"
      : "daylight";
}
function loadHDRIEnvironment(presetId, renderer, sceneRef) {
  if (!window.THREE || !THREE.RGBELoader || !THREE.PMREMGenerator) return;
  const key = _resolveHdriKey(presetId);
  const url = HDRI_SOURCES[key];
  if (!url) return;
  const apply = (envMap) => {
    if (sceneRef && sceneRef === scene) {
      sceneRef.environment = envMap;
      sceneRef.userData.currentHdriKey = key;
    }
  };
  if (_hdriCache.has(key)) {
    apply(_hdriCache.get(key));
    return;
  }
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    new THREE.RGBELoader().setDataType(THREE.HalfFloatType).load(
      url,
      (tex) => {
        const env = pmrem.fromEquirectangular(tex).texture;
        _hdriCache.set(key, env);
        tex.dispose();
        pmrem.dispose();
        apply(env);
      },
      undefined,
      (err) => {
        console.warn("HDRI load failed:", err);
      },
    );
  } catch (e) {
    console.warn("HDRI setup failed:", e);
  }
}
// Time-of-day lighting is data-driven by Planner3DLighting and cheap enough for slider drag.
function applyTimeOfDay(t) {
  if (!scene || !curRoom) return;
  const lighting = window.Planner3DLighting;
  if (!lighting) return;
  t = Math.max(0, Math.min(1, t));
  // Update room metadata so it persists + rebuilds pick it up
  curRoom.materials = curRoom.materials || {};
  curRoom.materials.timeOfDay = t;
  // Live background tint follows the shared time-of-day curve.
  const col = lighting.skyColor(t);
  try {
    scene.background = new THREE.Color(col);
    if (scene.fog) scene.fog.color = new THREE.Color(col);
  } catch (error) {
    window.reportRoseRecoverableError?.("3D time-of-day background update failed", error);
  }
  // Exposure curve: darker at night, brighter at noon
  if (ren) {
    ren.toneMappingExposure = lighting.exposureForTimeOfDay(t, photoMode);
  }
  // Swap HDRI if the TOD bucket changed
  const targetKey = lighting.hdriForTimeOfDay(t);
  if (scene.userData.currentHdriKey !== targetKey) {
    loadHDRIEnvironment(targetKey, ren, scene);
  }
  // Directional light tint + intensity
  const dir = scene.userData?.styleTargets?.dirLight;
  if (dir) {
    const warm = lighting.directionalColor(t);
    try {
      dir.color = new THREE.Color(warm);
    } catch (error) {
      window.reportRoseRecoverableError?.("3D directional light color update failed", error);
    }
    dir.intensity = lighting.directionalIntensityForTimeOfDay(t);
  }
  const hemi = scene.userData?.styleTargets?.hemiLight;
  if (hemi) {
    hemi.intensity = lighting.hemisphereIntensityForTimeOfDay(t);
  }
}
if (typeof window !== "undefined") {
  window.applyTimeOfDay = applyTimeOfDay;
}

// ═══════════════════════════════════
// 3D — IMMERSIVE WALKTHROUGH
// ═══════════════════════════════════
function show3DLoading() {
  let el = document.getElementById("threedLoading");
  if (!el) {
    el = document.createElement("div");
    el.id = "threedLoading";
    el.className = "threed-loading";
    const dot = document.createElement("div");
    dot.className = "threed-loading-dot";
    const lbl = document.createElement("div");
    lbl.className = "threed-loading-label";
    lbl.textContent = "Building 3D view…";
    el.append(dot, lbl);
    document.getElementById("cWrap")?.appendChild(el);
  }
  el.classList.remove("fade");
  el.style.display = "";
}
function hide3DLoading() {
  const el = document.getElementById("threedLoading");
  if (!el) return;
  el.classList.add("fade");
  setTimeout(() => {
    el.style.display = "none";
  }, 400);
}
function toggle3D() {
  if (is3D) {
    exit3DView();
    return;
  }
  if (!window.THREE) {
    toast("3D library could not load");
    return;
  }
  if (!curRoom || !curRoom.polygon.length) {
    toast("Create a room first");
    return;
  }
  assetWarned = false;
  presentationMode = false;
  compare3DMode = false;
  photoMode = false;
  photoTrayOpen = false;
  last2DViewState = { vScale, vOff: { ...vOff } };
  is3D = true;
  panelHidden = false;
  document.getElementById("threeC").classList.add("on");
  document.getElementById("b3d").classList.add("on");
  document.getElementById("vLbl").textContent = "Step Inside 3D";
  document.getElementById("camBtns").classList.add("on");
  document.getElementById("cmCompare").classList.remove("act");
  document.getElementById("cmPhoto")?.classList.remove("act");
  document.getElementById("scrEd").classList.add("mode-3d");
  hideP();
  show3DLoading();
  build3D();
  setTimeout(() => {
    if (is3D) {
      setViewPreset("eye");
      showViewChip("3D View - Room");
      hide3DLoading();
    }
  }, 80);
  updateWalkthroughTray();
  updatePhotoTray();
}

function presentationShotLabel(mode) {
  return window.Planner3DCamera?.presentationShotLabel(mode) || "Hero View";
}
let viewChipTimer = null;
function walkthroughPresetLabel(id) {
  return window.Planner3DCamera?.walkthroughPresetLabel(id) || "Walkthrough";
}
function photoPresetLabel(mode) {
  return window.Planner3DCamera?.photoPresetLabel(mode) || "Hero Shot";
}
function viewPresetLabel(mode) {
  return window.Planner3DCamera?.viewPresetLabel(mode) || "Orbit";
}
function showViewChip(label, ms = 3400) {
  const chip = document.getElementById("viewChip");
  if (!chip || !label) return;
  chip.textContent = label;
  chip.classList.add("show");
  if (viewChipTimer) clearTimeout(viewChipTimer);
  viewChipTimer = setTimeout(() => chip.classList.remove("show"), ms);
}
function hideViewChip() {
  const chip = document.getElementById("viewChip");
  if (viewChipTimer) clearTimeout(viewChipTimer);
  viewChipTimer = null;
  chip?.classList.remove("show");
}
function roomStoryLine(room = curRoom) {
  if (!room) return "A polished view for reviewing the current design direction.";
  const direction =
    (typeof DESIGN_PRESETS !== "undefined" && Array.isArray(DESIGN_PRESETS)
      ? DESIGN_PRESETS.find((p) => p.id === room.designPreset)?.name
      : "") || "Current Direction";
  const mood = (room.mood || "").trim();
  const label = room.optionName || room.name || "This room";
  if (mood) return `${label} is framed as ${mood} ${direction.toLowerCase()} living.`;
  return `${label} is framed as ${direction.toLowerCase()} living.`;
}
function roomCentroidPose(room = curRoom) {
  return window.Planner3DCamera?.roomCentroid(room, { getRoomFocus }) || { x: 0, z: 0 };
}
function currentFloor3DRooms(room = curRoom) {
  if (!room || typeof currentFloorRooms !== "function") return [room].filter(Boolean);
  const rooms = currentFloorRooms(room, room.floorId || activeProjectFloorId) || [];
  return rooms.length ? rooms : [room];
}
function getRoomsFocus(rooms = [curRoom]) {
  const valid = (rooms || []).filter((room) => room?.polygon?.length);
  if (!valid.length) return getRoomFocus(curRoom);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    maxH = 0;
  valid.forEach((room) => {
    room.polygon.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    });
    maxH = Math.max(maxH, room.height || 0);
  });
  const width = Math.max(1, maxX - minX),
    height = Math.max(1, maxY - minY);
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width,
    height,
    maxD: Math.max(width, height),
    height3D: maxH || curRoom?.height || 9,
  };
}
function overviewRoomPose(room = curRoom) {
  return window.Planner3DCamera.overviewRoomPose(room, {
    getRoomFocus,
    currentFloor3DRooms,
    getRoomsFocus,
  });
}
function addGhostRoomShell(room, wallColor, floorColor) {
  if (!scene || !room?.polygon?.length) return;
  const roomShell = window.Planner3DRoomShell;
  const floorShape = roomShell.createPlanShape(THREE, room.polygon);
  const floorMat = new THREE.MeshStandardMaterial({
    color: floorColor.clone(),
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const floorMesh = new THREE.Mesh(new THREE.ShapeGeometry(floorShape), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0.01;
  floorMesh.renderOrder = -2;
  scene.add(floorMesh);
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor.clone(),
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  (room.walls || []).forEach((wall) => {
    const a = wS(room, wall),
      b = wE(room, wall),
      wl = wL(room, wall),
      an = wA(room, wall);
    if (wl < 0.08) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wl, room.height || 9, 0.1), wallMat);
    mesh.position.set((a.x + b.x) / 2, (room.height || 9) / 2, -(a.y + b.y) / 2);
    mesh.rotation.y = -an;
    scene.add(mesh);
  });
}
function intimateRoomPose(room = curRoom) {
  return window.Planner3DCamera.intimateRoomPose(room, { getRoomFocus });
}
function heroRoomPose(room = curRoom) {
  return window.Planner3DCamera.heroRoomPose(room, { getRoomFocus, getRoomBounds2D });
}
function refreshPresentationPill() {
  const pill = document.getElementById("presentPill");
  if (!pill) return;
  const compareLabel =
    compare3DMode && curRoom
      ? `${PLAN_VIEW_MODES[currentPlanViewMode(curRoom)] || "Combined"} View`
      : "";
  let text = "Presentation Mode";
  if (presentationMode) text = `Reveal Mode - ${presentationShotLabel(presentationShot)}`;
  else if (compare3DMode) text = compareLabel;
  pill.textContent = text;
  pill.classList.toggle("on", presentationMode || compare3DMode);
}
function replaceOrAppend3DTray(existing, node) {
  if (existing) existing.replaceWith(node);
  else document.getElementById("cWrap")?.appendChild(node);
}
function createMiniActionButton(label, action, { secondary = false, dataset = {} } = {}) {
  const button = document.createElement("button");
  button.className = `mini-chip${secondary ? " secondary" : ""}`;
  button.type = "button";
  button.dataset.action = action;
  Object.entries(dataset).forEach(([key, value]) => {
    button.dataset[key] = String(value);
  });
  button.textContent = label;
  return button;
}
function createTrayTitleBlock(titleClass, titleText, copyClass, copyText) {
  const block = document.createElement("div");
  const title = document.createElement("div");
  title.className = titleClass;
  title.textContent = titleText;
  const copy = document.createElement("div");
  copy.className = copyClass;
  copy.textContent = copyText;
  block.append(title, copy);
  return block;
}
function createWalkthroughTrayNode({ title, copy, presets, isTouch }) {
  const root = document.createElement("div");
  root.className = `tour-tray${isTouch ? " touch" : ""}`;
  root.id = "tourTray";
  const panel = document.createElement("div");
  panel.className = `tour-panel${isTouch ? " touch" : ""}`;
  const head = document.createElement("div");
  head.className = "tour-head";
  head.append(
    createTrayTitleBlock("tour-title", title, "tour-copy", copy),
    createMiniActionButton("Close", "toggle-walkthrough-tray", { secondary: true }),
  );
  const grid = document.createElement("div");
  grid.className = `tour-grid${isTouch ? " touch" : ""}`;
  presets.forEach(([id, label, presetCopy]) => {
    const button = document.createElement("button");
    button.className = `tour-preset${isTouch ? " touch" : ""}`;
    button.type = "button";
    button.dataset.action = "start-walkthrough-preset";
    button.dataset.presetId = id;
    const presetTitle = document.createElement("span");
    presetTitle.className = "tour-preset-title";
    presetTitle.textContent = label;
    const copyEl = document.createElement("span");
    copyEl.className = "tour-preset-copy";
    copyEl.textContent = presetCopy;
    button.append(presetTitle, copyEl);
    grid.appendChild(button);
  });
  panel.append(head, grid);
  root.appendChild(panel);
  return root;
}
function createPhotoTrayNode({ copy, presets, resetLabel, resetPreset }) {
  const root = document.createElement("div");
  root.className = "photo-tray";
  root.id = "photoTray";
  const panel = document.createElement("div");
  panel.className = "photo-panel";
  const head = document.createElement("div");
  head.className = "photo-head";
  head.append(
    createTrayTitleBlock("photo-title", "Photo Mode", "photo-copy", copy),
    createMiniActionButton("Exit", "toggle-photo-mode", {
      secondary: true,
      dataset: { photoForce: "false" },
    }),
  );
  const grid = document.createElement("div");
  grid.className = "photo-grid";
  presets.forEach(([id, label, presetCopy]) => {
    const button = document.createElement("button");
    button.className = "photo-preset";
    button.type = "button";
    button.dataset.action = "set-photo-preset";
    button.dataset.photoPreset = id;
    const presetTitle = document.createElement("span");
    presetTitle.className = "photo-preset-title";
    presetTitle.textContent = label;
    const copyEl = document.createElement("span");
    copyEl.className = "photo-preset-copy";
    copyEl.textContent = presetCopy;
    button.append(presetTitle, copyEl);
    grid.appendChild(button);
  });
  const actions = document.createElement("div");
  actions.className = "photo-actions";
  actions.append(
    createMiniActionButton("Capture PNG", "capture-photo-mode"),
    createMiniActionButton(resetLabel, "set-view-preset", {
      secondary: true,
      dataset: { viewPreset: resetPreset },
    }),
  );
  panel.append(head, grid, actions);
  root.appendChild(panel);
  return root;
}
function createPresentationTrayNode(stats, shots) {
  const root = document.createElement("div");
  root.className = "present-tray";
  root.id = "presentTray";
  const panel = document.createElement("div");
  panel.className = "present-panel";
  const head = document.createElement("div");
  head.className = "present-head";
  const headCopy = document.createElement("div");
  const title = document.createElement("div");
  title.className = "present-title";
  title.textContent = "Reveal Mode";
  const copy = document.createElement("div");
  copy.className = "present-copy";
  copy.textContent = roomStoryLine(curRoom);
  headCopy.append(title, copy);
  head.append(
    headCopy,
    createMiniActionButton("Exit", "toggle-presentation-mode", { secondary: true }),
  );

  const story = document.createElement("div");
  story.className = "present-story";
  const storyLabel = document.createElement("span");
  storyLabel.className = "present-story-label";
  storyLabel.textContent = curRoom.optionName || curRoom.name || "Room Story";
  const storyMeta = document.createElement("span");
  storyMeta.className = "present-story-meta";
  storyMeta.textContent = `Keep ${stats.keep} | Move ${stats.move} | Replace ${stats.replace} | Remove ${stats.remove}`;
  story.append(storyLabel, storyMeta);

  const grid = document.createElement("div");
  grid.className = "present-grid";
  shots.forEach(([id, label, shotCopy]) => {
    const button = document.createElement("button");
    button.className = `present-shot${presentationShot === id ? " active" : ""}`;
    button.type = "button";
    button.dataset.action = "set-presentation-shot";
    button.dataset.shot = id;
    const shotTitle = document.createElement("span");
    shotTitle.className = "present-shot-title";
    shotTitle.textContent = label;
    const shotCopyEl = document.createElement("span");
    shotCopyEl.className = "present-shot-copy";
    shotCopyEl.textContent = shotCopy;
    button.append(shotTitle, shotCopyEl);
    grid.appendChild(button);
  });

  const actions = document.createElement("div");
  actions.className = "present-actions";
  actions.append(
    createMiniActionButton("Capture Cover", "capture-presentation-still"),
    createMiniActionButton("Cycle Compare View", "toggle-3d-compare-mode", { secondary: true }),
    createMiniActionButton("Open Photo Mode", "toggle-photo-mode", {
      secondary: true,
      dataset: { photoForce: "true" },
    }),
  );
  panel.append(head, story, grid, actions);
  root.appendChild(panel);
  return root;
}
function updatePresentationTray() {
  const existing = document.getElementById("presentTray");
  if (!is3D || !presentationMode || photoMode) {
    if (existing) existing.remove();
    return;
  }
  const stats = collectRoomPlanStats(curRoom);
  const shots = [
    ["hero", "Hero View", "Balanced framing for a polished first impression."],
    ["favorite", "Favorite Corner", "Leans into the room's strongest composed angle."],
    ["overview", "Whole Room", "Pulls back for a calm, readable room overview."],
    ["intimate", "Intimate View", "Moves closer for warmer, more editorial storytelling."],
    [
      "before_after",
      "Before / After",
      "Stages the existing, redesign, and combined story in sequence.",
    ],
  ];
  replaceOrAppend3DTray(existing, createPresentationTrayNode(stats, shots));
  refreshPresentationPill();
}

function togglePresentationMode() {
  if (!is3D) return;
  if (photoMode) togglePhotoMode(false);
  presentationMode = !presentationMode;
  document.getElementById("scrEd").classList.toggle("presentation", presentationMode);
  document.getElementById("cmPresent")?.classList.toggle("act", presentationMode);
  if (presentationMode) {
    walkthroughTrayOpen = false;
    document.getElementById("cmTour")?.classList.remove("act");
    presentationShot = "hero";
    compare3DMode = false;
    curRoom.planViewMode = "combined";
    document.getElementById("cmCompare")?.classList.remove("act");
    setPresentationShot("hero");
  } else cameraScript = null;
  refreshPresentationPill();
  updatePresentationTray();
}
function setViewPreset(mode) {
  if (!is3D || !curRoom) return;
  const focus = getRoomFocus(curRoom);
  const floorRooms = currentFloor3DRooms(curRoom);
  camMode = "orbit";
  document.getElementById("cmOrbit").classList.add("act");
  document.getElementById("cmWalk").classList.remove("act");
  if (mode === "hero") {
    const pose = heroRoomPose(curRoom);
    cYaw = pose.yaw;
    cPitch = pose.pitch;
    cDist = pose.dist;
    orbitTarget = { ...pose.target };
    showViewChip("3D View - " + viewPresetLabel(mode));
    return;
  }
  if (mode === "overview") {
    const pose = overviewRoomPose(curRoom);
    cYaw = pose.yaw;
    cPitch = pose.pitch;
    cDist = pose.dist;
    orbitTarget = { ...pose.target };
    showViewChip("3D View - " + (floorRooms.length > 1 ? "Whole Floor" : viewPresetLabel(mode)));
    return;
  } else if (mode === "corner") {
    const pose = favoriteCornerPose(curRoom);
    cYaw = pose.yaw;
    cPitch = pose.pitch;
    cDist = Math.max(10, Math.min(20, pose.dist));
    orbitTarget = { ...pose.target };
    showViewChip("3D View - " + viewPresetLabel(mode));
    return;
  } else if (mode === "eye") {
    const pose = intimateRoomPose(curRoom);
    cYaw = pose.yaw;
    cPitch = pose.pitch;
    cDist = pose.dist;
    orbitTarget = { ...pose.target };
    showViewChip("3D View - " + viewPresetLabel(mode));
    return;
  }
  orbitTarget = { x: focus.x, y: curRoom.height * 0.42, z: -focus.y };
  showViewChip("3D View - " + viewPresetLabel(mode));
}
function focusFurniture3D(itemOrId) {
  if (!is3D || !curRoom) return;
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  const item = (curRoom.furniture || []).find((f) => f.id === id) || itemOrId;
  if (!item) return;
  const placement = getFurniturePlacement(item, curRoom);
  camMode = "orbit";
  document.getElementById("cmOrbit").classList.add("act");
  document.getElementById("cmWalk").classList.remove("act");
  orbitTarget = {
    x: placement.position.x,
    y: Math.max(0.9, placement.position.y + verificationTargetSize(item.assetKey || "").h * 0.22),
    z: placement.position.z,
  };
  cDist = Math.max(6.8, Math.min(18, Math.max(item.w || 2, item.d || 2) * 3.1));
  cPitch = 0.34;
  cYaw = Math.PI * 0.14;
}
function capturePhotoMode(download = true) {
  if (!is3D || !ren || !cam) return null;
  const size = ren.getSize(new THREE.Vector2());
  const prevRatio = ren.getPixelRatio();
  const targetRatio = Math.min(
    (photoMode ? 2.4 : 2) * Math.max(1, window.devicePixelRatio || 1),
    3,
  );
  ren.setPixelRatio(targetRatio);
  ren.setSize(size.x, size.y, false);
  if (composer) {
    composer.setSize(size.x, size.y);
    if (composer._fxaa) {
      const pr = ren.getPixelRatio();
      composer._fxaa.material.uniforms["resolution"].value.set(
        1 / (size.x * pr),
        1 / (size.y * pr),
      );
    }
    composer.render();
  } else ren.render(scene, cam);
  const dataUrl = ren.domElement.toDataURL("image/png");
  ren.setPixelRatio(prevRatio);
  ren.setSize(size.x, size.y, false);
  if (composer) {
    composer.setSize(size.x, size.y);
    if (composer._fxaa) {
      const pr = ren.getPixelRatio();
      composer._fxaa.material.uniforms["resolution"].value.set(
        1 / (size.x * pr),
        1 / (size.y * pr),
      );
    }
    composer.render();
  } else ren.render(scene, cam);
  if (download) {
    window.ExportDownloads.downloadDataUrl(
      dataUrl,
      window.ExportFilenames.fileName(curRoom, "photo_mode", "png"),
    );
    toast("Photo capture exported");
  }
  return dataUrl;
}
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function applyCameraTween(from, to, t) {
  const p = easeInOut(Math.max(0, Math.min(1, t)));
  camMode = "orbit";
  cYaw = from.yaw + (to.yaw - from.yaw) * p;
  cPitch = from.pitch + (to.pitch - from.pitch) * p;
  cDist = from.dist + (to.dist - from.dist) * p;
  orbitTarget = {
    x: from.target.x + (to.target.x - from.target.x) * p,
    y: from.target.y + (to.target.y - from.target.y) * p,
    z: from.target.z + (to.target.z - from.target.z) * p,
  };
}
function applyWalkTween(from, to, t) {
  const p = easeInOut(Math.max(0, Math.min(1, t)));
  camMode = "walk";
  fpPos.x = from.x + (to.x - from.x) * p;
  fpPos.z = from.z + (to.z - from.z) * p;
}
function playCameraSequence(steps) {
  cameraScript = { steps, index: -1, stepStart: performance.now() };
}
function setCompareModeForTour(mode) {
  if (!curRoom) return;
  curRoom.planViewMode = mode;
  compare3DMode = mode !== "combined";
  const btn = document.getElementById("cmCompare");
  if (btn) btn.classList.toggle("act", compare3DMode);
  refreshPresentationPill();
  updatePresentationTray();
  scheduleRebuild3D(30);
}
function findTourWalkPoint(index, total) {
  const floorRooms = currentFloor3DRooms(curRoom);
  const focus = floorRooms.length > 1 ? getRoomsFocus(floorRooms) : getRoomFocus(curRoom),
    radius = Math.max(1.4, Math.min(focus.maxD * 0.35, 4.8)),
    angle = -Math.PI * 0.25 + (index / Math.max(1, total - 1)) * Math.PI * 0.5;
  const candidate = {
    x: focus.x + Math.cos(angle) * radius,
    z: -focus.y + Math.sin(angle) * radius,
  };
  return clampWalkPos(candidate.x, candidate.z, floorRooms) ? candidate : findWalkStart(floorRooms);
}
// Easing curves for walkthrough. Previously progress was linear, so every
// camera move felt robotic. easeInOutCubic on the default, easeOutQuint on reveals.
function _easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function _easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}
function _easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}
function updateCameraScript(now) {
  if (!cameraScript || !cameraScript.steps?.length) return;
  if (cameraScript.index === -1) {
    cameraScript.index = 0;
    cameraScript.stepStart = now;
    cameraScript.steps[0].onStart?.();
  }
  const step = cameraScript.steps[cameraScript.index];
  const raw = Math.max(
    0,
    Math.min(1, (now - cameraScript.stepStart) / Math.max(1, step.duration || 1)),
  );
  const ease = step.ease || "inOutCubic";
  const progress =
    ease === "outQuint"
      ? _easeOutQuint(raw)
      : ease === "inOutQuart"
        ? _easeInOutQuart(raw)
        : ease === "linear"
          ? raw
          : _easeInOutCubic(raw);
  step.apply?.(progress);
  if (raw >= 1) {
    cameraScript.index += 1;
    if (cameraScript.index >= cameraScript.steps.length) {
      cameraScript = null;
      return;
    }
    cameraScript.stepStart = now;
    cameraScript.steps[cameraScript.index].onStart?.();
  }
}

function setCamMode(m) {
  camMode = m;
  document.getElementById("cmOrbit").classList.toggle("act", m === "orbit");
  document.getElementById("cmWalk").classList.toggle("act", m === "walk");
  const r = curRoom,
    floorRooms = currentFloor3DRooms(r),
    focus = floorRooms.length > 1 ? getRoomsFocus(floorRooms) : getRoomFocus(r);
  orbitTarget = {
    x: focus.x,
    y: (floorRooms.length > 1 ? focus.height3D || r.height : r.height) * 0.42,
    z: -focus.y,
  };
  if (scene) {
    scene.traverse((obj) => {
      if (obj.name === "roomCeiling" || obj.name === "roomCeilingDetails")
        obj.visible = m === "walk";
    });
  }
  if (m === "walk") {
    const start = findWalkStart(floorRooms);
    const startRoom = getWalkRoomAtPoint?.(start.x, start.z, floorRooms) || r;
    fpPos = {
      x: start.x,
      y: Math.max(
        4.9,
        Math.min((startRoom.height || r.height) - 1.15, (startRoom.height || r.height) * 0.54),
      ),
      z: start.z,
    };
    cYaw = 0;
    cPitch = 0;
    orbitVel = { yaw: 0, pitch: 0, zoom: 0 };
    bindWalkKeys();
    document.getElementById("walkHint").classList.add("on");
    setTimeout(() => document.getElementById("walkHint").classList.remove("on"), 2500);
  } else {
    cYaw = Math.PI * 0.18;
    cPitch = 0.52;
    cDist = Math.max(
      11,
      Math.min(
        42,
        Math.max(
          cDist || 17,
          focus.maxD * 2.35,
          Math.max(focus.width || 0, focus.height || 0, r.height * 0.9) * 1.65,
          r.height * 1.45,
        ),
      ),
    );
    orbitVel = { yaw: 0, pitch: 0, zoom: 0 };
  }
  showViewChip(`3D View - ${m === "walk" ? "Walk" : "Orbit"}`);
  updateWalkUI();
  updateWalkthroughTray();
}
function startWalkMove(dir) {
  activeWalkDir = dir || 0;
}
function stopWalkMove() {
  activeWalkDir = 0;
}
function startWalkTurn(dir) {
  activeTurnDir = dir || 0;
}
function stopWalkTurn() {
  activeTurnDir = 0;
}
function toggleWalkControlLayout() {
  walkControlLayout = walkControlLayout === "wide" ? "auto" : "wide";
  updateWalkUI();
}
function getLightingPreset(room) {
  return (
    LIGHTING_PRESETS[room?.materials?.lightingPreset || "daylight"] || LIGHTING_PRESETS.daylight
  );
}
function getLightCharacter(room) {
  return Math.max(0, Math.min(1, room?.materials?.lightCharacter ?? 0.5));
}
function computeSceneLightingState(room) {
  const preset = getLightingPreset(room);
  const t = getLightCharacter(room);
  const morningSky = safeThreeColor("#d8e2ea", "#d8e2ea");
  const noonSky = safeThreeColor("#dde6eb", "#dde6eb");
  const sunsetSky = safeThreeColor("#d3b28f", "#d3b28f");
  const blueHour = safeThreeColor("#7c8396", "#7c8396");
  const practicalBias = Math.max(0, Math.min(1, preset.practical || 0));
  const daylightBlend = t < 0.55 ? t / 0.55 : 1;
  const warmSky =
    daylightBlend < 1
      ? morningSky.clone().lerp(noonSky, daylightBlend)
      : sunsetSky.clone().lerp(blueHour, Math.max(0, (t - 0.55) / 0.45));
  const background = safeThreeColor(preset.background, "#0f141c").lerp(
    warmSky,
    0.3 - practicalBias * 0.1,
  );
  const dirColor = safeThreeColor(preset.dirColor, 0xffffff).lerp(
    safeThreeColor("#ffd6a8", "#ffd6a8"),
    Math.max(0, t - 0.35) * 0.34,
  );
  const warmColor = safeThreeColor(preset.warm, 0xfff1d3).lerp(
    safeThreeColor("#ffd0a1", "#ffd0a1"),
    Math.max(0, t - 0.4) * 0.32,
  );
  const dirHeight = (room?.height || 9) * (1.9 - t * 0.72);
  const dirDepth = Math.max(4, room?.height || 9) * (0.72 + t * 0.55);
  return {
    preset,
    background,
    dirColor,
    warmColor,
    exposure: preset.exposure * (photoMode ? 1.05 : 1) * (0.94 - t * 0.04),
    ambientIntensity: preset.ambient * (0.94 - t * 0.04),
    hemiIntensity: preset.ambient * (1.02 - t * 0.05),
    dirIntensity: preset.dir * (0.92 - t * 0.1),
    fillIntensity: preset.ambient * (0.38 + t * 0.08),
    practicalMultiplier: (preset.practical || 0.04) * (1 + t * 0.28 + (photoMode ? 0.08 : 0)),
    fogNear: (preset.fogNear || 28) * (photoMode ? 1.08 : 1),
    fogFar: (preset.fogFar || 82) * (photoMode ? 1.08 : 1),
    sunPosition: {
      x: Math.max(6, room?.height || 9) * (t < 0.5 ? 1.05 : 0.9),
      y: dirHeight,
      z: dirDepth * (t < 0.5 ? 0.85 : 0.55),
    },
    fillPosition: {
      x: -Math.max(5, room?.height || 9) * 0.82,
      y: (room?.height || 9) * (1.08 - t * 0.12),
      z: -Math.max(5, room?.height || 9) * (0.35 + t * 0.2),
    },
    shadowStrength: photoMode ? 0.28 : 0.22,
  };
}
function canUseLampShadows(room) {
  const lamps = (room?.furniture || []).filter((f) =>
    String(f.assetKey || "").startsWith("lamp_"),
  ).length;
  const mobile = (navigator.maxTouchPoints || 0) > 0;
  return mobile ? lamps <= 2 : lamps <= 4;
}
function registerPracticalLight(light, baseIntensity, baseDistance, room = curRoom) {
  if (!scene?.userData?.styleTargets || !light) return;
  if (!scene.userData.styleTargets.practicalLights)
    scene.userData.styleTargets.practicalLights = [];
  scene.userData.styleTargets.practicalLights.push({ light, baseIntensity, baseDistance, room });
}
function addRoomPracticalLight(type, anchor, preset, room) {
  if (!anchor || !scene || preset.practical < 0.12) return;
  const useShadows = canUseLampShadows(room);
  const warmColor = safeThreeColor(preset.warm, 0xffbe78);
  const ceilingBoost = room?.materials?.ceilingBrightness || 1;
  const addBulb = (pos, size = 0.12, intensity = 0.55) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(size, 18, 18),
      new THREE.MeshStandardMaterial({
        color: 0xfff4d7,
        emissive: 0xffd39b,
        emissiveIntensity: intensity,
        roughness: 0.2,
        metalness: 0,
      }),
    );
    bulb.position.copy(pos);
    anchor.add(bulb);
  };
  if (type === "lamp_floor" || type === "lamp_stand") {
    const light = new THREE.PointLight(warmColor, preset.practical * 3.2 * ceilingBoost, 11, 1.7);
    light.position.set(0, 4.9, 0);
    light.castShadow = useShadows;
    light.shadow.mapSize.width = useShadows ? 768 : 256;
    light.shadow.mapSize.height = useShadows ? 768 : 256;
    light.shadow.bias = -0.0008;
    anchor.add(light);
    addBulb(new THREE.Vector3(0, 4.9, 0), 0.14, 0.8);
    registerPracticalLight(light, 3.2, 11, room);
  } else if (type === "lamp_table") {
    const light = new THREE.PointLight(warmColor, preset.practical * 2.1 * ceilingBoost, 6.5, 1.85);
    light.position.set(0, 1.15, 0);
    light.castShadow = useShadows;
    light.shadow.mapSize.width = useShadows ? 512 : 256;
    light.shadow.mapSize.height = useShadows ? 512 : 256;
    light.shadow.bias = -0.001;
    anchor.add(light);
    addBulb(new THREE.Vector3(0, 1.1, 0), 0.1, 0.7);
    registerPracticalLight(light, 2.1, 6.5, room);
  } else if (type === "lamp_wall") {
    const light = new THREE.SpotLight(
      warmColor,
      preset.practical * 3.1 * ceilingBoost,
      12,
      Math.PI / 4,
      0.45,
      1.25,
    );
    light.position.set(0, 0.3, -0.08);
    light.target.position.set(0, -1.15, 2.2);
    light.castShadow = useShadows;
    light.shadow.mapSize.width = useShadows ? 768 : 256;
    light.shadow.mapSize.height = useShadows ? 768 : 256;
    light.shadow.bias = -0.0012;
    anchor.add(light);
    anchor.add(light.target);
    addBulb(new THREE.Vector3(0, 0.26, 0), 0.09, 0.75);
    registerPracticalLight(light, 3.1, 12, room);
  } else if (
    type === "lamp_pendant" ||
    type === "lamp_chandelier" ||
    type === "lamp_ceiling" ||
    type === "lamp_cube"
  ) {
    const light = new THREE.PointLight(warmColor, preset.practical * 3.8 * ceilingBoost, 13, 1.55);
    light.position.set(0, -0.2, 0);
    light.castShadow = useShadows;
    light.shadow.mapSize.width = useShadows ? 768 : 256;
    light.shadow.mapSize.height = useShadows ? 768 : 256;
    light.shadow.bias = -0.001;
    anchor.add(light);
    addBulb(new THREE.Vector3(0, -0.15, 0), 0.12, 0.85);
    registerPracticalLight(light, 3.8, 13, room);
  }
}

function pushStyleMaterial(bucket, material, room = curRoom) {
  if (!scene?.userData?.styleTargets || !material) return material;
  if (!scene.userData.styleTargets[bucket]) scene.userData.styleTargets[bucket] = [];
  scene.userData.styleTargets[bucket].push({ material, room });
  return material;
}
function pushStyleNode(bucket, node, room = curRoom) {
  if (!scene?.userData?.styleTargets || !node) return node;
  if (!scene.userData.styleTargets[bucket]) scene.userData.styleTargets[bucket] = [];
  scene.userData.styleTargets[bucket].push({ node, room });
  return node;
}
function buildRoomEnvelope3D(room, { floorFocus, renderer } = {}) {
  if (!room?.polygon?.length || !scene) return;
  const roomShell = window.Planner3DRoomShell;
  const roomHeight = room.height || curRoom?.height || 9;
  const wallFinish =
    WALL_PALETTES.find((x) => x.id === (room.materials.wallFinish || "warm_white")) ||
    WALL_PALETTES[0];
  const floorPreset =
    FLOOR_TYPES.find((x) => x.id === (room.materials.floorType || "light_oak")) || FLOOR_TYPES[0];
  const tc = safeThreeColor(room.materials.trim, TRIM_COLORS[0]);
  const wc = safeThreeColor(room.materials.wall, WALL_PALETTES[0].color);
  const floorShape = roomShell.createPlanShape(THREE, room.polygon);
  const floorTextureOptions = { THREE, document, floorTypes: FLOOR_TYPES, safeThreeColor };
  const applyFloorUVs = (geometry, points) =>
    window.Planner3DTextures.applyPlanarUVs(THREE, geometry, points);
  const floorMap = window.Planner3DTextures.buildFloorTexture({
    ...floorTextureOptions,
    color: room.materials.floor,
    type: room.materials.floorType || "light_oak",
  });
  const floorAccentMap = window.Planner3DTextures.buildFloorAccentTexture({
    ...floorTextureOptions,
    type: room.materials.floorType || "light_oak",
  });
  const floorGeo = roomShell.createPlanGeometry(THREE, room.polygon, applyFloorUVs);
  const floorMat = pushStyleMaterial(
    "floorMats",
    new THREE.MeshStandardMaterial({
      color: safeThreeColor(room.materials.floor, floorPreset.color),
      roughness: Math.max(
        0.8,
        Number.isFinite(floorPreset.roughness) ? floorPreset.roughness : 0.88,
      ),
      metalness: 0,
      map: floorMap,
    }),
    room,
  );
  roomShell.configureTextureAnisotropy(floorMat.map, renderer, (error) =>
    window.reportRoseRecoverableError?.("3D floor anisotropy update failed", error),
  );
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
  pushStyleNode("floorMeshes", floorMesh, room);
  const accentMat = new THREE.MeshStandardMaterial({
    color: safeThreeColor(room.materials.floor, floorPreset.color),
    roughness: 1,
    metalness: 0,
    map: floorAccentMap,
    transparent: true,
    opacity: 0.14,
    depthWrite: true,
  });
  const accentMesh = new THREE.Mesh(
    roomShell.createPlanGeometry(THREE, room.polygon, applyFloorUVs),
    accentMat,
  );
  accentMesh.rotation.x = -Math.PI / 2;
  accentMesh.position.y = 0.003;
  accentMesh.renderOrder = -1;
  scene.add(accentMesh);
  pushStyleNode("floorAccents", accentMesh, room);
  const ceilColor = safeThreeColor(room.materials.ceiling, "#FAF7F2").multiplyScalar(
    Math.max(0.86, Math.min(1.18, room.materials.ceilingBrightness || 1)),
  );
  const ceilMesh = new THREE.Mesh(
    new THREE.ShapeGeometry(floorShape),
    pushStyleMaterial(
      "ceilingMats",
      new THREE.MeshStandardMaterial({ color: ceilColor, roughness: 0.92, side: THREE.BackSide }),
      room,
    ),
  );
  ceilMesh.name = "roomCeiling";
  ceilMesh.visible = camMode === "walk";
  ceilMesh.rotation.x = -Math.PI / 2;
  ceilMesh.position.y = roomHeight - 0.01;
  scene.add(ceilMesh);
  const style = room.materials.ceilingStyle || "flat";
  if (style !== "flat") {
    const grp = new THREE.Group();
    grp.name = "roomCeilingDetails";
    grp.visible = camMode === "walk";
    if (style === "crown") {
      const crownMat = pushStyleMaterial(
        "trimMats",
        new THREE.MeshStandardMaterial({
          color: tc,
          roughness: 0.45,
          metalness: 0.04,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
        room,
      );
      room.walls.forEach((wall) => {
        const a = wS(room, wall),
          b = wE(room, wall),
          wl = wL(room, wall),
          an = wA(room, wall);
        if (wl < 0.2) return;
        const crown = new THREE.Mesh(new THREE.BoxGeometry(wl, 0.35, 0.12), crownMat);
        const cN = getInteriorWallNormal(room, wall);
        const cOff = 0.12;
        crown.position.set(
          (a.x + b.x) / 2 + cN.x * cOff,
          roomHeight - 0.18,
          -(a.y + b.y) / 2 + cN.z * cOff,
        );
        crown.rotation.y = -an;
        grp.add(crown);
      });
    } else if (style === "beams") {
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x5a3f27,
        roughness: 0.82,
        metalness: 0.02,
      });
      const bbox = roomShell.roomBoundsBox(THREE, room.polygon);
      const spanX = bbox.max.x - bbox.min.x,
        spanZ = bbox.max.z - bbox.min.z;
      const along = spanX > spanZ ? "z" : "x";
      const count = Math.max(3, Math.floor((along === "z" ? spanX : spanZ) / 3.2));
      for (let i = 1; i < count; i++) {
        const u = i / count;
        if (along === "z") {
          const x = bbox.min.x + u * spanX;
          const beam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, spanZ * 0.96), beamMat);
          beam.position.set(x, roomHeight - 0.18, (bbox.min.z + bbox.max.z) / 2);
          grp.add(beam);
        } else {
          const z = bbox.min.z + u * spanZ;
          const beam = new THREE.Mesh(new THREE.BoxGeometry(spanX * 0.96, 0.32, 0.35), beamMat);
          beam.position.set((bbox.min.x + bbox.max.x) / 2, roomHeight - 0.18, z);
          grp.add(beam);
        }
      }
    } else if (style === "coffered") {
      const panelMat = pushStyleMaterial(
        "ceilingMats",
        new THREE.MeshStandardMaterial({
          color: ceilColor.clone().multiplyScalar(0.94),
          roughness: 0.86,
          side: THREE.BackSide,
        }),
        room,
      );
      const trimMat = pushStyleMaterial(
        "trimMats",
        new THREE.MeshStandardMaterial({
          color: tc,
          roughness: 0.5,
          metalness: 0.04,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
        room,
      );
      const bbox = roomShell.roomBoundsBox(THREE, room.polygon);
      const cols = Math.max(2, Math.floor((bbox.max.x - bbox.min.x) / 4));
      const rows = Math.max(2, Math.floor((bbox.max.z - bbox.min.z) / 4));
      const cellW = (bbox.max.x - bbox.min.x) / cols,
        cellD = (bbox.max.z - bbox.min.z) / rows;
      for (let cx2 = 0; cx2 < cols; cx2++)
        for (let cz2 = 0; cz2 < rows; cz2++) {
          const px = bbox.min.x + (cx2 + 0.5) * cellW,
            pz = bbox.min.z + (cz2 + 0.5) * cellD;
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(cellW * 0.88, 0.15, cellD * 0.88),
            panelMat,
          );
          panel.position.set(px, roomHeight - 0.08, pz);
          grp.add(panel);
          const frameTh = 0.08;
          const frameH = new THREE.Mesh(
            new THREE.BoxGeometry(cellW * 0.88, 0.06, frameTh),
            trimMat,
          );
          frameH.position.set(px, roomHeight - 0.02, pz - cellD * 0.44);
          grp.add(frameH);
          const frameH2 = frameH.clone();
          frameH2.position.z = pz + cellD * 0.44;
          grp.add(frameH2);
          const frameV = new THREE.Mesh(
            new THREE.BoxGeometry(frameTh, 0.06, cellD * 0.88),
            trimMat,
          );
          frameV.position.set(px - cellW * 0.44, roomHeight - 0.02, pz);
          grp.add(frameV);
          const frameV2 = frameV.clone();
          frameV2.position.x = px + cellW * 0.44;
          grp.add(frameV2);
        }
    }
    scene.add(grp);
  }
  const wallMat = pushStyleMaterial(
    "wallMats",
    new THREE.MeshStandardMaterial({
      color: wc,
      roughness: 0.68 - wallFinish.sheen * 0.12,
      metalness: 0.005,
      side: THREE.DoubleSide,
      emissive: wc.clone().multiplyScalar(room.materials.wallColorCustom ? 0.06 : 0.03),
    }),
    room,
  );
  wallMat.userData = { isWallSurface: true, styleRoomId: room.id };
  room.walls.forEach((wall) => {
    const a = wS(room, wall),
      b = wE(room, wall),
      wl = wL(room, wall),
      an = wA(room, wall);
    if (wl < 0.01) return;
    const ops = room.openings
      .filter((o) => o.wallId === wall.id)
      .sort((oa, ob) => oa.offset - ob.offset);
    if (!ops.length) addWSeg(a, an, 0, wl, 0, roomHeight, wallMat);
    else {
      let pos = 0;
      ops.forEach((op) => {
        const os = op.offset - op.width / 2,
          oe = op.offset + op.width / 2;
        if (os > pos) addWSeg(a, an, pos, os, 0, roomHeight, wallMat);
        if (op.type === "door") {
          addWSeg(a, an, os, oe, op.height, roomHeight, wallMat);
          const frameMat = pushStyleMaterial(
            "trimMats",
            new THREE.MeshStandardMaterial({
              color: tc,
              roughness: 0.44,
              metalness: 0.04,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -1,
            }),
            room,
          );
          addWSeg(a, an, os, os + 0.06, 0, op.height, frameMat);
          addWSeg(a, an, oe - 0.06, oe, 0, op.height, frameMat);
          addWSeg(a, an, os, oe, op.height - 0.06, op.height, frameMat);
          addDoorLeaf3D(a, an, os, oe, op, tc);
        } else {
          addWSeg(a, an, os, oe, 0, op.sillHeight, wallMat);
          addWSeg(a, an, os, oe, op.sillHeight + op.height, roomHeight, wallMat);
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0xbfd9ea,
            transparent: true,
            opacity: 0.42,
            roughness: 0.08,
            metalness: 0.18,
          });
          addWSeg(a, an, os, oe, op.sillHeight, op.sillHeight + op.height, glassMat);
          const frameMat = pushStyleMaterial(
            "trimMats",
            new THREE.MeshStandardMaterial({
              color: tc,
              roughness: 0.48,
              metalness: 0.04,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -1,
            }),
            room,
          );
          const ft = 0.08,
            mid = (os + oe) / 2;
          addWSeg(a, an, os, os + ft, op.sillHeight, op.sillHeight + op.height, frameMat);
          addWSeg(a, an, oe - ft, oe, op.sillHeight, op.sillHeight + op.height, frameMat);
          addWSeg(a, an, os, oe, op.sillHeight, op.sillHeight + ft, frameMat);
          addWSeg(
            a,
            an,
            os,
            oe,
            op.sillHeight + op.height - ft,
            op.sillHeight + op.height,
            frameMat,
          );
          addWSeg(
            a,
            an,
            mid - ft / 2,
            mid + ft / 2,
            op.sillHeight,
            op.sillHeight + op.height,
            frameMat,
          );
          addWindowAssembly3D(a, an, os, oe, op, tc);
        }
        pos = oe;
      });
      if (pos < wl) addWSeg(a, an, pos, wl, 0, roomHeight, wallMat);
    }
    const bbMat = pushStyleMaterial(
      "trimMats",
      new THREE.MeshStandardMaterial({
        color: tc,
        roughness: 0.28,
        metalness: 0.08,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      room,
    );
    const bbN = getInteriorWallNormal(room, wall);
    const bbOff = 0.1;
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(wl, 0.48), bbMat);
    bb.position.set((a.x + b.x) / 2 + bbN.x * bbOff, 0.24, -(a.y + b.y) / 2 + bbN.z * bbOff);
    bb.rotation.y = -an;
    scene.add(bb);
  });
  room.structures.forEach((st) => {
    if (st.type === "closet" && st.rect) scene.add(buildCloset3D(st, room));
    else if (st.type === "partition" && st.line) {
      const pa = st.line.a,
        pb = st.line.b,
        pl = Math.sqrt((pb.x - pa.x) ** 2 + (pb.y - pa.y) ** 2),
        pAn = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      const pm = new THREE.Mesh(
        new THREE.PlaneGeometry(pl, roomHeight),
        new THREE.MeshStandardMaterial({ color: wc, roughness: 0.65, side: THREE.DoubleSide }),
      );
      pm.position.set((pa.x + pb.x) / 2, roomHeight / 2, -(pa.y + pb.y) / 2);
      pm.rotation.y = -pAn;
      scene.add(pm);
    }
  });
  room.furniture.forEach((f) => placeFurnitureInScene(f, room));
  const ceilLight = new THREE.PointLight(
    0xfff8e8,
    0.28 * (room.materials.ceilingBrightness || 1),
    Math.max((getRoomFocus(room).maxD || 6) * 3.2, (floorFocus?.maxD || 6) * 2.4),
  );
  ceilLight.position.set(getRoomFocus(room).x, roomHeight - 0.4, -getRoomFocus(room).y);
  scene.add(ceilLight);
  pushStyleNode("ceilingLights", ceilLight, room);
}

function build3D() {
  try {
    resetRoomDebug();
    const cont = document.getElementById("threeC");
    const w = cont.clientWidth,
      h = cont.clientHeight;
    const r = curRoom,
      rH = r.height,
      focus = getRoomFocus(r),
      floorRooms = currentFloor3DRooms(r),
      floorFocus = floorRooms.length > 1 ? getRoomsFocus(floorRooms) : focus,
      maxFloorHeight = Math.max(rH, ...floorRooms.map((room) => room?.height || 0)),
      maxD = Math.max(6, focus.maxD),
      frameSpan = Math.max(focus.width || 0, focus.height || 0, rH * 0.9);
    const lightState = computeSceneLightingState(r);
    const preset = lightState.preset;
    scene = new THREE.Scene();
    scene.userData.styleTargets = {
      wallMats: [],
      trimMats: [],
      floorMats: [],
      ceilingMats: [],
      floorMeshes: [],
      floorAccents: [],
      ceilingLights: [],
      floorReflectors: [],
    };
    scene.background = lightState.background.clone();
    scene.fog = new THREE.Fog(scene.background.getHex(), lightState.fogNear, lightState.fogFar);
    cam = new THREE.PerspectiveCamera(53, w / h, 0.3, 140);
    cDist = Math.max(
      11,
      Math.min(
        56,
        Math.max(
          maxD * 2.35,
          frameSpan * 1.65,
          maxFloorHeight * 1.45,
          (floorFocus.maxD || 0) * 1.7,
        ),
      ),
    );
    if (camMode === "orbit") {
      cYaw = Math.PI * 0.22;
      cPitch = 0.48;
    }
    orbitTarget = {
      x: floorFocus.x,
      y: (floorFocus.height3D || maxFloorHeight) * 0.42,
      z: -floorFocus.y,
    };
    orbitVel = { yaw: 0, pitch: 0, zoom: 0 };
    ren = new THREE.WebGLRenderer({ antialias: true });
    window.Planner3DLifecycle?.configureRendererDiagnostics?.(ren, { devMode: !!window.DEV_MODE });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, photoMode ? 2 : 1.7));
    ren.physicallyCorrectLights = true;
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = lightState.exposure;
    ren.outputEncoding = THREE.sRGBEncoding;
    window.RoseHTML.clear(cont);
    cont.appendChild(ren.domElement);
    ren.shadowMap.enabled = true;
    // VSM gives genuinely soft contact-hardening shadows instead of PCFSoft's uniform edges.
    // Fall back to PCFSoft if VSM isn't available in the build. Needs per-light shadow.blurSamples + radius set below.
    ren.shadowMap.type =
      THREE.VSMShadowMap !== undefined && !photoMode ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap;
    // Photo mode: use PCFSoft at 4K for crispest result; VSM is softer but blurrier per-pixel.
    if (photoMode) ren.shadowMap.type = THREE.PCFSoftShadowMap;
    // Post-processing pipeline.
    // Disable heavy passes on mobile/small screens to keep 60fps; always keep FXAA for crispness.
    try {
      const isMobile =
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(w, h) < 520;
      const heavyFX = !isMobile && !!(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass);
      if (THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.FXAAShader) {
        composer = new THREE.EffectComposer(ren);
        composer.setSize(w, h);
        composer.addPass(new THREE.RenderPass(scene, cam));
        if (heavyFX && THREE.SSAOPass && THREE.SimplexNoise) {
          const ssao = new THREE.SSAOPass(scene, cam, w, h);
          ssao.kernelRadius = photoMode ? 12 : 8;
          ssao.minDistance = 0.002;
          ssao.maxDistance = 0.12;
          ssao.output = THREE.SSAOPass.OUTPUT.Default;
          composer.addPass(ssao);
          composer._ssao = ssao;
        }
        if (heavyFX && THREE.UnrealBloomPass) {
          const bloom = new THREE.UnrealBloomPass(
            new THREE.Vector2(w, h),
            photoMode ? 0.42 : 0.3,
            0.4,
            0.85,
          );
          composer.addPass(bloom);
          composer._bloom = bloom;
        }
        // Depth of field in photo mode. BokehPass keeps foreground sharp and softly blurs background,
        // which makes exported screenshots read as "marketing render" instead of "game screenshot".
        if (photoMode && heavyFX && THREE.BokehPass) {
          try {
            const bokeh = new THREE.BokehPass(scene, cam, {
              focus: Math.max(8, cDist * 0.9),
              aperture: 0.00018,
              maxblur: 0.006,
              width: w,
              height: h,
            });
            composer.addPass(bokeh);
            composer._bokeh = bokeh;
          } catch (e) {
            console.warn("Bokeh init failed:", e);
          }
        }
        const fxaa = new THREE.ShaderPass(THREE.FXAAShader);
        const pr = ren.getPixelRatio();
        fxaa.material.uniforms["resolution"].value.set(1 / (w * pr), 1 / (h * pr));
        fxaa.renderToScreen = true;
        composer.addPass(fxaa);
        composer._fxaa = fxaa;
      } else {
        composer = null;
      }
    } catch (e) {
      console.warn("Post-processing init failed:", e);
      composer = null;
    }
    // Load HDRI environment for PBR reflections; the scene renders immediately, then reflections pop in once loaded.
    loadHDRIEnvironment(preset && preset.id, ren, scene);
    const hemiLight = new THREE.HemisphereLight(
      0xfaf8f4,
      lightState.warmColor,
      lightState.hemiIntensity * 1.25,
    );
    scene.add(hemiLight);
    const ambLight = new THREE.AmbientLight(
      lightState.warmColor,
      lightState.ambientIntensity * 0.96,
    );
    scene.add(ambLight);
    const _shMap = photoMode ? 4096 : 2048;
    const dir = new THREE.DirectionalLight(lightState.dirColor, lightState.dirIntensity * 1.05);
    dir.position.set(lightState.sunPosition.x, lightState.sunPosition.y, lightState.sunPosition.z);
    dir.castShadow = true;
    dir.shadow.mapSize.width = _shMap;
    dir.shadow.mapSize.height = _shMap;
    // VSM wants more blur samples + a larger radius to look smooth; PCFSoft wants a smaller radius.
    if (ren.shadowMap.type === THREE.VSMShadowMap) {
      dir.shadow.radius = photoMode ? 10 : 8;
      dir.shadow.blurSamples = photoMode ? 24 : 18;
    } else {
      dir.shadow.radius = photoMode ? 6 : 4;
    }
    dir.shadow.bias = -0.0002;
    dir.shadow.normalBias = 0.025;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 96;
    dir.shadow.camera.left = -32;
    dir.shadow.camera.right = 32;
    dir.shadow.camera.top = 32;
    dir.shadow.camera.bottom = -32;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xf0e8de, lightState.fillIntensity * 1.1);
    fill.position.set(
      lightState.fillPosition.x,
      lightState.fillPosition.y,
      lightState.fillPosition.z,
    );
    scene.add(fill);
    // Soft bounce light from floor
    const bounce = new THREE.DirectionalLight(0xf5ede2, 0.12);
    bounce.position.set(floorFocus.x, -2, -floorFocus.y);
    scene.add(bounce);
    scene.userData.styleTargets.hemiLight = hemiLight;
    scene.userData.styleTargets.ambLight = ambLight;
    scene.userData.styleTargets.dirLight = dir;
    scene.userData.styleTargets.fillLight = fill;
    floorRooms.forEach((room) => buildRoomEnvelope3D(room, { floorFocus, renderer: ren }));
    applyRoomStyleToScene();
    attach3DPointerControls();
    updateWalkUI();
    // Inertial camera: lerp the rendered camera position toward the target position each frame.
    // This makes every movement (drag, zoom, preset switch, walk tween) glide instead of snap.
    const _smoothCam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), ready: false };
    (function anim() {
      raf3d = requestAnimationFrame(anim);
      if (!scene || !cam || !ren) return;
      updateCameraScript(performance.now());
      // Compute target pose first into temp vectors, then lerp the actual camera toward it.
      const tgtPos = new THREE.Vector3(),
        tgtLook = new THREE.Vector3();
      if (camMode === "orbit") {
        cYaw += orbitVel.yaw;
        cPitch = Math.max(0.12, Math.min(0.9, cPitch + orbitVel.pitch));
        cDist = Math.max(7.5, Math.min(42, cDist + orbitVel.zoom));
        // Slightly gentler damping — 0.94/0.92/0.88 feels like it's gliding on glass
        orbitVel.yaw *= 0.94;
        orbitVel.pitch *= 0.92;
        orbitVel.zoom *= 0.88;
        tgtPos.set(
          orbitTarget.x + Math.sin(cYaw) * Math.cos(cPitch) * cDist,
          orbitTarget.y + Math.sin(cPitch) * cDist,
          orbitTarget.z + Math.cos(cYaw) * Math.cos(cPitch) * cDist,
        );
        tgtLook.set(orbitTarget.x, orbitTarget.y, orbitTarget.z);
      } else {
        if (!cameraScript) applyWalkInputStep();
        const walkRoom = getWalkRoomAtPoint?.(fpPos.x, fpPos.z, floorRooms) || r;
        const walkHeight = walkRoom?.height || rH;
        fpPos.y = Math.max(4.9, Math.min(walkHeight - 1.15, walkHeight * 0.54));
        tgtPos.set(fpPos.x, fpPos.y, fpPos.z);
        tgtLook.set(
          fpPos.x + Math.sin(cYaw) * 10,
          fpPos.y + cPitch * 8,
          fpPos.z - Math.cos(cYaw) * 10,
        );
      }
      if (!_smoothCam.ready) {
        _smoothCam.pos.copy(tgtPos);
        _smoothCam.look.copy(tgtLook);
        _smoothCam.ready = true;
      }
      // Walk mode lerps faster so response doesn't feel sluggish; orbit gets more glide.
      const lerp = camMode === "walk" ? 0.35 : 0.18;
      _smoothCam.pos.lerp(tgtPos, lerp);
      _smoothCam.look.lerp(tgtLook, lerp);
      updateOrbitWallCutaway(_smoothCam.pos);
      cam.position.copy(_smoothCam.pos);
      cam.lookAt(_smoothCam.look);
      // Update Bokeh focus distance dynamically (keeps mid-room in focus as user orbits).
      if (composer && composer._bokeh) {
        try {
          composer._bokeh.uniforms &&
            composer._bokeh.uniforms.focus &&
            (composer._bokeh.uniforms.focus.value = Math.max(
              6,
              cam.position.distanceTo(_smoothCam.look) * 0.85,
            ));
        } catch (error) {
          window.reportRoseRecoverableError?.("3D bokeh focus update failed", error);
        }
      }
      if (composer) composer.render();
      else ren.render(scene, cam);
    })();
  } catch (err) {
    console.warn("3D build failed:", err);
    toast(`3D build failed: ${(err && err.message) || "check room materials or shape"}`);
    exit3DView();
  }
}

// On-screen walk controls for mobile
function createWalkControlIcon(points) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.classList.add("walk-control-icon");
  svg.setAttribute("aria-hidden", "true");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", points);
  svg.appendChild(polyline);
  return svg;
}
function createWalkControlButton(action, direction, label, points) {
  const button = document.createElement("button");
  button.className = "cmb walk-control-btn";
  button.type = "button";
  button.dataset.holdAction = action;
  button.dataset.direction = String(direction);
  button.setAttribute("aria-label", label);
  button.appendChild(createWalkControlIcon(points));
  return button;
}
function createWalkControlDock(isWide) {
  const root = document.createElement("div");
  root.id = "walkCtrl";
  root.className = `walk-control${isWide ? " wide" : ""}`;
  const grid = document.createElement("div");
  grid.className = "walk-control-grid";
  grid.append(
    createWalkControlButton("walk-turn", -1, "Turn left", "15 18 9 12 15 6"),
    createWalkControlButton("walk-move", 1, "Move forward", "18 15 12 9 6 15"),
    createWalkControlButton("walk-turn", 1, "Turn right", "9 18 15 12 9 6"),
    createWalkControlButton("walk-move", -1, "Move backward", "18 9 12 15 6 9"),
  );
  const actions = document.createElement("div");
  actions.className = "walk-control-actions";
  const hint = document.createElement("div");
  hint.className = "walk-control-hint";
  hint.textContent = isWide
    ? "Landscape walkthrough mode"
    : "Use the dock for movement and drag anywhere else to look around";
  const toggle = document.createElement("button");
  toggle.className = "mini-chip";
  toggle.type = "button";
  toggle.dataset.action = "toggle-walk-control-layout";
  toggle.textContent = isWide ? "Standard Dock" : "Sideways Dock";
  actions.append(hint, toggle);
  root.append(grid, actions);
  return root;
}
function updateWalkUI() {
  let wc2 = document.getElementById("walkCtrl");
  if (camMode === "walk" && is3D) {
    const isWide = walkControlLayout === "wide" || window.innerWidth > window.innerHeight;
    const next = createWalkControlDock(isWide);
    if (wc2) wc2.replaceWith(next);
    else document.getElementById("cWrap").appendChild(next);
  } else {
    if (wc2) wc2.remove();
    stopWalkMove();
    stopWalkTurn();
  }
}

function addWSeg(ws, an, s, e, botY, topY, mat) {
  const m = window.Planner3DWalls.createWallSegmentMesh(THREE, {
    startPoint: ws,
    angle: an,
    segmentStart: s,
    segmentEnd: e,
    bottomY: botY,
    topY,
    material: mat,
  });
  if (m) scene.add(m);
}
function updateOrbitWallCutaway(cameraPos) {
  if (!scene || !curRoom) return;
  const walls = scene.children.filter((obj) => obj.userData?.roomWallSegment);
  if (!walls.length) return;
  walls.forEach((obj) => (obj.visible = true));
  if (camMode !== "orbit") return;
  const cam2D = { x: cameraPos.x, y: -cameraPos.z };
  const floorRooms = currentFloor3DRooms(curRoom);
  const outside =
    typeof pointInsideRoom2D === "function"
      ? !floorRooms.some((room) => pointInsideRoom2D(cam2D, room))
      : true;
  if (!outside) return;
  window.Planner3DWalls.nearestCutawayWalls(walls, cameraPos, 3).forEach((obj) => {
    obj.visible = false;
  });
}
function addDoorLeaf3D(ws, an, os, oe, op, trimColor) {
  const created = window.Planner3DWalls.createDoorLeafGroup(THREE, {
    startPoint: ws,
    angle: an,
    openingStart: os,
    openingEnd: oe,
    opening: op,
    trimColor,
  });
  if (!created?.group) return;
  scene?.userData?.styleTargets?.trimMats?.push(...created.materials);
  scene.add(created.group);
}
function addWindowAssembly3D(ws, an, os, oe, op, trimColor) {
  const created = window.Planner3DWalls.createWindowAssembly(THREE, {
    startPoint: ws,
    angle: an,
    openingStart: os,
    openingEnd: oe,
    opening: op,
    trimColor,
  });
  if (!created?.meshes?.length) return;
  scene?.userData?.styleTargets?.trimMats?.push(...created.materials);
  created.meshes.forEach((mesh) => scene.add(mesh));
}

function buildCloset3D(st, r) {
  const g = new THREE.Group(),
    h = st.height || r.height,
    rect = st.rect;
  const finish =
    CLOSET_FINISHES.find((f) => f.id === (st.finish || "white_shaker")) || CLOSET_FINISHES[0];
  const bodyMat = new THREE.MeshStandardMaterial({
    color: finish.body,
    roughness: finish.style === "dark_walnut" ? 0.44 : 0.58,
    metalness: 0.03,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: finish.door,
    roughness: 0.34,
    metalness: 0.04,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: finish.trim,
    roughness: 0.45,
    metalness: 0.06,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x8f8a83,
    roughness: 0.28,
    metalness: 0.62,
  });
  const cx = rect.x + rect.w / 2,
    cz = -(rect.y + rect.h / 2);
  const carcass = new THREE.Mesh(new THREE.BoxGeometry(rect.w, h, rect.h), bodyMat);
  carcass.position.set(cx, h / 2, cz);
  g.add(carcass);
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(rect.w + 0.06, 0.08, rect.h + 0.08), trimMat);
  topCap.position.set(cx, h + 0.04, cz);
  g.add(topCap);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(rect.w, 0.22, rect.h), trimMat);
  plinth.position.set(cx, 0.11, cz);
  g.add(plinth);
  const frontZ = -(rect.y + rect.h + 0.035),
    usableH = h - 0.34;
  if (finish.style === "open_shelving") {
    for (let i = 0; i < 4; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(rect.w - 0.18, 0.07, rect.h - 0.22),
        trimMat,
      );
      shelf.position.set(cx, 0.8 + i * (usableH / 4.2), cz);
      g.add(shelf);
    }
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, usableH, 0.08), trimMat);
      rail.position.set(cx + side * (rect.w / 2 - 0.1), usableH / 2 + 0.18, frontZ + 0.04);
      g.add(rail);
    }
  } else {
    const isSliding = finish.style === "sliding_doors";
    const panelCount = isSliding ? 2 : 2;
    const panelW = Math.max(0.42, rect.w / panelCount - 0.06);
    for (let i = 0; i < panelCount; i++) {
      const x = cx - rect.w / 2 + panelW / 2 + 0.04 + i * (panelW + 0.02);
      const z = frontZ + (isSliding ? (i % 2 === 0 ? 0 : 0.06) : 0);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, usableH, 0.06), doorMat);
      panel.position.set(x, usableH / 2 + 0.18, z);
      g.add(panel);
      const inset = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(0.2, panelW - 0.18), Math.max(0.4, usableH - 0.5), 0.02),
        trimMat,
      );
      inset.position.set(x, usableH / 2 + 0.18, z - 0.045);
      g.add(inset);
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, isSliding ? 0.95 : 0.42, 0.03),
        handleMat,
      );
      handle.position.set(
        x + (isSliding ? 0 : i === 0 ? panelW / 2 - 0.08 : -panelW / 2 + 0.08),
        usableH / 2 + 0.18,
        z - 0.055,
      );
      g.add(handle);
    }
  }
  return g;
}
function fitObjectToFootprint(obj, targetW, targetD, targetH, fitMode = "footprint") {
  const box = new THREE.Box3().setFromObject(obj),
    size = new THREE.Vector3();
  box.getSize(size);
  if (size.x <= 0 || size.y <= 0 || size.z <= 0) return obj;
  const scales = [targetW / size.x];
  if (targetH) scales.push(targetH / size.y);
  if (fitMode === "footprint" || fitMode === "surface") scales.push(targetD / size.z);
  const scaleFactor = Math.min(...scales.filter((v) => Number.isFinite(v) && v > 0));
  obj.scale.multiplyScalar(scaleFactor);
  obj.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(obj),
    center = new THREE.Vector3();
  box2.getCenter(center);
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box2.min.y;
  return obj;
}
function getRoomAssetTargetSize(f, r, placement, reg) {
  const base = verificationTargetSize(f.assetKey || "");
  let w = Math.max(0.45, Number.isFinite(f.w) ? f.w : base.w || 1.8);
  let d = Math.max(0.2, Number.isFinite(f.d) ? f.d : base.d || 1.2);
  let h = Math.max(0.7, base.h || Math.min(r.height * 0.38, 3.2));
  if (reg?.mountType === "floor") {
    h = Math.max(h, Math.min(r.height * 0.52, h));
  }
  if (reg?.mountType === "surface") {
    h = Math.max(base.h || 1.1, Math.min(r.height * 0.26, 1.9));
  }
  if (reg?.mountType === "ceiling") {
    h = Math.max(base.h || 1.1, 1);
  }
  if (reg?.mountType === "wall") {
    h = Math.max(base.h || 1.2, Math.min(r.height * 0.4, base.h || 2.4));
    d = Math.max(0.12, Math.min(d, base.d || 0.4));
  }
  if (placement?.windowTarget) {
    const opening = placement.windowTarget.opening || {};
    const openingW = Math.max(1.2, opening.width || w);
    const openingH = Math.max(1.5, opening.height || h);
    if (f.assetKey === "curtains") {
      w = Math.max(base.w || 0, openingW + 1.05);
      h = Math.max(base.h || 0, openingH + 1.45);
      d = Math.max(0.18, base.d || 0.3);
    } else if (f.assetKey === "blinds") {
      w = Math.max(base.w || 0, openingW + 0.14);
      h = Math.max(base.h || 0, openingH + 0.34);
      d = Math.max(0.12, base.d || 0.18);
    }
  }
  if (["wall_art_01", "wall_art_04", "wall_art_06"].includes(f.assetKey)) {
    w = Math.max(1.4, Math.min(w || base.w || 2.2, 3.2));
    h = Math.max(1, Math.min(h || base.h || 1.4, 2.2));
  }
  if (f.assetKey === "mirror") {
    w = Math.max(1.2, Math.min(w || base.w || 1.8, 2.8));
    h = Math.max(2, Math.min(h || base.h || 2.6, 3.6));
  }
  if (f.assetKey === "rug" || f.assetKey === "rug_round" || f.assetKey === "runner_rug") {
    h = 0.08;
  }
  return { w, d, h };
}
function addPremiumHeroEnhancement(anchor, f, targetW, targetD, targetH) {
  if (!anchor || !f) return;
  const key = f.assetKey;
  const g = new THREE.Group();
  const baseColor = furnitureBaseTint(
    f,
    key === "bed" ? "#EEE5D9" : key === "bench" ? "#A67C58" : "#D7C4B2",
  );
  if (key === "sofa_l") {
    const chaiseW = targetW * 0.48,
      chaiseD = targetD * 0.96,
      seatD = targetD * 0.5,
      seatH = Math.max(0.44, targetH * 0.17),
      backH = Math.max(0.92, targetH * 0.34),
      armW = Math.max(0.2, targetW * 0.07);
    const mainBody = box3(
      targetW * 0.96,
      seatH,
      seatD,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.01, -0.03), 0.78, 0.03),
    );
    mainBody.position.set(0, seatH * 0.52, targetD * 0.22);
    g.add(mainBody);
    const chaise = box3(
      chaiseW,
      seatH,
      chaiseD,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.012, -0.02), 0.8, 0.03),
    );
    chaise.position.set(-targetW * 0.24, seatH * 0.52, 0);
    g.add(chaise);
    const back = box3(
      targetW * 0.94,
      backH,
      targetD * 0.15,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, -0.06), 0.82, 0.03),
    );
    back.position.set(0, seatH + backH * 0.5, -targetD * 0.18);
    g.add(back);
    const sideBack = box3(
      targetW * 0.16,
      backH,
      chaiseD * 0.88,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, -0.05), 0.82, 0.03),
    );
    sideBack.position.set(-targetW * 0.4, seatH + backH * 0.5, 0);
    g.add(sideBack);
    const armR = box3(
      armW,
      targetH * 0.36,
      seatD * 0.92,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.015, -0.04), 0.8, 0.03),
    );
    armR.position.set(targetW * 0.45 - armW * 0.5, targetH * 0.18, targetD * 0.21);
    g.add(armR);
    const chaiseFront = box3(
      chaiseW * 0.92,
      seatH * 0.54,
      chaiseD * 0.62,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.025, 0.06), 0.92, 0.01),
    );
    chaiseFront.position.set(-targetW * 0.23, seatH * 0.88, targetD * 0.02);
    g.add(chaiseFront);
    const mainSeat = box3(
      targetW * 0.56,
      seatH * 0.56,
      seatD * 0.62,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.025, 0.06), 0.92, 0.01),
    );
    mainSeat.position.set(targetW * 0.14, seatH * 0.88, targetD * 0.21);
    g.add(mainSeat);
    const pillow1 = box3(
      targetW * 0.26,
      backH * 0.42,
      targetD * 0.14,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, 0.12), 0.9, 0.01),
    );
    pillow1.position.set(targetW * 0.16, seatH + backH * 0.45, -targetD * 0.04);
    g.add(pillow1);
    const pillow2 = box3(
      targetW * 0.2,
      backH * 0.42,
      targetD * 0.14,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, 0.12), 0.9, 0.01),
    );
    pillow2.position.set(-targetW * 0.16, seatH + backH * 0.45, -targetD * 0.04);
    g.add(pillow2);
    const legMat = premiumVariantMat(f, safeThreeColor("#5A4A3E", "#5A4A3E"), 0.46, 0.16);
    [
      [targetW * 0.4, targetD * 0.4],
      [targetW * 0.4, 0],
      [-targetW * 0.42, targetD * 0.4],
      [-targetW * 0.42, -targetD * 0.38],
      [0, -targetD * 0.38],
    ].forEach(([x, z]) => {
      const leg = cy3(0.045, Math.max(0.18, targetH * 0.1), legMat);
      leg.position.set(x, 0.09, z);
      g.add(leg);
    });
  } else if (
    [
      "sofa",
      "sofa_small",
      "sofa_compact",
      "sofa_medium",
      "sofa_large",
      "sofa_modern",
      "sofa_grand",
    ].includes(key)
  ) {
    const seatH = Math.max(0.44, targetH * 0.17),
      backH = Math.max(0.92, targetH * 0.34),
      armW = Math.max(0.2, targetW * 0.08);
    const body = box3(
      targetW * 0.96,
      seatH,
      targetD * 0.88,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.01, -0.03), 0.78, 0.03),
    );
    body.position.set(0, seatH * 0.52, 0);
    g.add(body);
    const back = box3(
      targetW * 0.94,
      backH,
      targetD * 0.16,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, -0.06), 0.82, 0.03),
    );
    back.position.set(0, seatH + backH * 0.5, -targetD * 0.36);
    g.add(back);
    const armL = box3(
      armW,
      targetH * 0.36,
      targetD * 0.8,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.015, -0.04), 0.8, 0.03),
    );
    armL.position.set(-targetW * 0.47 + armW * 0.5, targetH * 0.18, -targetD * 0.01);
    g.add(armL);
    const armR = armL.clone();
    armR.position.x *= -1;
    g.add(armR);
    const cushions = targetW > 5.4 ? 3 : 2,
      cushW = (targetW * 0.76) / cushions;
    for (let i = 0; i < cushions; i++) {
      const x = -targetW * 0.38 + (i + 0.5) * cushW;
      const seat = box3(
        cushW * 0.92,
        seatH * 0.56,
        targetD * 0.54,
        premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.025, 0.06), 0.92, 0.01),
      );
      seat.position.set(x, seatH * 0.9, targetD * 0.03);
      g.add(seat);
      const pillow = box3(
        cushW * 0.82,
        backH * 0.42,
        targetD * 0.14,
        premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, 0.12), 0.9, 0.01),
      );
      pillow.position.set(x, seatH + backH * 0.45, -targetD * 0.22);
      g.add(pillow);
    }
    const legMat = premiumVariantMat(f, safeThreeColor("#5A4A3E", "#5A4A3E"), 0.46, 0.16),
      lx = targetW * 0.41,
      lz = targetD * 0.31;
    [
      [-lx, lz],
      [lx, lz],
      [-lx, -lz],
      [lx, -lz],
    ].forEach(([x, z]) => {
      const leg = cy3(0.045, Math.max(0.18, targetH * 0.1), legMat);
      leg.position.set(x, 0.09, z);
      g.add(leg);
    });
  } else if (["bed", "bed_king", "bed_twin"].includes(key)) {
    const wood = premiumVariantMat(f, safeThreeColor("#8A6A52", "#8A6A52"), 0.56, 0.06);
    const head = box3(
      targetW * 0.98,
      Math.max(1.7, targetH * 0.62),
      targetD * 0.08,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.01, -0.02), 0.78, 0.03),
    );
    head.position.set(0, targetH * 0.34, -targetD * 0.44);
    g.add(head);
    const foot = box3(
      targetW * 0.95,
      Math.max(0.55, targetH * 0.2),
      targetD * 0.07,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.015, -0.05), 0.72, 0.03),
    );
    foot.position.set(0, targetH * 0.11, targetD * 0.44);
    g.add(foot);
    const frame = box3(targetW * 0.98, Math.max(0.24, targetH * 0.09), targetD * 0.96, wood);
    frame.position.set(0, 0.12, 0);
    g.add(frame);
    const railL = box3(0.08, Math.max(0.42, targetH * 0.16), targetD * 0.88, wood);
    railL.position.set(-targetW * 0.45, 0.28, 0);
    g.add(railL);
    const railR = railL.clone();
    railR.position.x *= -1;
    g.add(railR);
    const mattress = box3(
      targetW * 0.9,
      Math.max(0.44, targetH * 0.17),
      targetD * 0.88,
      premiumVariantMat(f, safeThreeColor("#F3EEE6", "#F3EEE6"), 0.96, 0),
    );
    mattress.position.set(0, 0.38, 0);
    g.add(mattress);
    const duvet = box3(
      targetW * 0.86,
      Math.max(0.28, targetH * 0.12),
      targetD * 0.52,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.02, 0.04), 0.95, 0),
    );
    duvet.position.set(0, 0.64, targetD * 0.09);
    g.add(duvet);
    const throwFold = box3(
      targetW * 0.84,
      Math.max(0.08, targetH * 0.035),
      targetD * 0.18,
      premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.025, -0.06), 0.94, 0),
    );
    throwFold.position.set(0, 0.78, targetD * 0.23);
    g.add(throwFold);
    for (const x of [-targetW * 0.2, targetW * 0.2]) {
      const pillow = box3(
        Math.max(0.7, targetW * 0.22),
        Math.max(0.16, targetH * 0.07),
        targetD * 0.18,
        premiumVariantMat(f, safeThreeColor("#FBF8F4", "#FBF8F4"), 0.98, 0),
      );
      pillow.position.set(x, 0.72, -targetD * 0.18);
      g.add(pillow);
    }
  } else if (key === "bench") {
    const wood = premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.01, -0.02), 0.58, 0.05),
      dark = premiumVariantMat(f, safeThreeColor("#3F3A36", "#3F3A36"), 0.42, 0.22);
    const seat = box3(targetW * 0.96, Math.max(0.14, targetH * 0.12), targetD * 0.42, wood);
    seat.position.set(0, Math.max(0.52, targetH * 0.42), 0);
    g.add(seat);
    for (const x of [-targetW * 0.26, 0, targetW * 0.26]) {
      const slat = box3(
        targetW * 0.26,
        Math.max(0.03, targetH * 0.02),
        targetD * 0.44,
        premiumVariantMat(f, baseColor.clone().offsetHSL(0, 0.015, 0.06), 0.56, 0.04),
      );
      slat.position.set(x, seat.position.y + 0.06, 0);
      g.add(slat);
    }
    [
      [-targetW * 0.34, targetD * 0.12],
      [targetW * 0.34, targetD * 0.12],
      [-targetW * 0.34, -targetD * 0.12],
      [targetW * 0.34, -targetD * 0.12],
    ].forEach(([x, z]) => {
      const leg = box3(0.08, Math.max(0.72, targetH * 0.58), 0.08, dark);
      leg.position.set(x, Math.max(0.36, targetH * 0.29), z);
      g.add(leg);
    });
  } else return;
  g.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
    }
  });
  anchor.add(g);
}
function planner3DPlacementHelpers() {
  return { wS, wE, wL, wA, getRoomFocus, defaultElevation, resolveLabel, axisYawOffset };
}
function getInteriorWallNormal(r, wall) {
  return window.Planner3DPlacement.interiorWallNormal(r, wall, planner3DPlacementHelpers());
}
function getFurniturePlacement(f, r) {
  return window.Planner3DPlacement.createFurniturePlacement(
    THREE,
    f,
    r,
    MODEL_REGISTRY,
    planner3DPlacementHelpers(),
  );
}
function placeFurnitureInScene(f, r) {
  const reg = f.assetKey ? MODEL_REGISTRY[f.assetKey] : null,
    anchor = new THREE.Group(),
    placement = getFurniturePlacement(f, r);
  if (!placement) return;
  const renderState = getFurnitureRenderState(f, r);
  anchor.position.copy(placement.position);
  anchor.rotation.y = placement.rotationY;
  anchor.visible = renderState.visible;
  anchor.userData.furnitureId = f.id;
  anchor.userData.assetKey = f.assetKey;
  scene.add(anchor);
  const contactShadow = window.Planner3DTextures.buildContactShadowMesh({
    THREE,
    document,
    furniture: f,
    photoMode,
  });
  if (contactShadow) {
    if (renderState.ghost) contactShadow.material.opacity *= 0.6;
    anchor.add(contactShadow);
  }
  let diagEntry = null;
  if (reg) {
    ROOM_MODEL_DEBUG.active.add(f.assetKey);
    diagEntry = ensureRoomDiagEntry(f, reg);
    diagEntry.status = "loading";
    diagEntry.file = reg.file;
    diagEntry.mountType = f.mountType || reg.mountType;
    diagEntry.worldPosition = anchor.position.clone();
    diagEntry.anchor = anchor;
    diagEntry.object = null;
    diagEntry.fallbackAttempted = false;
    diagEntry.error = "";
    diagEntry.issues = [];
  }
  updateRoomDebugBadge();
  updateRoomRuntimeDiag();
  if (!reg) {
    const fallback = buildFurniture3D(f, r.height);
    if (fallback) anchor.add(fallback);
    addPremiumHeroEnhancement(anchor, f, f.w || 2, f.d || 1.5, Math.max(1.2, r.height * 0.2));
    return;
  }
  loadModelAsset(f.assetKey)
    .then((model) => {
      if (!scene || !anchor.parent) return;
      if (!model) {
        if (MODEL_DEBUG.fail.has(f.assetKey)) {
          console.error(`[ROOM MODEL LOAD FAIL] ${f.assetKey} -> ${reg.file}`);
          trackRoomModelStatus("fail", f.assetKey);
          if (diagEntry) diagEntry.status = "fail";
        } else {
          console.warn(`[ROOM FALLBACK BLOCKED] ${f.assetKey}`);
          trackRoomModelStatus("blocked", f.assetKey);
          if (diagEntry) diagEntry.status = "blocked";
        }
        if (diagEntry) {
          diagEntry.fallbackAttempted = true;
          diagEntry.error = MODEL_ERROR_DETAILS.get(f.assetKey) || "";
          diagEntry.issues = ["model unavailable"];
          updateRoomRuntimeDiag();
        }
        warnAssetFallback(f.assetKey);
        return;
      }
      const target = getRoomAssetTargetSize(f, r, placement, reg);
      const targetW = target.w,
        targetD = target.d,
        targetH = target.h;
      fitObjectToFootprint(
        model,
        targetW,
        targetD,
        targetH,
        placement.windowTarget ? "opening" : reg.fit || "footprint",
      );
      if (reg.defaultScale && reg.defaultScale !== 1) model.scale.multiplyScalar(reg.defaultScale);
      // Material audit upgrades PBR props on all meshes.
      if (typeof patchGLBMaterials === "function") patchGLBMaterials(model, ren);
      applyFurnitureFinishToModel(model, f);
      if (placement.windowTarget && f.assetKey === "curtains") {
        const topY =
          (placement.windowTarget.opening.sillHeight || 3) +
          (placement.windowTarget.opening.height || 4) +
          0.35;
        model.position.y += topY - targetH / 2 - anchor.position.y;
      } else if (placement.windowTarget && f.assetKey === "blinds") {
        const topY =
          (placement.windowTarget.opening.sillHeight || 3) +
          (placement.windowTarget.opening.height || 4) -
          0.06;
        model.position.y += topY - targetH / 2 - anchor.position.y;
      } else {
        if (f.assetKey === "curtains") model.position.y += 0.18;
        if (f.assetKey === "blinds") model.position.y += 0.04;
      }
      model.position.y += reg.yOffset || 0;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      if (renderState.ghost) {
        model.traverse((child) => {
          if (!child.isMesh || !child.material) return;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = Math.min(Number.isFinite(mat.opacity) ? mat.opacity : 1, 0.45);
            mat.needsUpdate = true;
          });
        });
      }
      anchor.add(model);
      if (placement.windowTarget && f.assetKey === "curtains") {
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, targetW, 18),
          new THREE.MeshStandardMaterial({
            color: r.materials.trim || "#3F3A36",
            roughness: 0.34,
            metalness: 0.42,
          }),
        );
        rod.rotation.z = Math.PI / 2;
        rod.position.set(
          0,
          (placement.windowTarget.opening.sillHeight || 3) +
            (placement.windowTarget.opening.height || 4) +
            0.32 -
            anchor.position.y,
          0.06,
        );
        anchor.add(rod);
      } else if (placement.windowTarget && f.assetKey === "blinds") {
        const headrail = new THREE.Mesh(
          new THREE.BoxGeometry(targetW, 0.12, 0.12),
          new THREE.MeshStandardMaterial({
            color: r.materials.trim || "#F8F5F0",
            roughness: 0.52,
            metalness: 0.08,
          }),
        );
        headrail.position.set(
          0,
          (placement.windowTarget.opening.sillHeight || 3) +
            (placement.windowTarget.opening.height || 4) -
            0.03 -
            anchor.position.y,
          0.05,
        );
        anchor.add(headrail);
      }
      addPremiumHeroEnhancement(anchor, f, targetW, targetD, targetH);
      addRoomPracticalLight(f.assetKey, anchor, getLightingPreset(r), r);
      trackRoomModelStatus("ok", f.assetKey);
      if (diagEntry) {
        diagEntry.status = "ok";
        diagEntry.object = model;
        diagEntry.file = model.userData.__sourceUrl || reg.file;
        diagEntry.error = "";
        analyzeRoomModelPlacement(diagEntry, r);
        updateRoomRuntimeDiag();
      }
    })
    .catch((err) => {
      console.error(`[ROOM MODEL LOAD FAIL] ${f.assetKey} -> ${reg.file}`, err);
      trackRoomModelStatus("fail", f.assetKey);
      if (diagEntry) {
        diagEntry.status = "fail";
        diagEntry.fallbackAttempted = true;
        diagEntry.error = (err && err.message) || "load exception";
        diagEntry.issues = [(err && err.message) || "load exception"];
        updateRoomRuntimeDiag();
      }
    });
}
function attach3DPointerControls() {
  const el = ren.domElement;
  let pointerId = null;
  const activePtrs = new Map();
  const ray = new THREE.Raycaster();
  let pDown, pUp, pMove, pCancel, pDbl;
  pDown = (e) => {
    activePtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePtrs.size === 1) {
      d3 = true;
      pointerId = e.pointerId;
      p3x = e.clientX;
      p3y = e.clientY;
      if (el.setPointerCapture) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch (error) {
          window.reportRoseRecoverableError?.("3D pointer capture failed", error);
        }
      }
    }
    if (activePtrs.size === 2) {
      isPinch = true;
      const pts = [...activePtrs.values()];
      pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  };
  pUp = (e) => {
    activePtrs.delete(e.pointerId);
    if (activePtrs.size < 2) isPinch = false;
    if (activePtrs.size === 0) {
      d3 = false;
      if (pointerId !== null && el.releasePointerCapture) {
        try {
          el.releasePointerCapture(pointerId);
        } catch (error) {
          window.reportRoseRecoverableError?.("3D pointer release failed", error);
        }
      }
      pointerId = null;
    }
  };
  pCancel = (e) => {
    if (e && e.pointerId) activePtrs.delete(e.pointerId);
    if (activePtrs.size < 2) isPinch = false;
    if (activePtrs.size === 0) {
      d3 = false;
      pointerId = null;
    }
  };
  pMove = (e) => {
    if (activePtrs.has(e.pointerId)) activePtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (isPinch && activePtrs.size === 2 && camMode === "orbit") {
      const pts = [...activePtrs.values()],
        nd = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchDist > 0 && nd > 0) orbitVel.zoom += (pinchDist / nd - 1) * cDist * 0.42;
      pinchDist = nd;
      return;
    }
    if (!d3 || activePtrs.size > 1) return;
    const dx = e.clientX - p3x,
      dy = e.clientY - p3y;
    p3x = e.clientX;
    p3y = e.clientY;
    if (camMode === "orbit") {
      orbitVel.yaw += dx * 0.00066 * cDist;
      orbitVel.pitch += -dy * 0.00052 * cDist;
    } else {
      cYaw -= dx * 0.002;
      cPitch = Math.max(-0.35, Math.min(0.25, cPitch + dy * 0.0015));
    }
  };
  pDbl = (e) => {
    if (!scene || !cam || camMode !== "orbit") return;
    const rect = el.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, cam);
    const hits = ray.intersectObjects(scene.children, true);
    const hit = hits.find((entry) => {
      let obj = entry.object;
      while (obj) {
        if (obj.userData?.furnitureId) return true;
        obj = obj.parent;
      }
      return false;
    });
    if (!hit) return;
    let obj = hit.object;
    while (obj && !obj.userData?.furnitureId) obj = obj.parent;
    if (obj?.userData?.furnitureId) focusFurniture3D(obj.userData.furnitureId);
  };
  el.addEventListener("pointerdown", pDown);
  el.addEventListener("pointerup", pUp);
  el.addEventListener("pointermove", pMove);
  el.addEventListener("pointercancel", pCancel);
  el.addEventListener("lostpointercapture", pCancel);
  el.addEventListener("dblclick", pDbl);
  ren._listeners = { el, pDown, pUp, pMove, pCancel, pDbl };
}

function verificationTargetSize(key) {
  const map = {
    rug: { w: 3.8, d: 2.8, h: 0.2 },
    runner_rug: { w: 6.5, d: 2, h: 0.2 },
    rug_round: { w: 4.2, d: 4.2, h: 0.2 },
    curtains: { w: 3.8, d: 0.3, h: 4 },
    blinds: { w: 3.5, d: 0.2, h: 2.7 },
    wall_art_01: { w: 2.2, d: 0.2, h: 1.4 },
    wall_art_04: { w: 2.2, d: 0.2, h: 1.4 },
    wall_art_06: { w: 2.2, d: 0.2, h: 1.4 },
    mirror: { w: 1.8, d: 0.2, h: 2.6 },
    lamp_wall: { w: 1.4, d: 0.4, h: 2.2 },
    lamp_table: { w: 1.1, d: 1.1, h: 1.45 },
    lamp_chandelier: { w: 2, d: 2, h: 1.65 },
    lamp_ceiling: { w: 1.6, d: 1.6, h: 1.2 },
    lamp_cube: { w: 1.35, d: 1.35, h: 1.35 },
    lamp_pendant: { w: 1.6, d: 1.6, h: 1.9 },
    lamp_stand: { w: 1, d: 1, h: 4.2 },
    shelving: { w: 2.8, d: 0.6, h: 2.1 },
    shelf_small: { w: 2.1, d: 0.45, h: 1.2 },
    plant_small: { w: 1.1, d: 1.1, h: 1.6 },
    plant_cactus: { w: 1, d: 1, h: 1.8 },
    plant_leafy: { w: 1.4, d: 1.4, h: 2.1 },
    plant_palm: { w: 1.6, d: 1.6, h: 2.8 },
    plant_round: { w: 1.25, d: 1.25, h: 1.7 },
    chair_office: { w: 2, d: 2, h: 3 },
    nightstand: { w: 1.8, d: 1.5, h: 2.2 },
    nightstand_alt: { w: 1.8, d: 1.55, h: 2.25 },
    dresser: { w: 3.8, d: 1.8, h: 3.2 },
    dresser_tall: { w: 3.3, d: 1.7, h: 4.1 },
    console_low: { w: 4.6, d: 1.35, h: 2.4 },
    tv_console: { w: 4.8, d: 1.5, h: 2.8 },
    dining_table: { w: 5.2, d: 3, h: 2.8 },
    table_round_large: { w: 4.2, d: 4.2, h: 2.8 },
    table_round_small: { w: 2.4, d: 2.4, h: 2.2 },
    stool: { w: 1.4, d: 1.4, h: 1.9 },
    bench: { w: 3.6, d: 1.4, h: 2.2 },
    sofa_small: { w: 3.4, d: 2.05, h: 2.8 },
    sofa_compact: { w: 3.6, d: 2.1, h: 3 },
    sofa_medium: { w: 4.4, d: 2.35, h: 3.05 },
    sofa_large: { w: 5.8, d: 2.6, h: 3.1 },
    sofa_modern: { w: 5.2, d: 2.55, h: 3.05 },
    sofa_grand: { w: 6.4, d: 2.8, h: 3.2 },
    bed_king: { w: 6.4, d: 7.4, h: 2.7 },
    bed_double: { w: 5.5, d: 6.8, h: 2.6 },
    bed_twin: { w: 3.6, d: 6.6, h: 2.5 },
    bunk_bed: { w: 4.4, d: 6.8, h: 5.8 },
    bookcase_books: { w: 3.1, d: 1.1, h: 4.8 },
    closet_tall: { w: 3.4, d: 1.8, h: 6.2 },
    closet_full: { w: 3.7, d: 1.9, h: 6.6 },
    closet_short: { w: 3.1, d: 1.7, h: 4.2 },
    fireplace: { w: 4.2, d: 1.3, h: 3.6 },
    kitchen_cabinet_base: { w: 3, d: 2, h: 3 },
    kitchen_cabinet_upper: { w: 3, d: 1.1, h: 2 },
    kitchen_island: { w: 4.2, d: 2.5, h: 3 },
    kitchen_fridge: { w: 3, d: 2.6, h: 6.6 },
    kitchen_stove: { w: 2.6, d: 2.2, h: 3.2 },
    kitchen_hood: { w: 2.6, d: 1, h: 1.8 },
    kitchen_sink: { w: 3, d: 2.1, h: 3.3 },
    kitchen_dishwasher: { w: 2, d: 2.1, h: 3 },
    bathroom_vanity_single: { w: 2.6, d: 1.9, h: 3.2 },
    bathroom_vanity_double: { w: 4.4, d: 1.9, h: 3.2 },
    bathroom_toilet: { w: 1.4, d: 2.4, h: 2.9 },
    bathroom_tub: { w: 2.8, d: 5.7, h: 2.4 },
    bathroom_shower: { w: 3, d: 3, h: 6.8 },
    bathroom_mirror: { w: 2.4, d: 0.2, h: 2.6 },
    bathroom_towel_bar: { w: 2, d: 0.35, h: 1.1 },
    washing_machine: { w: 2.7, d: 2.8, h: 3.6 },
    column_round: { w: 1.4, d: 1.4, h: 8.2 },
    trashcan_small: { w: 1, d: 1, h: 1.4 },
    trashcan_large: { w: 1.2, d: 1.2, h: 2.2 },
    square_plate: { w: 0.9, d: 0.9, h: 0.18 },
    table_rect: { w: 4.4, d: 2.6, h: 2.8 },
  };
  return map[key] || { w: 3.2, d: 2, h: 3.6 };
}
function updateVerificationCard(key, state) {
  const card = document.querySelector(`[data-verify-key="${key}"]`);
  if (!card) return;
  card.classList.remove("ok", "fail");
  const badge = card.querySelector(".verify-badge"),
    meta = card.querySelector(".verify-meta"),
    note = card.querySelector(".verify-note");
  badge.className = "verify-badge " + (state.status || "pending");
  badge.textContent = state.status || "pending";
  if (state.status === "loaded") card.classList.add("ok");
  if (state.status === "failed") card.classList.add("fail");
  renderVerificationMeta(meta, [
    key,
    state.url || modelUrl(MODEL_REGISTRY[key].file),
    `http: ${state.httpStatus ?? "pending"}`,
    `bbox: ${state.bbox || "pending"}`,
    `fallback: ${state.fallback ? "yes" : "no"}`,
  ]);
  note.textContent = state.note || "";
}
function renderVerificationMeta(meta, rows) {
  window.RoseHTML.clear(meta);
  rows.forEach((row) => {
    const line = document.createElement("div");
    line.textContent = row;
    meta.appendChild(line);
  });
}
function renderVerificationCards() {
  const grid = document.getElementById("verifyGrid");
  const keys = Object.keys(MODEL_REGISTRY);
  window.RoseHTML.clear(grid);
  keys.forEach((key) => {
    const card = document.createElement("div");
    card.className = "verify-card";
    card.dataset.verifyKey = key;
    const badge = document.createElement("div");
    badge.className = "verify-badge pending";
    badge.textContent = "pending";
    const title = document.createElement("h4");
    title.textContent = key;
    const meta = document.createElement("div");
    meta.className = "verify-meta";
    meta.textContent = MODEL_REGISTRY[key].file;
    const note = document.createElement("div");
    note.className = "verify-note";
    card.append(badge, title, meta, note);
    grid.appendChild(card);
  });
}
function disposeVerificationScene() {
  if (!verify3D) return;
  if (verify3D.raf) cancelAnimationFrame(verify3D.raf);
  if (verify3D.ren) {
    verify3D.ren.dispose();
    if (verify3D.ren.domElement && verify3D.ren.domElement.parentNode)
      verify3D.ren.domElement.parentNode.removeChild(verify3D.ren.domElement);
  }
  verify3D = null;
}
function closeAssetVerification() {
  document.getElementById("verifyOv").classList.remove("on");
  disposeVerificationScene();
}
async function openAssetVerification() {
  document.getElementById("verifyOv").classList.add("on");
  await refreshAssetVerification();
}
async function refreshAssetVerification() {
  disposeVerificationScene();
  renderVerificationCards();
  const cont = document.getElementById("verifyCanvas");
  const w = cont.clientWidth || cont.offsetWidth,
    h = cont.clientHeight || cont.offsetHeight;
  verify3D = {
    scene: new THREE.Scene(),
    cam: new THREE.PerspectiveCamera(42, w / h, 0.1, 250),
    ren: new THREE.WebGLRenderer({ antialias: true }),
    items: [],
    cycleIndex: 0,
  };
  window.Planner3DLifecycle?.configureRendererDiagnostics?.(verify3D.ren, {
    devMode: !!window.DEV_MODE,
  });
  verify3D.scene.background = new THREE.Color(0xf3efe8);
  verify3D.ren.setSize(w, h);
  verify3D.ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  window.RoseHTML.clear(cont);
  cont.appendChild(verify3D.ren.domElement);
  verify3D.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d1c6, 1.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(10, 14, 8);
  verify3D.scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xfff4e4, 0.5);
  fillLight.position.set(-8, 10, -6);
  verify3D.scene.add(fillLight);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0xe5ded5, roughness: 0.94, metalness: 0.02 }),
  );
  floor.rotation.x = -Math.PI / 2;
  verify3D.scene.add(floor);
  const grid = new THREE.GridHelper(60, 30, 0xd7cfc3, 0xe7dfd6);
  verify3D.scene.add(grid);
  const keys = Object.keys(MODEL_REGISTRY);
  const cols = 4;
  await Promise.all(
    keys.map(async (key, idx) => {
      const reg = MODEL_REGISTRY[key],
        group = new THREE.Group(),
        row = Math.floor(idx / cols),
        col = idx % cols,
        x = (col - (cols - 1) / 2) * 7,
        z = row * 7 - 4;
      group.position.set(x, 0, z);
      verify3D.scene.add(group);
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.95, 0.18, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8f5f0, roughness: 0.75 }),
      );
      pedestal.position.y = 0.09;
      group.add(pedestal);
      try {
        const preflight = await preflightModelFile(reg.file);
        const model = await loadModelAsset(key);
        if (!model) {
          group.add(
            new THREE.Mesh(
              new THREE.BoxGeometry(1.8, 1.8, 0.2),
              new THREE.MeshStandardMaterial({ color: 0xc66565, roughness: 0.6 }),
            ),
          );
          updateVerificationCard(key, {
            status: "failed",
            url: preflight.url,
            httpStatus: preflight.status,
            bbox: "0 x 0 x 0",
            fallback: false,
            note: MODEL_ERROR_DETAILS.get(key) || "failed to load",
          });
          verify3D.items.push({ key, group, bbox: null });
          return;
        }
        const target = verificationTargetSize(key);
        fitObjectToFootprint(model, target.w, target.d, target.h);
        model.rotation.y += (reg.yawOffset || 0) + axisYawOffset(reg.forwardAxis);
        model.position.y += reg.yOffset || 0;
        group.add(model);
        const bbox = new THREE.Box3().setFromObject(model),
          size = new THREE.Vector3();
        bbox.getSize(size);
        updateVerificationCard(key, {
          status: "loaded",
          url: preflight.url,
          httpStatus: preflight.status,
          bbox: `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,
          fallback: false,
          note: reg.category,
        });
        verify3D.items.push({ key, group, bbox });
      } catch (err) {
        console.error("Verification asset failed", key, err);
        group.add(
          new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.8, 0.2),
            new THREE.MeshStandardMaterial({ color: 0xc66565, roughness: 0.6 }),
          ),
        );
        updateVerificationCard(key, {
          status: "failed",
          bbox: "0 x 0 x 0",
          fallback: false,
          note: (err && err.message) || "exception during gallery load",
        });
        verify3D.items.push({ key, group, bbox: null });
      }
    }),
  );
  verify3D.cam.position.set(0, 12, 22);
  verify3D.cam.lookAt(0, 2, 4);
  (function anim() {
    if (!verify3D) return;
    verify3D.raf = requestAnimationFrame(anim);
    verify3D.ren.render(verify3D.scene, verify3D.cam);
  })();
}
function cycleVerificationAssets() {
  if (!verify3D || !verify3D.items.length) return;
  const item = verify3D.items[verify3D.cycleIndex % verify3D.items.length];
  verify3D.cycleIndex++;
  const pos = item.group.position.clone();
  verify3D.cam.position.set(pos.x, 5.5, pos.z + 8.5);
  verify3D.cam.lookAt(pos.x, 1.6, pos.z);
}

// ── REAL 3D FURNITURE ──
function buildFurniture3D(f, rH) {
  const g = new THREE.Group();
  const type = resolveLabel(f.label);
  const sc = furnitureBaseTint(f, "#C9B99A");

  try {
    if (type === "sofa") {
      const bm = new THREE.MeshStandardMaterial({ color: sc, roughness: 0.75 });
      const base = box3(f.w || 5, 1, f.d || 2.5, bm);
      base.position.y = 0.5;
      g.add(base);
      const back = box3(f.w || 5, 0.9, 0.4, bm);
      back.position.set(0, 1.4, -(f.d || 2.5) / 2 + 0.2);
      g.add(back);
      const aL = box3(0.35, 0.65, (f.d || 2.5) - 0.4, bm);
      aL.position.set(-(f.w || 5) / 2 + 0.175, 0.95, 0);
      g.add(aL);
      const aR = aL.clone();
      aR.position.x = (f.w || 5) / 2 - 0.175;
      g.add(aR);
      // Cushions
      const cm = new THREE.MeshStandardMaterial({
        color: new THREE.Color(sc).offsetHSL(0, 0.02, 0.05),
        roughness: 0.85,
      });
      const cw = ((f.w || 5) - 1) / 2;
      const c1 = box3(cw, 0.2, (f.d || 2.5) - 0.8, cm);
      c1.position.set(-cw / 2 - 0.05, 1.1, 0.1);
      g.add(c1);
      const c2 = c1.clone();
      c2.position.x = cw / 2 + 0.05;
      g.add(c2);
      // Legs
      const lm = new THREE.MeshStandardMaterial({
        color: 0x5c4d42,
        roughness: 0.5,
        metalness: 0.1,
      });
      const hw = (f.w || 5) / 2 - 0.3,
        hd = (f.d || 2.5) / 2 - 0.3;
      [
        [-hw, hd],
        [hw, hd],
        [-hw, -hd],
        [hw, -hd],
      ].forEach((p) => {
        const l = cy3(0.05, 0.3, lm);
        l.position.set(p[0], 0.15, p[1]);
        g.add(l);
      });
    } else if (type === "bed") {
      const wm = new THREE.MeshStandardMaterial({ color: 0x8b6d4c, roughness: 0.55 });
      const fm2 = new THREE.MeshStandardMaterial({ color: 0xf0eae0, roughness: 0.9 });
      const frame = box3(f.w || 5.5, 0.5, f.d || 7, wm);
      frame.position.y = 0.35;
      g.add(frame);
      const matt = box3((f.w || 5.5) - 0.3, 0.45, (f.d || 7) - 0.3, fm2);
      matt.position.y = 0.82;
      g.add(matt);
      const head = box3(
        f.w || 5.5,
        2.5,
        0.3,
        new THREE.MeshStandardMaterial({ color: sc, roughness: 0.7 }),
      );
      head.position.set(0, 1.55, -(f.d || 7) / 2 + 0.15);
      g.add(head);
      // Pillows
      const pm2 = new THREE.MeshStandardMaterial({ color: 0xfaf7f2, roughness: 0.9 });
      const p1 = box3(1.5, 0.25, 0.85, pm2);
      p1.position.set(-1.1, 1.2, -(f.d || 7) / 2 + 1.5);
      g.add(p1);
      const p2 = p1.clone();
      p2.position.x = 1.1;
      g.add(p2);
      // Sheet
      const sheet = box3(
        (f.w || 5.5) - 0.5,
        0.06,
        (f.d || 7) * 0.5,
        new THREE.MeshStandardMaterial({
          color: sc.clone().offsetHSL(0, 0, 0.08),
          roughness: 0.85,
        }),
      );
      sheet.position.set(0, 1.08, (f.d || 7) * 0.1);
      g.add(sheet);
    } else if (type === "table" || type === "desk") {
      const wm = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.5,
        metalness: 0.05,
      });
      const top = box3(f.w || 3.5, 0.12, f.d || 1.8, wm);
      top.position.y = 2.3;
      g.add(top);
      const lm = new THREE.MeshStandardMaterial({ color: 0x6b4d35, roughness: 0.5 });
      const hw = (f.w || 3.5) / 2 - 0.3,
        hd = (f.d || 1.8) / 2 - 0.2;
      [
        [-hw, hd],
        [hw, hd],
        [-hw, -hd],
        [hw, -hd],
      ].forEach((p) => {
        const l = cy3(0.05, 2.15, lm);
        l.position.set(p[0], 1.075, p[1]);
        g.add(l);
      });
    } else if (type === "chair") {
      const cm = new THREE.MeshStandardMaterial({ color: sc, roughness: 0.7 });
      const seat = box3(1.6, 0.45, 1.6, cm);
      seat.position.y = 1.2;
      g.add(seat);
      const back = box3(1.6, 1.2, 0.18, cm);
      back.position.set(0, 2.05, -0.7);
      g.add(back);
      const lm = new THREE.MeshStandardMaterial({ color: 0x6b4d35, roughness: 0.55 });
      [
        [-0.6, 0.6],
        [0.6, 0.6],
        [-0.6, -0.6],
        [0.6, -0.6],
      ].forEach((p) => {
        const l = cy3(0.04, 0.95, lm);
        l.position.set(p[0], 0.475, p[1]);
        g.add(l);
      });
    } else if (type === "lamp") {
      const base = cy3(
        0.25,
        0.08,
        new THREE.MeshStandardMaterial({ color: 0x555, roughness: 0.4, metalness: 0.3 }),
      );
      base.position.y = 0.04;
      g.add(base);
      const pole = cy3(0.025, 4, new THREE.MeshStandardMaterial({ color: 0x888, metalness: 0.5 }));
      pole.position.y = 2;
      g.add(pole);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.4, 0.55, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xf5e8d0, roughness: 0.8, side: THREE.DoubleSide }),
      );
      // No extra light on mobile - lamp is visual only
      shade.position.y = 4.3;
      g.add(shade);
    } else if (type === "plant") {
      const pot = cy3(
        0.3,
        0.6,
        new THREE.MeshStandardMaterial({ color: 0x8b7e74, roughness: 0.8 }),
      );
      pot.position.y = 0.3;
      g.add(pot);
      const lm = new THREE.MeshStandardMaterial({ color: 0x5c8b4a, roughness: 0.8 });
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 8, 6),
          lm,
        );
        leaf.position.set(
          (Math.random() - 0.5) * 0.4,
          1.2 + Math.random() * 1,
          (Math.random() - 0.5) * 0.4,
        );
        leaf.scale.set(1, 1.3, 0.7);
        g.add(leaf);
      }
    } else if (type === "storage") {
      const body = box3(
        f.w || 4,
        2.8,
        f.d || 1.5,
        new THREE.MeshStandardMaterial({ color: 0xb79f84, roughness: 0.65 }),
      );
      body.position.y = 1.4;
      g.add(body);
      const top2 = box3(
        (f.w || 4) + 0.05,
        0.12,
        (f.d || 1.5) + 0.05,
        new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.45 }),
      );
      top2.position.y = 2.86;
      g.add(top2);
      const hm = new THREE.MeshStandardMaterial({
        color: 0x8f8a83,
        metalness: 0.45,
        roughness: 0.35,
      });
      for (let row = 0; row < 3; row++) {
        const hh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.05), hm);
        hh.position.set(0, 0.7 + row * 0.75, (f.d || 1.5) / 2 + 0.03);
        g.add(hh);
      }
    } else if (type === "rug") {
      const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(f.w || 5, f.d || 3.5),
        new THREE.MeshStandardMaterial({ color: sc, roughness: 0.95, side: THREE.DoubleSide }),
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.y = 0.02;
      g.add(rug);
    } else if (type === "cabinet" || type === "base cabinet" || type === "upper cabinet") {
      const bm = new THREE.MeshStandardMaterial({ color: sc, roughness: 0.55, metalness: 0.02 });
      const wm = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.5,
        metalness: 0.05,
      });
      const hm = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.2,
        metalness: 0.8,
      });
      const body = box3(f.w || 1.5, f.d || 2.9, f.d || 0.65, bm);
      body.position.y = (f.d || 2.9) / 2;
      g.add(body);
      const top = box3((f.w || 1.5) + 0.04, 0.06, (f.d || 0.65) + 0.04, wm);
      top.position.y = (f.d || 2.9) + 0.03;
      g.add(top);
      const doors = Math.max(1, Math.round((f.w || 1.5) / 0.75));
      const dw = ((f.w || 1.5) - 0.08) / doors;
      for (let i = 0; i < doors; i++) {
        const door = box3(
          dw - 0.04,
          (f.d || 2.9) - 0.2,
          0.04,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(sc).offsetHSL(0, 0, 0.04),
            roughness: 0.48,
          }),
        );
        door.position.set(
          -((f.w || 1.5) / 2) + dw * (i + 0.5),
          (f.d || 2.9) / 2,
          (f.d || 0.65) / 2 + 0.02,
        );
        g.add(door);
        const handle = box3(0.04, 0.35, 0.03, hm);
        handle.position.set(
          -((f.w || 1.5) / 2) + dw * (i + 0.5) + dw * 0.35,
          (f.d || 2.9) / 2,
          (f.d || 0.65) / 2 + 0.055,
        );
        g.add(handle);
      }
      const plinth = box3(
        f.w || 1.5,
        0.18,
        f.d || 0.65,
        new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 }),
      );
      plinth.position.y = 0.09;
      g.add(plinth);
    } else if (type === "refrigerator" || type === "fridge") {
      const bm = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.15,
        metalness: 0.7,
      });
      const dm = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        roughness: 0.18,
        metalness: 0.65,
      });
      const hm = new THREE.MeshStandardMaterial({
        color: 0xa8a8a8,
        roughness: 0.12,
        metalness: 0.85,
      });
      const body = box3(f.w || 2.8, f.h || 5.8, f.d || 2.2, bm);
      body.position.y = (f.h || 5.8) / 2;
      g.add(body);
      const fdh = (f.h || 5.8) * 0.65;
      const doorL = box3((f.w || 2.8) / 2 - 0.06, fdh - 0.1, 0.06, dm);
      doorL.position.set(-(f.w || 2.8) / 4, (f.h || 5.8) - fdh / 2 - 0.02, (f.d || 2.2) / 2 + 0.03);
      g.add(doorL);
      const doorR = doorL.clone();
      doorR.position.x = (f.w || 2.8) / 4;
      g.add(doorR);
      const drawer = box3((f.w || 2.8) - 0.08, (f.h || 5.8) * 0.28 - 0.1, 0.06, dm);
      drawer.position.set(0, (f.h || 5.8) * 0.14, (f.d || 2.2) / 2 + 0.03);
      g.add(drawer);
      const hL = box3(0.05, 0.7, 0.05, hm);
      hL.position.set(-(f.w || 2.8) / 4 + 0.35, (f.h || 5.8) - fdh / 2, (f.d || 2.2) / 2 + 0.07);
      g.add(hL);
      const hR = hL.clone();
      hR.position.x = (f.w || 2.8) / 4 - 0.35;
      g.add(hR);
    } else if (type === "stove" || type === "range" || type === "gas range") {
      const bm = new THREE.MeshStandardMaterial({
        color: 0xd8d8d8,
        roughness: 0.2,
        metalness: 0.65,
      });
      const top = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.35,
        metalness: 0.1,
      });
      const body = box3(f.w || 2.5, 2.9, f.d || 2.0, bm);
      body.position.y = 1.45;
      g.add(body);
      const cooktop = box3((f.w || 2.5) - 0.1, 0.04, (f.d || 2.0) * 0.55, top);
      cooktop.position.set(0, 2.94, -(f.d || 2.0) * 0.2);
      g.add(cooktop);
      const burnerM = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.4,
        metalness: 0.5,
      });
      [
        [-0.7, 0.4],
        [0.7, 0.4],
        [-0.7, -0.2],
        [0.7, -0.2],
        [0, -0.2],
      ].forEach(([x, z]) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 12), burnerM);
        b.position.set(x, 2.98, -(f.d || 2.0) * 0.2 + z);
        g.add(b);
      });
      const oven = box3(
        (f.w || 2.5) - 0.1,
        1.5,
        0.05,
        new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.22, metalness: 0.6 }),
      );
      oven.position.set(0, 0.85, (f.d || 2.0) / 2 + 0.025);
      g.add(oven);
      const handle = box3(
        (f.w || 2.5) * 0.55,
        0.06,
        0.04,
        new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.15, metalness: 0.9 }),
      );
      handle.position.set(0, 1.65, (f.d || 2.0) / 2 + 0.06);
      g.add(handle);
    } else if (type === "sink" || type === "kitchen sink") {
      const bm = new THREE.MeshStandardMaterial({ color: sc, roughness: 0.5, metalness: 0.02 });
      const sm = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.1,
        metalness: 0.75,
      });
      const body = box3(f.w || 3.0, 2.9, f.d || 0.65, bm);
      body.position.y = 1.45;
      g.add(body);
      const ctop = box3((f.w || 3.0) - 0.04, 0.06, (f.d || 0.65) - 0.04, sm);
      ctop.position.y = 2.92;
      g.add(ctop);
      const basin = box3(
        (f.w || 3.0) * 0.55,
        0.36,
        (f.d || 0.65) * 0.7,
        new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.08, metalness: 0.85 }),
      );
      basin.position.set(-(f.w || 3.0) * 0.12, 2.73, 0);
      g.add(basin);
      const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8), sm);
      faucetBase.position.set(0, 2.98, -(f.d || 0.65) * 0.25);
      g.add(faucetBase);
      const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 8), sm);
      faucetNeck.position.set(0, 3.45, -(f.d || 0.65) * 0.25);
      g.add(faucetNeck);
      const door = box3(
        (f.w || 3.0) - 0.08,
        2.2,
        0.04,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(sc).offsetHSL(0, 0, 0.04),
          roughness: 0.48,
        }),
      );
      door.position.set(0, 1.18, (f.d || 0.65) / 2 + 0.02);
      g.add(door);
    } else if (type === "island" || type === "kitchen island") {
      const bm = new THREE.MeshStandardMaterial({ color: sc, roughness: 0.5, metalness: 0.02 });
      const wm = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.6,
        metalness: 0.03,
      });
      const body = box3(f.w || 4.0, 2.9, f.d || 2.5, bm);
      body.position.y = 1.45;
      g.add(body);
      const itop = box3((f.w || 4.0) + 0.08, 0.08, (f.d || 2.5) + 0.08, wm);
      itop.position.y = 2.96;
      g.add(itop);
      for (let side of [1, -1]) {
        const door = box3(
          (f.w || 4.0) * 0.45,
          1.8,
          0.04,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(sc).offsetHSL(0, 0, 0.04),
            roughness: 0.48,
          }),
        );
        door.position.set(side * (f.w || 4.0) * 0.24, 1.48, (side * (f.d || 2.5)) / 2 + 0.02);
        door.rotation.y = side === 1 ? 0 : Math.PI;
        g.add(door);
      }
    } else if (type === "vanity" || type === "single vanity" || type === "double vanity") {
      const bm = new THREE.MeshStandardMaterial({ color: sc, roughness: 0.5, metalness: 0.02 });
      const sm = new THREE.MeshStandardMaterial({
        color: 0xe5e5e5,
        roughness: 0.08,
        metalness: 0.6,
      });
      const mm = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        roughness: 0.06,
        metalness: 0.75,
      });
      const body = box3(f.w || 2.5, 2.8, f.d || 0.6, bm);
      body.position.y = 1.4;
      g.add(body);
      const counter = box3(
        (f.w || 2.5) + 0.04,
        0.08,
        (f.d || 0.6) + 0.04,
        new THREE.MeshStandardMaterial({ color: 0xf2ede6, roughness: 0.15, metalness: 0.05 }),
      );
      counter.position.y = 2.84;
      g.add(counter);
      const basins = f.label && f.label.toLowerCase().includes("double") ? 2 : 1;
      const bw = ((f.w || 2.5) - 0.3) / basins;
      for (let i = 0; i < basins; i++) {
        const basin = box3(bw * 0.7, 0.25, (f.d || 0.6) * 0.6, sm);
        basin.position.set(-((f.w || 2.5) / 2 - 0.15) + bw * (i + 0.5), 2.75, 0);
        g.add(basin);
        const fn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 8), mm);
        fn.position.set(-((f.w || 2.5) / 2 - 0.15) + bw * (i + 0.5), 3.15, -(f.d || 0.6) * 0.2);
        g.add(fn);
      }
      const doors = Math.max(1, Math.round((f.w || 2.5) / 0.7));
      const dw2 = ((f.w || 2.5) - 0.08) / doors;
      for (let i = 0; i < doors; i++) {
        const door = box3(
          dw2 - 0.04,
          2.0,
          0.04,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(sc).offsetHSL(0, 0, 0.04),
            roughness: 0.48,
          }),
        );
        door.position.set(-(f.w || 2.5) / 2 + dw2 * (i + 0.5), 1.08, (f.d || 0.6) / 2 + 0.02);
        g.add(door);
        const handle = box3(0.04, 0.25, 0.03, mm);
        handle.position.set(
          -(f.w || 2.5) / 2 + dw2 * (i + 0.5) + dw2 * 0.38,
          1.3,
          (f.d || 0.6) / 2 + 0.055,
        );
        g.add(handle);
      }
    } else if (type === "toilet") {
      const wm = new THREE.MeshStandardMaterial({
        color: 0xf9f6f0,
        roughness: 0.15,
        metalness: 0.02,
      });
      const gm = new THREE.MeshStandardMaterial({
        color: 0xddd9d0,
        roughness: 0.2,
        metalness: 0.02,
      });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.48, 16), wm);
      base.position.set(0, 0.24, -(f.d || 2.0) * 0.15);
      g.add(base);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.28, 16), wm);
      bowl.position.set(0, 0.62, -(f.d || 2.0) * 0.15);
      g.add(bowl);
      const seat = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 8, 24), gm);
      seat.rotation.x = Math.PI / 2;
      seat.position.set(0, 0.78, -(f.d || 2.0) * 0.15);
      g.add(seat);
      const tank = box3(0.52, 0.88, 0.26, wm);
      tank.position.set(0, 0.44, (f.d || 2.0) * 0.35);
      g.add(tank);
      const tankTop = box3(0.56, 0.06, 0.3, gm);
      tankTop.position.set(0, 0.91, (f.d || 2.0) * 0.35);
      g.add(tankTop);
    } else if (type === "bathtub" || type === "tub") {
      const wm = new THREE.MeshStandardMaterial({
        color: 0xfaf6f0,
        roughness: 0.12,
        metalness: 0.02,
      });
      const cm = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0,
        roughness: 0.15,
        metalness: 0.8,
      });
      const outer = box3(f.w || 2.5, 1.6, f.d || 5.5, wm);
      outer.position.y = 0.8;
      g.add(outer);
      const inner = box3(
        (f.w || 2.5) - 0.22,
        1.2,
        (f.d || 5.5) - 0.22,
        new THREE.MeshStandardMaterial({ color: 0xf0ece6, roughness: 0.08, metalness: 0.04 }),
      );
      inner.position.y = 1.0;
      g.add(inner);
      const rim = box3(
        (f.w || 2.5) + 0.06,
        0.12,
        (f.d || 5.5) + 0.06,
        new THREE.MeshStandardMaterial({ color: 0xf4f0ea, roughness: 0.1, metalness: 0.04 }),
      );
      rim.position.y = 1.62;
      g.add(rim);
      const fn2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.55, 8), cm);
      fn2.position.set(0, 2.22, -(f.d || 5.5) * 0.38);
      g.add(fn2);
    } else if (type === "shower") {
      const gm = new THREE.MeshStandardMaterial({
        color: 0xe0eef5,
        roughness: 0.05,
        metalness: 0.02,
        transparent: true,
        opacity: 0.45,
      });
      const fm = new THREE.MeshStandardMaterial({ color: 0xddd9d2, roughness: 0.35 });
      const cm2 = new THREE.MeshStandardMaterial({
        color: 0xc8c8c8,
        roughness: 0.15,
        metalness: 0.8,
      });
      const sbase = box3(f.w || 3.0, 0.12, f.d || 3.0, fm);
      sbase.position.y = 0.06;
      g.add(sbase);
      const pF = box3(f.w || 3.0, 5.5, 0.06, gm);
      pF.position.set(0, 2.8, (f.d || 3.0) / 2);
      g.add(pF);
      const pL = box3(0.06, 5.5, f.d || 3.0, gm);
      pL.position.set(-(f.w || 3.0) / 2, 2.8, 0);
      g.add(pL);
      const pR = pL.clone();
      pR.position.x = (f.w || 3.0) / 2;
      g.add(pR);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), cm2);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(-(f.w || 3.0) * 0.35, 6.2, -(f.d || 3.0) * 0.3);
      g.add(arm);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16), cm2);
      head.rotation.z = 0;
      head.position.set(-(f.w || 3.0) * 0.35 + 0.5, 6.2, -(f.d || 3.0) * 0.3);
      g.add(head);
    } else {
      // Generic box
      const bx = box3(
        f.w || 2,
        1.5,
        f.d || 1.5,
        new THREE.MeshStandardMaterial({ color: sc, roughness: 0.7 }),
      );
      bx.position.y = 0.75;
      g.add(bx);
    }
  } catch (err) {
    console.warn("Furniture build error:", err);
  }
  return g;
}

function box3(w, h, d, m) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
}
function cy3(r, h, m) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), m);
}

function disposeMaterial(mat) {
  window.Planner3DLifecycle.disposeMaterial(mat);
}
function disposeSceneGraph(root) {
  window.Planner3DLifecycle.disposeSceneGraph(root);
}
function stop3D() {
  if (raf3d) {
    cancelAnimationFrame(raf3d);
    raf3d = null;
  }
  if (rebuild3DTimer) {
    clearTimeout(rebuild3DTimer);
    rebuild3DTimer = null;
  }
  const wc2 = document.getElementById("walkCtrl");
  if (wc2) wc2.remove();
  stopWalkMove();
  stopWalkTurn();
  document.getElementById("photoTray")?.remove();
  document.getElementById("tourTray")?.remove();
  document.getElementById("presentTray")?.remove();
  if (scene) disposeSceneGraph(scene);
  if (ren) {
    window.Planner3DLifecycle.disposeRenderer(ren);
    ren = null;
  }
  const cont = document.getElementById("threeC");
  if (cont) window.RoseHTML.clear(cont);
  document.getElementById("scrEd")?.classList.remove("mode-3d");
  if (composer) {
    window.Planner3DLifecycle.disposeComposer(composer, (error) =>
      window.reportRoseRecoverableError?.("3D composer disposal failed", error),
    );
    composer = null;
  }
  scene = null;
  cam = null;
}

// Presentation / reveal handlers
function exit3DView() {
  stop3D();
  hide3DLoading();
  hideViewChip();
  is3D = false;
  camMode = "orbit";
  presentationMode = false;
  compare3DMode = false;
  photoMode = false;
  photoTrayOpen = false;
  cameraScript = null;
  walkthroughTrayOpen = false;
  document.getElementById("scrEd").classList.remove("mode-3d", "presentation", "photo-mode");
  document.getElementById("threeC").classList.remove("on");
  document.getElementById("b3d").classList.remove("on");
  document.getElementById("vLbl").textContent = "2D Plan";
  document.getElementById("camBtns").classList.remove("on");
  document.getElementById("walkHint").classList.remove("on");
  document.getElementById("presentPill").classList.remove("on");
  document.getElementById("presentPill").textContent = "Presentation Mode";
  document.getElementById("photoPill")?.classList.remove("on");
  document.getElementById("cmCompare").classList.remove("act");
  document.getElementById("cmTour")?.classList.remove("act");
  document.getElementById("cmPhoto")?.classList.remove("act");
  document.getElementById("presentTray")?.remove();
  updateWalkthroughTray();
  updatePhotoTray();
  resetRoomDebug();
  initCan();
  draw();
  showP();
}
function toggleWalkthroughTray() {
  if (!is3D) return;
  if (photoMode) togglePhotoMode(false);
  if (presentationMode) togglePresentationMode();
  walkthroughTrayOpen = !walkthroughTrayOpen;
  document.getElementById("cmTour")?.classList.toggle("act", walkthroughTrayOpen);
  updateWalkthroughTray();
}
function updateWalkthroughTray() {
  const existing = document.getElementById("tourTray");
  if (!is3D || !walkthroughTrayOpen || photoMode || presentationMode) {
    if (existing) existing.remove();
    return;
  }
  const isTouch = (navigator.maxTouchPoints || 0) > 0 || window.innerWidth <= 760;
  const presets = [
    ["favorite_corner", "Favorite Corner", "Finds the room's best-composed angle."],
    ["dollhouse", "Dollhouse", "Pulls back for the whole-room silhouette."],
    ["stroll", "Stroll", "Walks the room at eye level with a calmer pace."],
    ["corner_reveal", "Corner Reveal", "Starts wide, then settles into the strongest corner."],
    ["before_after", "Before / After", "Stages existing, redesign, and combined in sequence."],
    ["romantic_reveal", "Romantic Reveal", "A soft, slower sweep for the final presentation feel."],
  ];
  replaceOrAppend3DTray(
    existing,
    createWalkthroughTrayNode({
      title: "Walkthrough Moves",
      copy: isTouch
        ? "Choose a move, then keep your thumb near the bottom edge while the room glides into place."
        : "Choose a guided move for a cleaner, more cinematic room reveal.",
      presets,
      isTouch,
    }),
  );
}
function togglePhotoMode(force) {
  if (!is3D) return;
  const next = typeof force === "boolean" ? force : !photoMode;
  photoMode = next;
  if (photoMode) {
    presentationMode = false;
    walkthroughTrayOpen = false;
    photoTrayOpen = true;
    document.getElementById("scrEd").classList.remove("presentation");
    document.getElementById("cmPresent")?.classList.remove("act");
    document.getElementById("cmTour")?.classList.remove("act");
    setPhotoPreset("hero");
  } else {
    photoTrayOpen = false;
  }
  document.getElementById("scrEd").classList.toggle("photo-mode", photoMode);
  document.getElementById("photoPill")?.classList.toggle("on", photoMode);
  document.getElementById("cmPhoto")?.classList.toggle("act", photoMode);
  updateWalkthroughTray();
  updatePhotoTray();
  updatePresentationTray();
  refreshPresentationPill();
  applyRoomStyleToScene?.();
}
function updatePhotoTray() {
  const existing = document.getElementById("photoTray");
  if (!is3D || !photoMode || !photoTrayOpen) {
    if (existing) existing.remove();
    return;
  }
  const presets = [
    ["hero", "Hero Shot", "Balanced hero angle for clean presentation images."],
    ["favorite", "Favorite Corner", "Frames the room from its best-composed corner."],
    ["intimate", "Intimate", "Moves in closer for softer, warmer storytelling."],
    ["overhead", "Overhead", "Pulls up for a styled layout overview."],
  ];
  replaceOrAppend3DTray(
    existing,
    createPhotoTrayNode({
      copy: "Minimal chrome, styled camera presets, and cleaner capture framing for presentation-ready stills.",
      presets,
      resetLabel: "Reset to Hero",
      resetPreset: "hero",
    }),
  );
}
function setPhotoPreset(mode) {
  if (!is3D || !curRoom) return;
  const focus = getRoomFocus(curRoom);
  const current = {
    yaw: cYaw,
    pitch: cPitch,
    dist: cDist,
    target: { ...(orbitTarget || { x: focus.x, y: curRoom.height * 0.42, z: -focus.y }) },
  };
  const next = window.Planner3DCamera.photoPose(mode, curRoom, {
    getRoomFocus,
    getRoomBounds2D,
    currentFloor3DRooms,
    getRoomsFocus,
  });
  showViewChip(`Photo Mode · ${photoPresetLabel(mode)}`);
  playCameraSequence([{ duration: 1100, apply: (t) => applyCameraTween(current, next, t) }]);
}
function capturePresentationStill() {
  if (!is3D || !ren || !cam) return null;
  const size = ren.getSize(new THREE.Vector2());
  const prevRatio = ren.getPixelRatio();
  const targetRatio = Math.min(2.3 * Math.max(1, window.devicePixelRatio || 1), 3);
  ren.setPixelRatio(targetRatio);
  ren.setSize(size.x, size.y, false);
  if (composer) {
    composer.setSize(size.x, size.y);
    if (composer._fxaa) {
      const pr = ren.getPixelRatio();
      composer._fxaa.material.uniforms["resolution"].value.set(
        1 / (size.x * pr),
        1 / (size.y * pr),
      );
    }
    composer.render();
  } else ren.render(scene, cam);
  const dataUrl = ren.domElement.toDataURL("image/png");
  ren.setPixelRatio(prevRatio);
  ren.setSize(size.x, size.y, false);
  if (composer) {
    composer.setSize(size.x, size.y);
    if (composer._fxaa) {
      const pr = ren.getPixelRatio();
      composer._fxaa.material.uniforms["resolution"].value.set(
        1 / (size.x * pr),
        1 / (size.y * pr),
      );
    }
    composer.render();
  } else ren.render(scene, cam);
  window.ExportDownloads.downloadDataUrl(
    dataUrl,
    window.ExportFilenames.fileName(curRoom, "reveal_cover", "png"),
  );
  toast("Reveal cover exported");
  return dataUrl;
}
function favoriteCornerPose(room) {
  return window.Planner3DCamera.favoriteCornerPose(room, { getRoomFocus, getRoomBounds2D });
}
function setPresentationShot(mode) {
  if (!is3D || !curRoom) return;
  presentationShot = mode;
  showViewChip(`Presentation · ${presentationShotLabel(mode)}`);
  refreshPresentationPill();
  updatePresentationTray();
  if (mode === "before_after") {
    startWalkthroughPreset("before_after");
    return;
  }
  const focus = getRoomFocus(curRoom);
  const current = {
    yaw: cYaw,
    pitch: cPitch,
    dist: cDist,
    target: { ...(orbitTarget || { x: focus.x, y: curRoom.height * 0.42, z: -focus.y }) },
  };
  const next = window.Planner3DCamera.presentationPose(mode, curRoom, {
    getRoomFocus,
    getRoomBounds2D,
    currentFloor3DRooms,
    getRoomsFocus,
  });
  playCameraSequence([{ duration: 1350, apply: (t) => applyCameraTween(current, next, t) }]);
}
function startWalkthroughPreset(id) {
  if (!is3D || !curRoom) return;
  walkthroughTrayOpen = false;
  updateWalkthroughTray();
  showViewChip(`Walkthrough · ${walkthroughPresetLabel(id)}`);
  const focus = getRoomFocus(curRoom);
  const current = {
    yaw: cYaw,
    pitch: cPitch,
    dist: cDist,
    target: { ...(orbitTarget || { x: focus.x, y: curRoom.height * 0.42, z: -focus.y }) },
  };
  const overview = overviewRoomPose(curRoom);
  const corner = favoriteCornerPose(curRoom);
  const romantic = {
    yaw: Math.PI * 0.52,
    pitch: 0.28,
    dist: Math.max(10, Math.min(24, Math.max(focus.width, focus.height) * 1.1)),
    target: { x: focus.x, y: curRoom.height * 0.36, z: -focus.y },
  };
  const favorite = favoriteCornerPose(curRoom);
  if (id === "favorite_corner")
    playCameraSequence([{ duration: 1800, apply: (t) => applyCameraTween(current, favorite, t) }]);
  else if (id === "dollhouse")
    playCameraSequence([{ duration: 2200, apply: (t) => applyCameraTween(current, overview, t) }]);
  else if (id === "corner_reveal")
    playCameraSequence([
      { duration: 1500, apply: (t) => applyCameraTween(current, overview, t) },
      { duration: 2200, apply: (t) => applyCameraTween(overview, corner, t) },
    ]);
  else if (id === "romantic_reveal") {
    presentationMode = true;
    presentationShot = "hero";
    document.getElementById("scrEd").classList.add("presentation");
    playCameraSequence([
      { duration: 1600, apply: (t) => applyCameraTween(current, corner, t) },
      { duration: 2400, apply: (t) => applyCameraTween(corner, romantic, t) },
    ]);
  } else if (id === "before_after") {
    presentationShot = "before_after";
    playCameraSequence([
      {
        duration: 900,
        onStart: () => setCompareModeForTour("existing"),
        apply: (t) => applyCameraTween(current, corner, t),
      },
      {
        duration: 1200,
        onStart: () => setCompareModeForTour("redesign"),
        apply: (t) => applyCameraTween(corner, { ...corner, yaw: corner.yaw + 0.24 }, t),
      },
      {
        duration: 1200,
        onStart: () => setCompareModeForTour("combined"),
        apply: (t) => applyCameraTween({ ...corner, yaw: corner.yaw + 0.24 }, overview, t),
      },
    ]);
  } else if (id === "stroll") {
    const pts = [findTourWalkPoint(0, 3), findTourWalkPoint(1, 3), findTourWalkPoint(2, 3)];
    playCameraSequence([
      { duration: 400, onStart: () => setCamMode("walk"), apply: () => {} },
      { duration: 1800, apply: (t) => applyWalkTween(fpPos, pts[0], t) },
      { duration: 1800, apply: (t) => applyWalkTween(pts[0], pts[1], t) },
      { duration: 1800, apply: (t) => applyWalkTween(pts[1], pts[2], t) },
      { duration: 900, onStart: () => setCamMode("orbit"), apply: () => {} },
    ]);
  }
  refreshPresentationPill();
  updatePresentationTray();
}
function rebuild3D() {
  stop3D();
  build3D();
  if (typeof applyRoomStyleToScene === "function") applyRoomStyleToScene();
  refreshPresentationPill();
  updatePresentationTray();
  updateWalkthroughTray();
  updatePhotoTray();
}

// ═══════════════════════════════════════════════
// INFINITE DISCOVERY ENGINE
// Finite milestones + infinite generative moments
// Combinational: time x season x mood x behavior x history
// ═══════════════════════════════════════════════

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}
function getSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}
function getDayType() {
  const d = new Date().getDay();
  return d === 0 ? "sunday" : d === 6 ? "saturday" : "weekday";
}

const TIME_CONFIG = {
  morning: { bodyClass: "", exposure: 1.2, ambientIntensity: 0.5, warmth: 0xfff8e0 },
  afternoon: { bodyClass: "", exposure: 1.15, ambientIntensity: 0.45, warmth: 0xfff5e8 },
  evening: { bodyClass: "evening", exposure: 1.05, ambientIntensity: 0.38, warmth: 0xffe8c0 },
  night: { bodyClass: "night", exposure: 0.95, ambientIntensity: 0.3, warmth: 0xffdda0 },
};
const MOOD_CONFIG = {
  cozy: { exposureMod: -0.05, adj: ["tucked in", "blanketed", "nestled", "soft", "warm"] },
  dreamy: { exposureMod: -0.08, adj: ["floating", "gentle", "hazy", "drifting", "quiet"] },
  elegant: { exposureMod: 0.03, adj: ["composed", "graceful", "poised", "clean", "refined"] },
  "feels like home": {
    exposureMod: -0.02,
    adj: ["familiar", "settled", "real", "lived-in", "ours"],
  },
  romantic: { exposureMod: -0.06, adj: ["candlelit", "intimate", "close", "tender", "warm"] },
  peaceful: { exposureMod: -0.03, adj: ["still", "unhurried", "open", "calm", "resting"] },
  bright: { exposureMod: 0.06, adj: ["airy", "fresh", "awake", "light", "clear"] },
  moody: { exposureMod: -0.1, adj: ["shadowed", "cinematic", "quiet", "deep", "velvet"] },
};

function applyTimeTheme() {
  const tc = TIME_CONFIG[getTimeOfDay()];
  document.body.classList.remove("evening", "night");
  if (tc.bodyClass) document.body.classList.add(tc.bodyClass);
}

// Context snapshot for combinational selection
function getCtx() {
  const tod = getTimeOfDay(),
    season = getSeason(),
    day = getDayType(),
    room = curRoom;
  const labels = room ? (room.furniture || []).map((f) => resolveLabel(f.label)) : [];
  const mood = room ? room.mood || "" : "";
  const mc = MOOD_CONFIG[mood];
  const adj = mc ? mc.adj[Math.floor(Math.random() * mc.adj.length)] : "soft";
  const A = adj.charAt(0).toUpperCase() + adj.slice(1);
  return {
    tod,
    season,
    day,
    mood,
    adj,
    A,
    hasLamp: labels.includes("lamp"),
    hasPlant: labels.includes("plant"),
    hasRug: labels.includes("rug"),
    hasBed: labels.includes("bed"),
    hasSofa: labels.includes("sofa"),
    items: room ? (room.furniture || []).length : 0,
    opens: room ? (room.openings || []).length : 0,
    is3D,
    camMode,
  };
}
