import { expect, test } from "playwright/test";
import { startStaticServer } from "../scripts/devtools/static-server.mjs";

let server;

test.beforeAll(async () => {
  server = await startStaticServer(process.cwd());
});

test.afterAll(async () => {
  await server?.close();
});

async function ensureRoomPanelOpen(page) {
  const buildTab = page.locator('[data-action="room-panel-group"][data-group="build"]');
  const opener = page.locator('[data-action="open-panel"]');
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await buildTab.isVisible().catch(() => false)) return buildTab;
    if (await opener.isVisible().catch(() => false)) {
      await opener.click();
      break;
    }
    await page.waitForTimeout(100);
  }
  await expect(buildTab).toBeVisible();
  return buildTab;
}

async function expectPropsPanelHasNoInlineHandlers(page) {
  const inlineHandlers = await page
    .locator("#propsP [onclick], #propsP [oninput], #propsP [onchange]")
    .count();
  expect(inlineHandlers).toBe(0);
}

async function expectFloorButtonsAreLegible(page) {
  const floorButtons = page.locator('#propsP .mat-grid.tall [data-action="set-active-floor"]');
  await expect(floorButtons.first()).toBeVisible();
  const snapshots = await floorButtons.evaluateAll((buttons) =>
    buttons.map((button) => {
      const title = button.querySelector(".mat-btn-title");
      const meta = button.querySelector(".mat-btn-meta");
      const bounds = button.getBoundingClientRect();
      const titleBounds = title?.getBoundingClientRect();
      const metaBounds = meta?.getBoundingClientRect();
      const rectInside = (rect) =>
        Boolean(
          rect &&
          rect.left >= bounds.left - 1 &&
          rect.right <= bounds.right + 1 &&
          rect.top >= bounds.top - 1 &&
          rect.bottom <= bounds.bottom + 1,
        );
      const rectsOverlap =
        Boolean(titleBounds && metaBounds) &&
        !(
          titleBounds.right <= metaBounds.left ||
          metaBounds.right <= titleBounds.left ||
          titleBounds.bottom <= metaBounds.top + 1 ||
          metaBounds.bottom <= titleBounds.top + 1
        );
      return {
        text: button.textContent.replace(/\s+/g, " ").trim(),
        title: title?.textContent?.replace(/\s+/g, " ").trim() || "",
        meta: meta?.textContent?.replace(/\s+/g, " ").trim() || "",
        hasTitle: Boolean(title),
        hasMeta: Boolean(meta),
        titleInside: rectInside(titleBounds),
        metaInside: rectInside(metaBounds),
        textOverlaps: rectsOverlap,
      };
    }),
  );

  expect(snapshots.length).toBeGreaterThan(0);
  for (const snapshot of snapshots) {
    expect(snapshot.hasTitle).toBe(true);
    expect(snapshot.hasMeta).toBe(true);
    expect(snapshot.title).toMatch(/^Floor\s+\d+$/);
    expect(snapshot.meta).toMatch(/^\d+\s+rooms?$/);
    expect(snapshot.text).not.toMatch(/[^\x20-\x7e]|[?]{2,}|undefined|null/i);
    expect(snapshot.titleInside).toBe(true);
    expect(snapshot.metaInside).toBe(true);
    expect(snapshot.textOverlaps).toBe(false);
  }
}

