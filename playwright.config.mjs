export default {
  testDir: "./tests",
  timeout: 120000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "output/playwright",
};
