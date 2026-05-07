(function initPlanner3DLifecycle() {
  const TEXTURE_KEYS = [
    "map",
    "alphaMap",
    "aoMap",
    "bumpMap",
    "displacementMap",
    "emissiveMap",
    "envMap",
    "lightMap",
    "metalnessMap",
    "normalMap",
    "roughnessMap",
  ];

  function disposeMaterial(material) {
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((entry) => {
      if (!entry) return;
      TEXTURE_KEYS.forEach((key) => {
        const texture = entry[key];
        if (texture && typeof texture.dispose === "function") texture.dispose();
      });
      if (typeof entry.dispose === "function") entry.dispose();
    });
  }

  function disposeSceneGraph(root) {
    if (!root || typeof root.traverse !== "function") return;
    root.traverse((object) => {
      if (object.geometry && typeof object.geometry.dispose === "function")
        object.geometry.dispose();
      if (object.material) disposeMaterial(object.material);
    });
  }

  function removeRendererListeners(renderer) {
    const listeners = renderer?._listeners;
    if (!listeners?.el) return;
    listeners.el.removeEventListener("pointerdown", listeners.pDown);
    listeners.el.removeEventListener("pointerup", listeners.pUp);
    listeners.el.removeEventListener("pointermove", listeners.pMove);
    listeners.el.removeEventListener("pointercancel", listeners.pCancel);
    listeners.el.removeEventListener("lostpointercapture", listeners.pCancel);
    if (listeners.pDbl) listeners.el.removeEventListener("dblclick", listeners.pDbl);
    renderer._listeners = null;
  }

  function disposeRenderer(renderer) {
    if (!renderer) return;
    removeRendererListeners(renderer);
    if (typeof renderer.dispose === "function") renderer.dispose();
    if (typeof renderer.forceContextLoss === "function") renderer.forceContextLoss();
    const domElement = renderer.domElement;
    if (domElement?.parentNode) domElement.parentNode.removeChild(domElement);
  }

  function disposeComposer(composer, onError) {
    if (!composer) return;
    try {
      composer.passes?.forEach((pass) => {
        if (typeof pass.dispose === "function") pass.dispose();
      });
    } catch (error) {
      if (typeof onError === "function") onError(error);
    }
  }

  function configureRendererDiagnostics(renderer, { devMode = false } = {}) {
    if (!renderer?.debug) return;
    renderer.debug.checkShaderErrors = Boolean(devMode);
  }

  window.Planner3DLifecycle = Object.freeze({
    configureRendererDiagnostics,
    disposeComposer,
    disposeMaterial,
    disposeRenderer,
    disposeSceneGraph,
    removeRendererListeners,
  });
})();
