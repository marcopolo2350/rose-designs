(function initHistoryRuntime() {
  function historyKey(roomId) {
    return `${ROOM_HISTORY_PREFIX}${roomId}`;
  }

  function roomSnapshot(room = curRoom) {
    if (!room) return null;
    return JSON.stringify({
      polygon: room.polygon,
      walls: room.walls,
      openings: room.openings,
      structures: room.structures,
      furniture: room.furniture,
      dimensionAnnotations: room.dimensionAnnotations,
      textAnnotations: room.textAnnotations,
      materials: room.materials,
      height: room.height,
      wallThickness: room.wallThickness,
      roomType: room.roomType,
      designPreset: room.designPreset,
      mood: room.mood,
      existingRoomMode: room.existingRoomMode,
      hideRemovedExisting: room.hideRemovedExisting,
      ghostExisting: room.ghostExisting,
      planViewMode: room.planViewMode,
      showPlanLegend: room.showPlanLegend,
      layerVisibility: room.layerVisibility,
      baseRoomId: room.baseRoomId,
      optionName: room.optionName,
      optionNotes: room.optionNotes,
      referenceOverlay: room.referenceOverlay,
      previewThumb: room.previewThumb,
    });
  }

  function syncCurrentRoomRecord(announce = false) {
    if (!curRoom) return;
    if (typeof updateRoomPreviewThumb === "function") updateRoomPreviewThumb(curRoom);
    curRoom.updatedAt = Date.now();
    const index = projects.findIndex((projectRoom) => projectRoom.id === curRoom.id);
    if (index >= 0) projects[index] = curRoom;
    if (window.appState) window.appState.markDirty();
    saveAll();
    if (announce) toast("Project saved");
  }

  function persistRoomHistory() {
    if (!curRoom) return;
    ds(historyKey(curRoom.id), {
      undo: [...undoSt],
      redo: [...redoSt],
    });
    syncCurrentRoomRecord(false);
  }

  async function restoreRoomHistory(room) {
    const current = roomSnapshot(room);
    const saved = await dg(historyKey(room.id));
    if (
      saved &&
      Array.isArray(saved.undo) &&
      saved.undo.length &&
      saved.undo[saved.undo.length - 1] === current
    ) {
      undoSt = saved.undo.slice(-50);
      redoSt = Array.isArray(saved.redo) ? saved.redo.slice(-50) : [];
      return;
    }
    undoSt = current ? [current] : [];
    redoSt = [];
    persistRoomHistory();
  }

  function pushUBase() {
    if (!curRoom) return;
    const snapshot = roomSnapshot(curRoom);
    if (!snapshot) return;
    if (undoSt[undoSt.length - 1] === snapshot) return;
    undoSt.push(snapshot);
    if (undoSt.length > 50) undoSt.shift();
    redoSt = [];
    persistRoomHistory();
    if (typeof updateUndoStrip === "function") updateUndoStrip();
  }

  function applyHistorySnapshot(snapshot) {
    Object.assign(curRoom, JSON.parse(snapshot));
    normalizeRoom(curRoom);
    if (window.appState) window.appState.clearSelection();
    if (typeof hideP === "function") hideP();
    if (typeof draw === "function") draw();
    if (typeof scheduleRebuild3D === "function") scheduleRebuild3D();
    persistRoomHistory();
    if (typeof updateUndoStrip === "function") updateUndoStrip();
  }

  function doUndo() {
    if (undoSt.length <= 1) return;
    redoSt.push(undoSt.pop());
    applyHistorySnapshot(undoSt[undoSt.length - 1]);
  }

  function doRedo() {
    if (!redoSt.length) return;
    const snapshot = redoSt.pop();
    undoSt.push(snapshot);
    applyHistorySnapshot(snapshot);
  }

  window.historyKey = historyKey;
  window.roomSnapshot = roomSnapshot;
  window.syncCurrentRoomRecord = syncCurrentRoomRecord;
  window.persistRoomHistory = persistRoomHistory;
  window.restoreRoomHistory = restoreRoomHistory;
  window.pushUBase = pushUBase;
  window.doUndo = doUndo;
  window.doRedo = doRedo;
})();
