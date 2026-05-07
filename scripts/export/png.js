/* global Image, autoFit, cam, capturePhotoMode, collectRoomPlanStats, ctx:writable, is3D, optionSiblings, photoMode, ren, scene, showMeasurements:writable */
function exportPNG() {
  if (!curRoom) {
    toast("Open a room first");
    return;
  }
  let dataUrl;
  if (is3D && ren) {
    dataUrl =
      typeof capturePhotoMode === "function"
        ? capturePhotoMode(false)
        : (ren.render(scene, cam), ren.domElement.toDataURL("image/png"));
  } else if (canvas) {
    dataUrl = canvas.toDataURL("image/png");
  } else {
    toast("Nothing to export");
    return;
  }
  window.ExportDownloads.downloadDataUrl(
    dataUrl,
    window.ExportFilenames.fileName(curRoom, is3D ? (photoMode ? "photo" : "3d") : "plan", "png"),
  );
  toast("PNG exported");
}
function renderPlanModeToDataURL(mode, width = 1100, height = 800) {
  return renderRoomModeToDataURL(curRoom, mode, width, height, {
    legend: true,
    measurements: true,
  });
}
function renderRoomModeToDataURL(room, mode, width = 1100, height = 800, opts = {}) {
  if (!room || !room.polygon.length) return null;
  const prevRoom = curRoom,
    prevCanvas = canvas,
    prevCtx = ctx,
    prevScale = vScale,
    prevOff = { ...vOff },
    prevMode = curRoom?.planViewMode,
    prevLegend = curRoom?.showPlanLegend,
    prevMeasurements = showMeasurements;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");
  curRoom = room;
  canvas = tempCanvas;
  ctx = tempCtx;
  curRoom.planViewMode = mode;
  if (typeof opts.legend === "boolean") curRoom.showPlanLegend = opts.legend;
  showMeasurements = opts.measurements !== false;
  let dataUrl;
  try {
    autoFit();
    draw();
    dataUrl = tempCanvas.toDataURL("image/png");
  } finally {
    showMeasurements = prevMeasurements;
    canvas = prevCanvas;
    ctx = prevCtx;
    curRoom = prevRoom;
    if (curRoom) {
      curRoom.planViewMode = prevMode;
      curRoom.showPlanLegend = prevLegend;
    }
    vScale = prevScale;
    vOff = prevOff;
    if (prevCanvas && prevCtx) draw();
  }
  return dataUrl;
}
function exportComparisonSheet() {
  if (!curRoom || !curRoom.polygon.length) {
    toast("Open a room first");
    return;
  }
  const before = renderPlanModeToDataURL("existing", 1200, 820);
  const after = renderPlanModeToDataURL("redesign", 1200, 820);
  if (!before || !after) {
    toast("Could not render comparison");
    return;
  }
  const out = document.createElement("canvas");
  out.width = 2400;
  out.height = 1500;
  const c = out.getContext("2d");
  c.fillStyle = "#F6F0E8";
  c.fillRect(0, 0, out.width, out.height);
  c.fillStyle = "#3A2E25";
  c.font = "700 60px Georgia, serif";
  c.fillText(curRoom.name || "Room Comparison", 120, 110);
  c.font = "500 24px Outfit, sans-serif";
  c.fillStyle = "#7B6B5E";
  c.fillText("Before / after room story board", 120, 152);
  const drawCard = (img, title, x) => {
    c.fillStyle = "rgba(255,252,248,.96)";
    c.strokeStyle = "rgba(123,107,94,.12)";
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(x, 220, 1020, 1080, 30);
    c.fill();
    c.stroke();
    c.fillStyle = "#4C3F34";
    c.font = "700 34px Outfit, sans-serif";
    c.fillText(title, x + 40, 278);
    c.drawImage(img, x + 30, 320, 960, 900);
  };
  const beforeImg = new Image(),
    afterImg = new Image();
  let loaded = 0;
  const finalize = () => {
    loaded++;
    if (loaded < 2) return;
    drawCard(beforeImg, "Existing Room", 120);
    drawCard(afterImg, "Redesign Direction", 1260);
    window.ExportDownloads.downloadDataUrl(
      out.toDataURL("image/png"),
      window.ExportFilenames.fileName(curRoom, "comparison_sheet", "png"),
    );
    toast("Comparison sheet exported");
  };
  const onError = () => toast("Could not render comparison image");
  beforeImg.onload = finalize;
  afterImg.onload = finalize;
  beforeImg.onerror = onError;
  afterImg.onerror = onError;
  beforeImg.src = before;
  afterImg.src = after;
}
function exportDesignSummary() {
  if (!curRoom) {
    toast("Open a room first");
    return;
  }
  const siblings = optionSiblings(curRoom).sort((a, b) =>
    (a.optionName || "").localeCompare(b.optionName || ""),
  );
  const cardH = 420,
    margin = 70;
  const rooms = siblings.map((room) => {
    if (!room.previewThumb && room.polygon?.length) updateRoomPreviewThumb(room);
    return room;
  });
  Promise.all(
    rooms.map(
      (room) =>
        new Promise((resolve) => {
          if (!room.previewThumb) return resolve({ room, img: null });
          const img = new Image();
          img.onload = () => resolve({ room, img });
          img.onerror = () => resolve({ room, img: null });
          img.src = room.previewThumb;
        }),
    ),
  ).then((entries) => {
    const out = document.createElement("canvas");
    out.width = 1600;
    out.height = Math.max(900, 220 + entries.length * cardH);
    const c = out.getContext("2d");
    c.fillStyle = "#F6F0E8";
    c.fillRect(0, 0, out.width, out.height);
    c.fillStyle = "#3A2E25";
    c.font = "700 54px Georgia, serif";
    c.fillText(curRoom.name || "Room Summary", margin, 92);
    c.font = "500 22px Outfit, sans-serif";
    c.fillStyle = "#7B6B5E";
    c.fillText("Design direction summary", margin, 130);
    entries.forEach(({ room, img }, index) => {
      const y = 180 + index * cardH;
      c.fillStyle = "rgba(255,252,248,.96)";
      c.strokeStyle = "rgba(123,107,94,.12)";
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(margin, y, 1460, 360, 28);
      c.fill();
      c.stroke();
      c.fillStyle = "#4C3F34";
      c.font = "700 30px Outfit, sans-serif";
      c.fillText(room.optionName || "Main Direction", margin + 36, y + 46);
      const stats = collectRoomPlanStats(room);
      c.font = "500 18px Outfit, sans-serif";
      c.fillStyle = "#7B6B5E";
      c.fillText(
        `Existing ${stats.existing} • New ${stats.newItems} • Keep ${stats.keep} • Move ${stats.move} • Replace ${stats.replace} • Remove ${stats.remove}`,
        margin + 36,
        y + 78,
      );
      if (img) c.drawImage(img, margin + 36, y + 104, 420, 220);
      c.fillStyle = "#4C3F34";
      c.font = "600 18px Outfit, sans-serif";
      c.fillText("Story Notes", margin + 500, y + 128);
      c.font = "500 18px Outfit, sans-serif";
      c.fillStyle = "#6A5A4F";
      const notes = (room.optionNotes || "No notes yet.").slice(0, 360);
      const words = notes.split(/\s+/);
      let line = "",
        lineY = y + 164;
      words.forEach((word) => {
        const test = (line ? `${line} ` : "") + word;
        if (c.measureText(test).width > 560 && line) {
          c.fillText(line, margin + 500, lineY);
          line = word;
          lineY += 28;
        } else line = test;
      });
      if (line) c.fillText(line, margin + 500, lineY);
    });
    window.ExportDownloads.downloadDataUrl(
      out.toDataURL("image/png"),
      window.ExportFilenames.fileName(curRoom, "design_summary", "png"),
    );
    toast("Design summary exported");
  });
}
window.RosePngExports = Object.freeze({
  exportComparisonSheet,
  exportDesignSummary,
  exportPNG,
  renderPlanModeToDataURL,
  renderRoomModeToDataURL,
});