test("canonical shell boots and delegated actions work", async ({ page }, testInfo) => {
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));

  await page.goto(`${server.url}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-runtime-ready="1"]');
  await expect(page).toHaveTitle("Rose's Indoor Designs");
  await expect(page.locator("#scrHome")).toHaveClass(/on/);

  const shellInlineHandlers = await page.locator("[onclick], [oninput], [onchange]").count();
  expect(shellInlineHandlers).toBe(0);

  const metaVersion = await page
    .locator('meta[name="application-version"]')
    .getAttribute("content");
  const runtimeVersion = await page.evaluate(() => window.APP_VERSION);
  expect(runtimeVersion).toBe(metaVersion);

  await page.locator(".w-btn").click();
  if (testInfo.project.name === "desktop") {
    await page.keyboard.press("?");
    await expect(page.locator("#shortcutSheet")).toHaveClass(/on/);
    await page.locator('[data-action="close-shortcut-sheet"]').click();
    await expect(page.locator("#shortcutSheet")).not.toHaveClass(/on/);
  }

  await page.evaluate(() => startTut(true));
  await expect(page.locator("#tutOv")).toHaveClass(/on/);
  await expect(page.locator("#tutCard")).toContainText("Start with one room");
  const tutorialInlineMarkup = await page
    .locator("#tutCard [onclick], #tutCard [oninput], #tutCard [onchange], #tutCard [style]")
    .count();
  expect(tutorialInlineMarkup).toBe(0);
  await page.locator('#tutCard [data-action="tutorial-end"]').click();
  await expect(page.locator("#tutOv")).not.toHaveClass(/on/);

  await page.locator('[data-action="open-create-room"]').first().click();
  await expect(page.locator("#crMod")).toHaveClass(/on/);
  const createModalInlineHandlers = await page
    .locator("#crMod [onclick], #crMod [oninput], #crMod [onchange]")
    .count();
  expect(createModalInlineHandlers).toBe(0);
  const presetInlineMarkup = await page
    .locator("#preG [onclick], #preG [oninput], #preG [onchange], #preG [style]")
    .count();
  expect(presetInlineMarkup).toBe(0);
  await page.locator('[data-action="select-create-room-preset"]').first().click();
  await page.locator('[data-action="create-room-from-preset"]').click();
  await expect(page.locator("#scrEd")).toHaveClass(/on/);
  const homeCardInlineHandlers = await page
    .locator("#prjList [onclick], #prjList [onpointerdown]")
    .count();
  expect(homeCardInlineHandlers).toBe(0);
  const unsafeProjectName = '<img src=x onerror="window.__roseXss=1"> Smoke';
  const originalProjectName = await page.evaluate(() => curRoom.projectName);
  await page.evaluate((name) => {
    curRoom.projectName = name;
    renderHome();
  }, unsafeProjectName);
  await expect(page.locator("#prjList .pc h3").first()).toHaveText(unsafeProjectName);
  expect(await page.locator("#prjList .pc h3 img").count()).toBe(0);
  expect(await page.evaluate(() => Boolean(window.__roseXss))).toBe(false);
  await page.evaluate((name) => {
    curRoom.projectName = name;
    renderHome();
  }, originalProjectName);
  await page.evaluate(() => showDeleteConfirm(curRoom.projectId || curRoom.id));
  await expect(page.locator("#delConfirm")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#delConfirm")).toHaveAttribute("aria-modal", "true");
  await expect(page.locator('[data-action="close-delete-confirm"]')).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator('[data-action="confirm-delete"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-action="close-delete-confirm"]')).toBeFocused();
  const deleteConfirmInlineMarkup = await page
    .locator(
      "#delConfirm [onclick], #delConfirm [oninput], #delConfirm [onchange], #delConfirm [style]",
    )
    .count();
  expect(deleteConfirmInlineMarkup).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#delConfirm")).toHaveCount(0);

  await page.evaluate(() => openCloudSyncSettings());
  await expect(page.locator("#cloudSyncModal [role='dialog']")).toHaveAttribute(
    "aria-modal",
    "true",
  );
  await expect(page.locator("#cloudUrl")).toBeFocused();
  const cloudInlineMarkup = await page
    .locator("#cloudSyncModal [onclick], #cloudSyncModal [oninput], #cloudSyncModal [style]")
    .count();
  expect(cloudInlineMarkup).toBe(0);
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#cloudSaveBtn")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#cloudUrl")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#cloudSyncModal")).toHaveCount(0);

  const buildTab = await ensureRoomPanelOpen(page);
  await page.locator('[data-action="room-panel-group"][data-group="style"]').click();
  await expect(page.locator('[data-action="room-panel-group"][data-group="style"]')).toHaveClass(
    /sel/,
  );
  await page.locator('[data-action="set-wall-finish"]').nth(1).click();
  await page.locator('[data-action="set-floor-type"]').nth(1).click();
  await page.locator('[data-action="set-trim-color"]').first().click();
  await page.locator('[data-action="set-lighting-preset"]').nth(1).click();
  await page.locator('[data-action="set-light-character-input"]').evaluate((node) => {
    node.value = "0.7";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator('[data-action="set-ceiling-brightness-input"]').evaluate((node) => {
    node.value = "1.1";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator('[data-action="set-room-type"]').nth(1).click();
  await page.locator('[data-action="toggle-design-preset-panel"]').click();
  await page.locator('[data-action="select-pending-design-preset"]').first().click();
  await page.locator('[data-action="apply-pending-design-preset"]').click();
  await page.locator('[data-action="room-panel-group"][data-group="build"]').click();
  await page.locator('[data-action="set-room-height-input"]').fill("9.5");
  await page.locator('[data-action="set-adj-room-width"]').click();
  await expect(page.locator('[data-action="room-panel-group"][data-group="build"]')).toHaveClass(
    /sel/,
  );
  await page.locator('[data-action="set-adj-room-width"]').fill("8");
  await page.locator('[data-action="set-adj-room-depth"]').click();
  await page.locator('[data-action="attach-adjacent-room"][data-side="east"]').click();
  await expect(page.locator("body")).toContainText("Living Room East");
  await ensureRoomPanelOpen(page);
  await expect(page.locator("#propsP")).toContainText("Building 2 rooms");
  await expectFloorButtonsAreLegible(page);
  const buildPanelInlineHandlers = await page
    .locator("#propsP [onclick], #propsP [oninput], #propsP [onchange]")
    .count();
  expect(buildPanelInlineHandlers).toBe(0);
  await page.locator('[data-action="toggle-room-layer"]').first().click();
  await page.locator('[data-action="toggle-room-layer"]').first().click();
  await page.locator('[data-action="room-panel-group"][data-group="furnish"]').click();
  await page.locator('[data-action="toggle-furniture-snap"]').click();
  await page.locator('[data-action="toggle-furniture-snap"]').click();
  await page.locator('[data-action="toggle-multi-select"]').click();
  await page.locator('[data-action="toggle-multi-select"]').click();
  await page.locator('[data-action="toggle-unit-system"]').click();
  await page.locator('[data-action="toggle-unit-system"]').click();
  await page.locator('[data-action="toggle-existing-room-mode"]').click();
  await page.locator('[data-action="toggle-ghost-existing"]').click();
  await page.locator('[data-action="toggle-hide-removed-existing"]').click();
  await page.locator('[data-action="toggle-plan-legend"]').click();
  await page.locator('[data-action="set-plan-view-mode"][data-mode="existing"]').click();
  await page.locator('[data-action="set-plan-view-mode"][data-mode="combined"]').click();
  await page.locator('[data-action="set-selected-furniture-source"][data-source="new"]').click();
  await page.locator('[data-action="room-panel-group"][data-group="present"]').click();
  await page.locator('[data-action="rename-current-option"]').fill("Smoke Main");
  await page.locator('[data-action="rename-current-option"]').dispatchEvent("change");
  await page.locator('[data-action="set-current-option-notes"]').fill("Smoke notes");
  await page.locator('[data-action="set-current-option-notes"]').dispatchEvent("change");
  await page.locator('[data-action="switch-to-option"]').first().click();
  const presentPanelInlineHandlers = await page
    .locator("#propsP [onclick], #propsP [oninput], #propsP [onchange]")
    .count();
  expect(presentPanelInlineHandlers).toBe(0);
  await ensureRoomPanelOpen(page);
  await page.locator('[data-action="prop-close"]').dispatchEvent("click");
  await expect(page.locator("#propsP")).not.toHaveClass(/on/);

  await page.locator('[data-tool="furniture"]').click();
  await page.locator("#edCan").click({ position: { x: 260, y: 220 } });
  await expect(page.locator("#furnPickOv")).toBeVisible();
  const pickerInlineHandlers = await page
    .locator(
      "#furnPickOv [onclick], #furnPickOv [oninput], #furnPickOv [onchange], #furnPickOv [onfocus], #furnPickOv [onpointerenter]",
    )
    .count();
  expect(pickerInlineHandlers).toBe(0);
  await page.locator("#furnSearch").fill("sofa");
  await expect(page.locator(".furn-option:visible").first()).toBeVisible();
  await page
    .locator('.furn-option:visible [data-action="catalog-toggle-favorite"]')
    .first()
    .click();
  await page.locator('[data-action="catalog-close"]').click();
  await expect(page.locator("#furnPickOv")).toHaveCount(0);
  await page.evaluate(() => {
    const item = FURN_ITEMS.find((candidate) => /sofa/i.test(candidate.label)) || FURN_ITEMS[0];
    const registry = MODEL_REGISTRY[item.assetKey] || {};
    const mountType = resolveFurnitureMountType(item, item, registry);
    curRoom.furniture.push(
      normalizeFurnitureRecord({
        id: uid(),
        label: item.label,
        category: item.category,
        x: 4,
        z: 4,
        w: item.w,
        d: item.d,
        rotation: 0,
        mountType,
        elevation: Number.isFinite(item.elevation)
          ? item.elevation
          : defaultElevation(mountType, item.assetKey, resolveLabel(item.label)),
        assetKey: item.assetKey,
        yOffset: registry.yOffset || 0,
        visible: true,
      }),
    );
    panelHidden = false;
    setFurnitureSelection(curRoom.furniture.length - 1);
    showP();
  });
  await expect(page.locator("#propsP")).toContainText(/Sofa/i);
  const furniturePanelInlineHandlers = await page
    .locator("#propsP [onclick], #propsP [oninput], #propsP [onchange]")
    .count();
  expect(furniturePanelInlineHandlers).toBe(0);
  await page
    .locator('[data-action="update-selected-furniture"][data-field="label"]')
    .fill("Smoke Sofa");
  await page
    .locator('[data-action="update-selected-furniture"][data-field="label"]')
    .dispatchEvent("change");
  await page.locator('[data-action="rotate-selected-furniture"][data-delta="15"]').click();
  await page.locator('[data-action="toggle-selected-furniture-lock"]').click();
  await page
    .locator('[data-action="set-selected-furniture-source"][data-source="existing"]')
    .click();
  await page.locator('[data-action="set-selected-redesign-action"]').first().click();
  await page.locator('[data-action="set-selected-furniture-source"][data-source="new"]').click();
  await page.evaluate(() => {
    sel = { type: "vertex", idx: 0 };
    panelHidden = false;
    showP();
  });
  await expect(page.locator("#propsP")).toContainText("Vertex");
  await expectPropsPanelHasNoInlineHandlers(page);
  await page.locator('[data-action="update-selected-vertex"][data-field="x"]').fill("0.5");
  await page
    .locator('[data-action="update-selected-vertex"][data-field="x"]')
    .dispatchEvent("change");
  await page.evaluate(() => {
    curRoom.openings.push({
      id: uid(),
      type: "door",
      wallId: curRoom.walls[0].id,
      offset: 1,
      width: 3,
      height: 7,
      sillHeight: 0,
      swing: "in",
      hinge: "left",
    });
    sel = { type: "opening", idx: curRoom.openings.length - 1 };
    panelHidden = false;
    showP();
  });
  await expect(page.locator("#propsP")).toContainText("Door");
  await expectPropsPanelHasNoInlineHandlers(page);
  await page
    .locator('[data-action="update-selected-opening"][data-field="swing"]')
    .selectOption("out");
  await page.evaluate(() => {
    curRoom.structures.push({
      id: uid(),
      type: "closet",
      rect: { x: 1, y: 1, w: 2, h: 2 },
      finish: "white_shaker",
    });
    sel = { type: "structure", idx: curRoom.structures.length - 1 };
    panelHidden = false;
    showP();
  });
  await expect(page.locator("#propsP")).toContainText("Closet");
  await expectPropsPanelHasNoInlineHandlers(page);
  await page
    .locator('[data-action="update-selected-structure"][data-field="finish"]')
    .selectOption("natural_oak");
  await page.evaluate(() => {
    curRoom.textAnnotations.push({
      id: uid(),
      text: "Smoke note",
      x: 2,
      z: 2,
      fontSize: 14,
      color: "#8E6E6B",
    });
    sel = { type: "annotation", idx: curRoom.textAnnotations.length - 1 };
    panelHidden = false;
    showP();
  });
  await expect(page.locator("#propsP")).toContainText("Annotation");
  await expectPropsPanelHasNoInlineHandlers(page);
  await page
    .locator('[data-action="update-selected-annotation"][data-field="text"]')
    .fill("Updated note");
  await page
    .locator('[data-action="update-selected-annotation"][data-field="text"]')
    .dispatchEvent("change");
  await page.evaluate(() => {
    curRoom.dimensionAnnotations.push({
      id: uid(),
      label: "",
      x1: 1,
      z1: 1,
      x2: 3,
      z2: 1,
      offset: 0.8,
      fontSize: 13,
      color: "#8E6E6B",
    });
    sel = { type: "dim_annotation", idx: curRoom.dimensionAnnotations.length - 1 };
    panelHidden = false;
    showP();
  });
  await expect(page.locator("#propsP")).toContainText("Dimension Note");
  await expectPropsPanelHasNoInlineHandlers(page);
  await page
    .locator('[data-action="update-selected-dimension-annotation"][data-field="label"]')
    .fill("Smoke dimension");
  await page
    .locator('[data-action="update-selected-dimension-annotation"][data-field="label"]')
    .dispatchEvent("change");
  const undoStripInlineHandlers = await page.locator("#undoStrip [onclick]").count();
  expect(undoStripInlineHandlers).toBe(0);

  const beforeImportCount = await page.evaluate(() => projects.length);
  const projectImportDocument = JSON.stringify({
    schemaVersion: 2,
    appVersion: "playwright-smoke",
    projects: [
      {
        id: "playwright-import-room",
        name: "Imported Smoke Room",
        polygon: [
          { x: 0, y: 0 },
          { x: 9, y: 0 },
          { x: 9, y: 8 },
          { x: 0, y: 8 },
        ],
        walls: [],
        openings: [],
        structures: [],
        furniture: [],
        dimensionAnnotations: [],
        textAnnotations: [],
      },
    ],
  });
  await page.locator("#projectJsonInput").setInputFiles({
    name: "rose-import-smoke.json",
    mimeType: "application/json",
    buffer: Buffer.from(projectImportDocument),
  });
  await expect
    .poll(() => page.evaluate(() => projects.some((room) => room.name === "Imported Smoke Room")))
    .toBe(true);
  const afterImportCount = await page.evaluate(() => projects.length);
  expect(afterImportCount).toBe(beforeImportCount + 1);

  expect(runtimeErrors).toEqual([]);
});

test("3D view boots without Three shader warning spam", async ({ page }) => {
  const runtimeMessages = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") runtimeMessages.push(`console: ${text}`);
    if (
      ["warn", "warning"].includes(message.type()) &&
      /THREE\.WebGLProgram|Sample Bias/i.test(text)
    ) {
      runtimeMessages.push(`warning: ${text}`);
    }
  });
  page.on("pageerror", (error) => runtimeMessages.push(`page: ${error.message}`));

  await page.goto(`${server.url}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-runtime-ready="1"]');
  await page.locator(".w-btn").click();
  await page.locator('[data-action="open-create-room"]').first().click();
  await page.locator('[data-action="select-create-room-preset"]').first().click();
  await page.locator('[data-action="create-room-from-preset"]').click();
  await expect(page.locator("#scrEd")).toHaveClass(/on/);

  await page.locator("#b3d").click();
  await expect(page.locator("#threeC")).toHaveClass(/on/);
  await expect(page.locator("#threeC canvas")).toBeVisible();
  await page.waitForTimeout(1800);

  expect(runtimeMessages).toEqual([]);
});

