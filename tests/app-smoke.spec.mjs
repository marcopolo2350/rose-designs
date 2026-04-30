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

  expect(runtimeErrors).toEqual([]);
});
