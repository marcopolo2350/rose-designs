const SHORTCUT_GROUPS = [
  {
    label: "Tools",
    items: [
      ["V", "Select"],
      ["W", "Wall draw"],
      ["D", "Door"],
      ["T", "Text / annotation"],
      ["Shift+D", "Dimension note"],
    ],
  },
  {
    label: "View",
    items: [
      ["Tab", "Toggle 2D / 3D"],
      ["+ / -", "Zoom in / out"],
      ["Esc", "Deselect / close"],
    ],
  },
  {
    label: "Edit",
    items: [
      ["Ctrl+Z", "Undo"],
      ["Ctrl+Y / Ctrl+Shift+Z", "Redo"],
      ["Ctrl+C / Ctrl+V", "Copy / paste furniture"],
      ["Del", "Delete selected"],
      ["R", "Rotate selected"],
    ],
  },
  {
    label: "Export",
    items: [
      ["Ctrl+S", "Save"],
      ["Ctrl+P", "Export PDF"],
      ["Ctrl+Shift+S", "Export SVG"],
    ],
  },
  {
    label: "Rooms",
    items: [
      ["Ctrl+Shift+Q", "Auto-square room"],
      ["?", "This cheat sheet"],
    ],
  },
];

function shortcutSheetMarkup() {
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || "");
  const mod = isMac ? "⌘" : "Ctrl";
  return `<div class="shortcut-card">
      <div class="shortcut-head"><div class="shortcut-title">Keyboard Shortcuts</div><button class="shortcut-x" type="button" data-action="close-shortcut-sheet" aria-label="Close">×</button></div>
      <div class="shortcut-grid">${SHORTCUT_GROUPS.map(
        (group) => `
        <div class="shortcut-group">
          <div class="shortcut-group-label">${group.label}</div>
          ${group.items.map(([key, label]) => `<div class="shortcut-row"><kbd>${key.replace(/Ctrl/g, mod)}</kbd><span>${label}</span></div>`).join("")}
        </div>`,
      ).join("")}</div>
      <div class="shortcut-hint">Press <kbd>?</kbd> anytime to open this sheet</div>
    </div>`;
}

function getShortcutSheet() {
  let sheet = document.getElementById("shortcutSheet");
  if (sheet) return sheet;
  sheet = document.createElement("div");
  sheet.id = "shortcutSheet";
  sheet.className = "shortcut-sheet";
  sheet.innerHTML = shortcutSheetMarkup();
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) sheet.classList.remove("on");
  });
  document.body.appendChild(sheet);
  return sheet;
}

function closeShortcutSheet() {
  const sheet = document.getElementById("shortcutSheet");
  if (sheet) sheet.classList.remove("on");
}

function toggleShortcutSheet() {
  const sheet = getShortcutSheet();
  sheet.classList.toggle("on");
}

function bindEditorKeys() {
  if (window.__roseEditorKeysBound) return;
  window.addEventListener("keydown", (event) => {
    if (isEditableTarget(event.target)) return;
    const key = (event.key || "").toLowerCase();
    const mod = event.metaKey || event.ctrlKey;
    if (mod && key === "c" && curRoom && selectedFurnitureIndices().length) {
      event.preventDefault();
      copySelectedFurniture();
      return;
    }
    if (mod && key === "v" && curRoom && furnitureClipboard?.items?.length) {
      event.preventDefault();
      pasteFurniture();
      return;
    }
    if (mod && key === "z") {
      event.preventDefault();
      if (event.shiftKey) doRedo();
      else doUndo();
      return;
    }
    if (mod && key === "s" && !event.shiftKey) {
      event.preventDefault();
      if (curRoom) savePrj();
      return;
    }
    if (mod && event.shiftKey && key === "s") {
      event.preventDefault();
      if (curRoom) exportSVG();
      return;
    }
    if (mod && key === "p") {
      event.preventDefault();
      if (curRoom) exportPDF();
      return;
    }
    if (mod && event.shiftKey && key === "q") {
      event.preventDefault();
      if (curRoom) autoSquareCurrentRoom();
      return;
    }
    if (key === "tab" && curRoom) {
      event.preventDefault();
      toggle3D();
      return;
    }
    if ((key === "?" || (key === "/" && event.shiftKey)) && !mod) {
      event.preventDefault();
      toggleShortcutSheet();
      return;
    }
    if (key === "escape") {
      const sheet = document.getElementById("shortcutSheet");
      if (sheet && sheet.classList.contains("on")) {
        sheet.classList.remove("on");
        event.preventDefault();
        return;
      }
    }
    if (key === "v" && !mod && curRoom) {
      event.preventDefault();
      setTool("select");
      return;
    }
    if (key === "w" && !mod && curRoom) {
      event.preventDefault();
      setTool("wall");
      return;
    }
    if (key === "d" && !mod && curRoom) {
      event.preventDefault();
      setTool(event.shiftKey ? "dim" : "door");
      return;
    }
    if (key === "t" && !mod && curRoom) {
      event.preventDefault();
      setTool("annotation");
      return;
    }
    if ((key === "+" || key === "=" || key === "-") && !mod && canvas) {
      event.preventDefault();
      const factor = key === "-" ? 0.9 : 1.1;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const before = tW(cx, cy);
      vScale = Math.max(8, Math.min(140, vScale * factor));
      vOff.x = cx - before.x * vScale;
      vOff.y = cy - before.y * vScale;
      draw();
      return;
    }
    if (mod && key === "y" && !event.shiftKey) {
      event.preventDefault();
      doRedo();
      return;
    }
    if ((key === "delete" || key === "backspace") && curRoom && sel.type === "furniture") {
      event.preventDefault();
      deleteSelectedFurniture();
      return;
    }
    if (key === "escape" && curRoom) {
      event.preventDefault();
      clearFurnitureSelection();
      sel = { type: null, idx: -1 };
      panelHidden = false;
      draw();
      showP();
    }
  });
  window.__roseEditorKeysBound = true;
}

if (typeof window !== "undefined") {
  window.bindEditorKeys = bindEditorKeys;
  window.toggleShortcutSheet = toggleShortcutSheet;
  window.closeShortcutSheet = closeShortcutSheet;
}