test("multi-room floor renders every furnished room in 3D", async ({ page }) => {
  const runtimeMessages = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeMessages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeMessages.push(`page: ${error.message}`));

  await page.goto(`${server.url}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-runtime-ready="1"]');
  await page.locator(".w-btn").click();
  await page.locator('[data-action="open-create-room"]').first().click();
  await page.locator('[data-action="select-create-room-preset"]').first().click();
  await page.locator('[data-action="create-room-from-preset"]').click();
  await expect(page.locator("#scrEd")).toHaveClass(/on/);
  await ensureRoomPanelOpen(page);

  await page.locator('[data-action="attach-adjacent-room"][data-side="east"]').click();
  await expect
    .poll(() =>
      page.evaluate(
        () => currentFloorRooms(curRoom, curRoom.floorId || activeProjectFloorId).length,
      ),
    )
    .toBe(2);

  await page.evaluate(() => {
    const rooms = currentFloorRooms(curRoom, curRoom.floorId || activeProjectFloorId);
    const item = FURN_ITEMS.find((candidate) => candidate.assetKey === "chair") || FURN_ITEMS[0];
    rooms.forEach((room, index) => {
      const focus = getRoomFocus(room);
      room.furniture.push(
        normalizeFurnitureRecord({
          id: `multi-room-chair-${index + 1}`,
          label: `Multi Room Chair ${index + 1}`,
          category: item.category,
          x: focus.x,
          z: focus.y,
          w: item.w || 2,
          d: item.d || 2,
          rotation: 0,
          mountType: "floor",
          assetKey: item.assetKey,
          visible: true,
        }),
      );
    });
  });

  await page.locator("#b3d").click();
  await expect(page.locator("#threeC")).toHaveClass(/on/);
  await expect(page.locator("#threeC canvas")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => scene?.userData?.styleTargets?.floorMeshes?.length || 0), {
      intervals: [500, 1000, 2000],
      timeout: 20000,
    })
    .toBeGreaterThanOrEqual(2);

  const renderStats = await page.evaluate(() => {
    let furnitureAnchors = 0;
    scene?.traverse?.((node) => {
      if (node?.userData?.furnitureId) furnitureAnchors += 1;
    });
    const floorMeshTargets = scene?.userData?.styleTargets?.floorMeshes || [];
    return {
      currentFloorRoomCount: currentFloorRooms(curRoom, curRoom.floorId || activeProjectFloorId)
        .length,
      floorMeshCount: floorMeshTargets.length,
      floorRoomNames: floorMeshTargets.map((target) => target.room?.name || ""),
      furnitureAnchors,
    };
  });

  expect(renderStats.currentFloorRoomCount).toBe(2);
  expect(renderStats.floorMeshCount).toBeGreaterThanOrEqual(2);
  expect(renderStats.floorRoomNames.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  expect(renderStats.furnitureAnchors).toBeGreaterThanOrEqual(2);
  expect(runtimeMessages).toEqual([]);
});
