/* global downloadTextFile, esc, exportBaseName, formatArea, formatDistance, getFurnitureRenderState, getRoomBounds2D, polygonArea, wE, wL, wS */
function rotatedFurnitureCorners(item) {
  const hw = (item.w || 2) / 2,
    hd = (item.d || 1.5) / 2,
    an = ((item.rotation || 0) * Math.PI) / 180;
  const pts = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  return pts.map(([dx, dz]) => ({
    x: (item.x || 0) + dx * Math.cos(an) - dz * Math.sin(an),
    y: (item.z || 0) + dx * Math.sin(an) + dz * Math.cos(an),
  }));
}
function openingCenterPoint(room, opening) {
  const wall = room.walls.find((w) => w.id === opening.wallId);
  if (!wall) return null;
  const a = wS(room, wall),
    b = wE(room, wall),
    wl = wL(room, wall) || 1,
    t = (opening.offset || 0) / wl;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
    wallLength: wl,
  };
}
function roomExportMeta(room = curRoom) {
  const b = getRoomBounds2D(room);
  const area = polygonArea(room.polygon || []);
  return { bounds: b, area };
}
function exportSVG() {
  if (!curRoom || !curRoom.polygon?.length) {
    toast("Open a room first");
    return;
  }
  const room = curRoom;
  const meta = roomExportMeta(room);
  // Use a wider pad to make room for per-wall dimensions, scale bar, and north arrow.
  const pad = 3.5;
  const minX = meta.bounds.x0 - pad,
    maxX = meta.bounds.x1 + pad,
    minY = meta.bounds.y0 - pad,
    maxY = meta.bounds.y1 + pad;
  const vbW = maxX - minX,
    vbH = maxY - minY;
  const mapPoint = (pt) => `${(pt.x - minX).toFixed(2)},${(maxY - pt.y).toFixed(2)}`;
  const polygonPoints = (room.polygon || []).map(mapPoint).join(" ");
  const walls = (room.walls || [])
    .map((w) => {
      const a = wS(room, w),
        b = wE(room, w);
      return `<line x1="${(a.x - minX).toFixed(2)}" y1="${(maxY - a.y).toFixed(2)}" x2="${(b.x - minX).toFixed(2)}" y2="${(maxY - b.y).toFixed(2)}" />`;
    })
    .join("\n");
  const openings = (room.openings || [])
    .map((op) => {
      const center = openingCenterPoint(room, op);
      if (!center) return "";
      const half = (op.width || 3) / 2;
      const dx = Math.cos(center.angle) * half,
        dy = Math.sin(center.angle) * half;
      const x1 = (center.x - dx - minX).toFixed(2),
        y1 = (maxY - (center.y - dy)).toFixed(2);
      const x2 = (center.x + dx - minX).toFixed(2),
        y2 = (maxY - (center.y + dy)).toFixed(2);
      return `<line class="${op.type}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    })
    .join("\n");
  const furniture = (room.furniture || [])
    .filter((item) => getFurnitureRenderState(item, room).visible)
    .map((item) => {
      const corners = rotatedFurnitureCorners(item);
      const pts = corners.map(mapPoint).join(" ");
      const labelX = ((item.x || 0) - minX).toFixed(2),
        labelY = (maxY - (item.z || 0)).toFixed(2);
      return `<g class="furniture ${item.source || "new"}"><polygon points="${pts}" /><text x="${labelX}" y="${labelY}" text-anchor="middle">${esc(item.label || "Item")}</text></g>`;
    })
    .join("\n");
  const annotations = (room.textAnnotations || [])
    .map((note) => {
      const x = ((note.x || 0) - minX).toFixed(2),
        y = (maxY - (note.z || 0)).toFixed(2);
      const fill = esc(note.color || "#8E6E6B");
      const size = (Math.max(11, Number(note.fontSize) || 14) * 0.06).toFixed(2);
      return `<text class="annotation" x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="middle">${esc(note.text || "Note")}</text>`;
    })
    .join("\n");
  const dimensionAnnotations = (room.dimensionAnnotations || [])
    .map((note) => {
      const x1 = ((note.x1 || 0) - minX).toFixed(2),
        y1 = (maxY - (note.z1 || 0)).toFixed(2);
      const x2 = ((note.x2 || 0) - minX).toFixed(2),
        y2 = (maxY - (note.z2 || 0)).toFixed(2);
      const mx = (((note.x1 || 0) + (note.x2 || 0)) / 2 - minX).toFixed(2),
        my = (maxY - ((note.z1 || 0) + (note.z2 || 0)) / 2).toFixed(2);
      const label = esc(
        (note.label || "").trim() ||
          formatDistance(
            Math.hypot((note.x2 || 0) - (note.x1 || 0), (note.z2 || 0) - (note.z1 || 0)),
          ),
      );
      const stroke = esc(note.color || "#8E6E6B");
      const size = (Math.max(10, Number(note.fontSize) || 13) * 0.06).toFixed(2);
      return `<g class="dim-annotation" stroke="${stroke}" fill="${stroke}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" /><text x="${mx}" y="${my}" font-size="${size}" text-anchor="middle">${label}</text></g>`;
    })
    .join("\n");
  const roomLabelX = (meta.bounds.cx - minX).toFixed(2),
    roomLabelY = (maxY - meta.bounds.cy).toFixed(2);
  const widthLabel = formatDistance(meta.bounds.width),
    heightLabel = formatDistance(meta.bounds.height);
  // Per-wall dimension ticks label each edge of the room polygon with its length.
  const wallDims = (() => {
    const poly = room.polygon || [];
    if (poly.length < 2) return "";
    const parts = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length];
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.6) continue;
      const mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2;
      // offset perpendicular toward outside of polygon (away from centroid)
      const tx = -dy / len,
        ty = dx / len;
      const toCen = Math.sign((meta.bounds.cx - mx) * tx + (meta.bounds.cy - my) * ty);
      const off = 0.55 * (toCen > 0 ? -1 : 1);
      const lx = (mx + tx * off - minX).toFixed(2),
        ly = (maxY - (my + ty * off)).toFixed(2);
      const ang = (-Math.atan2(dy, dx) * 180) / Math.PI;
      parts.push(
        `<text class="walldim" x="${lx}" y="${ly}" transform="rotate(${ang.toFixed(1)} ${lx} ${ly})">${esc(formatDistance(len))}</text>`,
      );
    }
    return parts.join("\n");
  })();
  // Scale bar uses 1 ft increments, up to 5 ft when the room allows.
  const scaleBar = (() => {
    const barFt = Math.min(5, Math.max(2, Math.floor(meta.bounds.width / 4)));
    const barX = 0.8,
      barY = vbH - 1.1;
    const unit = 1;
    const segs = [];
    for (let i = 0; i < barFt; i++) {
      segs.push(
        `<rect x="${(barX + i * unit).toFixed(2)}" y="${barY.toFixed(2)}" width="${unit.toFixed(2)}" height=".18" fill="${i % 2 ? "#3a2e25" : "#faf8f4"}" stroke="#3a2e25" stroke-width=".03"/>`,
      );
    }
    segs.push(
      `<text class="scalebar" x="${barX.toFixed(2)}" y="${(barY - 0.2).toFixed(2)}">0</text>`,
    );
    segs.push(
      `<text class="scalebar" x="${(barX + barFt * unit).toFixed(2)}" y="${(barY - 0.2).toFixed(2)}">${barFt} ft</text>`,
    );
    return segs.join("\n");
  })();
  // North arrow, top-right corner.
  const northArrow = (() => {
    const nx = vbW - 1.2,
      ny = 1.4,
      r = 0.55;
    return `<g class="north" transform="translate(${nx.toFixed(2)} ${ny.toFixed(2)})">
      <circle r="${r.toFixed(2)}" fill="none" stroke="#3a2e25" stroke-width=".04"/>
      <polygon points="0,-${r.toFixed(2)} ${(r * 0.28).toFixed(2)},${(r * 0.15).toFixed(2)} 0,0 -${(r * 0.28).toFixed(2)},${(r * 0.15).toFixed(2)}" fill="#3a2e25"/>
      <text x="0" y="-${(r + 0.18).toFixed(2)}" class="north-label">N</text>
    </g>`;
  })();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}">
  <style>
    .room-fill { fill: rgba(216,229,214,.45); stroke: #5f5a54; stroke-width: .08; }
    .walls { stroke: #3f3a36; stroke-width: .22; stroke-linecap: square; }
    .door { stroke: #b86e54; stroke-width: .16; }
    .window { stroke: #5b88b2; stroke-width: .16; }
    .furniture polygon { fill: rgba(139,115,85,.16); stroke: #6b5640; stroke-width: .08; }
    .furniture.existing polygon { fill: rgba(94,135,112,.12); stroke: #5e8770; }
    .furniture text { font: .52px Inter, Arial, sans-serif; fill: #3a2e25; dominant-baseline: middle; }
    .annotation { font-family: Inter, Arial, sans-serif; font-weight: 700; dominant-baseline: middle; }
    .dim-annotation line { stroke-width: .08; }
    .dim-annotation text { font-family: Inter, Arial, sans-serif; font-weight: 700; dominant-baseline: middle; }
    .room-title { font: .8px Georgia, serif; fill: #3a2e25; text-anchor: middle; }
    .room-meta { font: .46px Inter, Arial, sans-serif; fill: #7b6b5e; text-anchor: middle; }
    .dimension { font: .44px Inter, Arial, sans-serif; fill: #8b7355; text-anchor: middle; }
    .walldim { font: .36px Inter, Arial, sans-serif; fill: #5a4838; text-anchor: middle; dominant-baseline: middle; font-weight: 600; }
    .scalebar { font: .32px Inter, Arial, sans-serif; fill: #3a2e25; dominant-baseline: auto; }
    .north-label { font: .38px Georgia, serif; fill: #3a2e25; text-anchor: middle; font-weight: 700; }
  </style>
  <rect width="${vbW.toFixed(2)}" height="${vbH.toFixed(2)}" fill="#faf8f4" />
  <polygon class="room-fill" points="${polygonPoints}" />
  <g class="walls">${walls}</g>
  <g class="openings">${openings}</g>
  <g class="furniture">${furniture}</g>
  <g class="annotations">${annotations}</g>
  <g class="dimension-annotations">${dimensionAnnotations}</g>
  <text class="room-title" x="${roomLabelX}" y="${roomLabelY}">${esc(room.name || "Room")}</text>
  <text class="room-meta" x="${roomLabelX}" y="${(Number(roomLabelY) + 0.9).toFixed(2)}">${formatArea(meta.area)}</text>
  <text class="dimension" x="${(meta.bounds.cx - minX).toFixed(2)}" y="${(vbH - 0.5).toFixed(2)}">${widthLabel}</text>
  <text class="dimension" x="${(0.6).toFixed(2)}" y="${(vbH / 2).toFixed(2)}" transform="rotate(-90 ${(0.6).toFixed(2)} ${(vbH / 2).toFixed(2)})">${heightLabel}</text>
  <g class="wall-dimensions">${wallDims}</g>
  ${scaleBar}
  ${northArrow}
</svg>`;
  downloadTextFile(`${exportBaseName(room, "plan")}.svg`, svg, "image/svg+xml;charset=utf-8");
  toast("SVG exported");
}
window.RoseSvgExports = Object.freeze({
  exportSVG,
  openingCenterPoint,
  roomExportMeta,
  rotatedFurnitureCorners,
});
