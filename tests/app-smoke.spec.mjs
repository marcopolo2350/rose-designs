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

test("canonical shell boots and delegated actions work", async ({ page }, testInfo) => {
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));

  await page.goto(`${server.url}/index.html`, { waitUntil: "domcontentloaded" });
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

  await page.locator('[data-action="open-create-room"]').first().click();
  await expect(page.locator("#crMod")).toHaveClass(/on/);
  await page.locator('[data-action="create-room-from-preset"]').click();
  await expect(page.locator("#scrEd")).toHaveClass(/on/);

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
  const buildPanelInlineHandlers = await page
    .locator("#propsP [onclick], #propsP [oninput], #propsP [onchange]")
    .count();
  expect(buildPanelInlineHandlers).toBe(0);
  await page.locator('[data-action="toggle-room-layer"]').first().click();
  await page.locator('[data-action="toggle-room-layer"]').first().click();
  await page.locator('[data-action="room-panel-group"][data-group="furnish"]').click();
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
  await page.locator('[data-action="prop-close"]').click();
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

  expect(runtimeErrors).toEqual([]);
});
