(function initAppConfig() {
  const APP_CONFIG = Object.freeze({
    appName: "Rose's Indoor Designs",
    repoSlug: "roses-indoor-designs",
    version: "0.5.0-hardening.100",
    publicUrl: "https://marcopolo2350.github.io/roses-indoor-designs/",
    storagePrefix: "rose_indoor_designs",
    database: Object.freeze({
      name: "rose_indoor_designs",
      store: "projects",
      version: 2,
    }),
    branding: Object.freeze({
      personal: true,
      welcomeName: "Rose",
      welcomeLine: "Ready when you are",
      studioLabel: "Studio",
      appTitle: "Rose's Indoor Designs",
    }),
    cloud: Object.freeze({
      experimental: true,
      provider: "Supabase",
    }),
    support: Object.freeze({
      selfTestHash: "#selftest",
      devHash: "#dev",
      localDevUrl: "http://127.0.0.1:8123/",
    }),
  });

  window.APP_CONFIG = APP_CONFIG;
  window.APP_VERSION = APP_CONFIG.version;
})();
