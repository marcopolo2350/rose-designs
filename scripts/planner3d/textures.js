(function initPlanner3DTextures() {
  function pickPreset(floorTypes = [], type) {
    return floorTypes.find((floorType) => floorType.id === type) || floorTypes[0] || {};
  }

  function canvas2D(documentRef, size) {
    const canvas = documentRef.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    return { canvas, context: canvas.getContext("2d") };
  }

  function makeTexture(THREERef, canvas, repeat = 1) {
    const texture = new THREERef.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREERef.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    return texture;
  }

  function buildFloorTexture({
    THREE: THREERef,
    document: documentRef,
    floorTypes,
    safeThreeColor,
    color,
    type,
  }) {
    const preset = pickPreset(floorTypes, type);
    const { canvas, context: c } = canvas2D(documentRef, 768);
    const base = safeThreeColor(color, preset.color);
    const baseHSL = { h: 0, s: 0, l: 0 };
    base.getHSL(baseHSL);
    const checkerMate = base
      .clone()
      .lerp(
        baseHSL.l > 0.52
          ? safeThreeColor("#231D1A", "#231D1A")
          : safeThreeColor("#FBF4EA", "#FBF4EA"),
        0.78,
      );
    c.fillStyle = `#${base.getHexString()}`;
    c.fillRect(0, 0, 768, 768);

    if (preset.family === "wood") {
      const plankH = 88;
      const jointW = 4;
      for (let y = 0; y < 768; y += plankH) {
        const row = Math.floor(y / plankH);
        const offset = row % 2 === 0 ? 0 : 104;
        c.fillStyle = row % 2 === 0 ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.13)";
        c.fillRect(0, y, 768, plankH - jointW);
        c.fillStyle = "rgba(18,10,4,.42)";
        c.fillRect(0, y + plankH - jointW, 768, jointW);
        for (let x = offset; x < 768; x += 200) {
          c.fillStyle = "rgba(18,10,4,.26)";
          c.fillRect(x, y, 5, plankH - jointW);
        }
        for (let g = 0; g < 11; g += 1) {
          const sx = g * 68 + offset * 0.18;
          c.strokeStyle = `rgba(255,255,255,${0.05 + g * 0.01})`;
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(sx, y + 8);
          c.lineTo(sx + 34, y + plankH - 12);
          c.stroke();
          c.strokeStyle = "rgba(34,20,10,.09)";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(sx + 18, y + 10);
          c.lineTo(sx + 42, y + plankH - 16);
          c.stroke();
        }
        c.fillStyle = "rgba(255,255,255,.16)";
        c.fillRect(0, y, 768, 4);
        c.fillStyle = "rgba(0,0,0,.08)";
        c.fillRect(0, y + 14, 768, 1);
      }
    } else if (preset.family === "tile") {
      const tile = 120;
      for (let y = 0; y < 768; y += tile) {
        for (let x = 0; x < 768; x += tile) {
          const v = (((x / tile) * 3 + (y / tile) * 7) % 5) * 0.026;
          c.fillStyle = `rgba(255,255,255,${0.05 + v})`;
          c.fillRect(x + 6, y + 6, tile - 12, tile - 12);
          c.fillStyle = "rgba(0,0,0,.07)";
          c.fillRect(x + tile - 18, y + tile - 18, 18, 18);
          c.strokeStyle = "rgba(255,255,255,.08)";
          c.lineWidth = 2;
          c.strokeRect(x + 8, y + 8, tile - 16, tile - 16);
        }
      }
      c.strokeStyle = "rgba(126,116,104,.98)";
      c.lineWidth = 10;
      for (let i = 0; i <= 768; i += tile) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 768);
        c.stroke();
        c.beginPath();
        c.moveTo(0, i);
        c.lineTo(768, i);
        c.stroke();
      }
    } else if (preset.family === "checker") {
      const tile = 160;
      for (let y = 0; y < 768; y += tile) {
        for (let x = 0; x < 768; x += tile) {
          const useAccent = ((x + y) / tile) % 2 === 1;
          const fill = useAccent ? checkerMate : base;
          c.fillStyle = `#${fill.getHexString()}`;
          c.fillRect(x, y, tile, tile);
          c.fillStyle = `rgba(255,255,255,${useAccent ? 0.03 : 0.08})`;
          c.fillRect(x + 8, y + 8, tile - 16, tile - 16);
          c.fillStyle = "rgba(0,0,0,.08)";
          c.fillRect(x, y + tile - 10, tile, 10);
        }
      }
      c.strokeStyle = "rgba(242,236,228,.82)";
      c.lineWidth = 10;
      for (let i = 0; i <= 768; i += tile) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 768);
        c.stroke();
        c.beginPath();
        c.moveTo(0, i);
        c.lineTo(768, i);
        c.stroke();
      }
    } else {
      for (let i = 0; i < 200; i += 1) {
        c.fillStyle = `rgba(255,255,255,${0.03 + (i % 6) * 0.01})`;
        c.beginPath();
        c.ellipse(
          (i * 47) % 768,
          (i * 71) % 768,
          22 + (i % 5) * 14,
          8 + (i % 4) * 6,
          (i % 8) * 0.28,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      c.strokeStyle = "rgba(255,255,255,.11)";
      c.lineWidth = 2.4;
      for (let i = 0; i < 14; i += 1) {
        c.beginPath();
        c.moveTo(0, i * 56 + 14);
        c.lineTo(768, i * 56 + Math.sin(i * 0.7) * 24);
        c.stroke();
      }
    }

    return makeTexture(THREERef, canvas, preset.repeat);
  }

  function applyPlanarUVs(THREERef, geometry, points) {
    if (!geometry?.attributes?.position || !points?.length) return geometry;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const spanX = Math.max(0.001, maxX - minX);
    const spanY = Math.max(0.001, maxY - minY);
    const position = geometry.attributes.position;
    const uv = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i += 1) {
      uv[i * 2] = (position.getX(i) - minX) / spanX;
      uv[i * 2 + 1] = (position.getY(i) - minY) / spanY;
    }
    geometry.setAttribute("uv", new THREERef.BufferAttribute(uv, 2));
    geometry.attributes.uv.needsUpdate = true;
    return geometry;
  }

  function buildFloorAccentTexture({ THREE: THREERef, document: documentRef, floorTypes, type }) {
    const preset = pickPreset(floorTypes, type);
    const { canvas, context: c } = canvas2D(documentRef, 1024);
    c.clearRect(0, 0, 1024, 1024);

    if (preset.family === "wood") {
      const plank = 96;
      for (let y = 0; y < 1024; y += plank) {
        c.fillStyle = "rgba(70,48,28,.18)";
        c.fillRect(0, y, 1024, 3);
        for (let x = 36; x < 1024; x += 148) {
          c.fillStyle = "rgba(255,255,255,.075)";
          c.fillRect(x, y + 10, 2, plank - 20);
        }
      }
      for (let i = 0; i < 180; i += 1) {
        c.strokeStyle = `rgba(255,255,255,${0.02 + (i % 5) * 0.005})`;
        c.lineWidth = 1.1;
        c.beginPath();
        const sx = (i * 37) % 1024;
        c.moveTo(sx, 0);
        c.bezierCurveTo(sx + 18, 220, sx - 12, 760, sx + 12, 1024);
        c.stroke();
      }
    } else if (preset.family === "tile" || preset.family === "checker") {
      const tile = preset.family === "tile" ? 128 : 160;
      c.strokeStyle = preset.family === "tile" ? "rgba(248,245,240,.94)" : "rgba(248,245,240,.82)";
      c.lineWidth = 10;
      for (let i = 0; i <= 1024; i += tile) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 1024);
        c.stroke();
        c.beginPath();
        c.moveTo(0, i);
        c.lineTo(1024, i);
        c.stroke();
      }
    } else {
      c.strokeStyle = "rgba(255,255,255,.13)";
      c.lineWidth = 3.4;
      for (let i = 0; i < 14; i += 1) {
        c.beginPath();
        c.moveTo(0, i * 72 + 24);
        c.lineTo(1024, i * 72 + Math.sin(i * 1.2) * 24);
        c.stroke();
      }
    }

    return makeTexture(THREERef, canvas, preset.repeat);
  }

  window.Planner3DTextures = Object.freeze({
    applyPlanarUVs,
    buildFloorAccentTexture,
    buildFloorTexture,
    pickPreset,
  });
})();
