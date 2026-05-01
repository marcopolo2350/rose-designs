(function initRoseHtmlSafety() {
  function escape(value) {
    const node = document.createElement("div");
    node.textContent = value == null ? "" : String(value);
    return node.innerHTML;
  }

  function setText(element, value) {
    if (element) element.textContent = value == null ? "" : String(value);
  }

  function clear(element) {
    if (!element) return;
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  window.RoseHTML = {
    escape,
    setText,
    clear,
  };
})();
