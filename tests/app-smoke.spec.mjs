import { expect, test } from "playwright/test";
import { startStaticServer } from "../scripts/devtools/static-server.mjs";

let server;

test.beforeAll(async () => {
  server = await startStaticServer(process.cwd());
});

test.afterAll(async () => {
  await server?.close();
});

test("canonical shell boots and delegated actions work", async ({ page }) => {
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
  await page.keyboard.press("?");
  await expect(page.locator("#shortcutSheet")).toHaveClass(/on/);
  await page.locator('[data-action="close-shortcut-sheet"]').click();
  await expect(page.locator("#shortcutSheet")).not.toHaveClass(/on/);

  await page.locator('[data-action="open-create-room"]').first().click();
  await expect(page.locator("#crMod")).toHaveClass(/on/);
  await page.locator('[data-action="create-room-from-preset"]').click();
  await expect(page.locator("#scrEd")).toHaveClass(/on/);

  await expect(page.locator('[data-action="room-panel-group"][data-group="build"]')).toBeVisible();
  await page.locator('[data-action="room-panel-group"][data-group="style"]').click();
  await expect(page.locator('[data-action="room-panel-group"][data-group="style"]')).toHaveClass(
    /sel/,
  );
  await page.locator('[data-action="room-panel-group"][data-group="build"]').click();
  await expect(page.locator('[data-action="room-panel-group"][data-group="build"]')).toHaveClass(
    /sel/,
  );
  await page.locator('[data-action="set-adj-room-width"]').fill("8");
  await page.locator('[data-action="set-adj-room-depth"]').click();
  await page.locator('[data-action="attach-adjacent-room"][data-side="east"]').click();
  await expect(page.locator("#propsP")).toContainText("Building 2 rooms");
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
