/* global safeThreeColor, variantDisplayColor */
const FURN_GROUP_TINTS = {
  Seating: "#9B7D8E",
  Beds: "#7A8FA8",
  Tables: "#B08040",
  Storage: "#6E8A66",
  Lighting: "#C9A040",
  Decor: "#5A8A78",
  Rugs: "#B85A45",
  "Wall Decor": "#8E78A8",
  Openings: "#5A8FAA",
};
function threeColorToRgba(color, alpha = 1) {
  return `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${alpha})`;
}
function furniture2DTint(f, item) {
  const variantColor =
    typeof variantDisplayColor === "function" ? variantDisplayColor(f, item) : "";
  if (variantColor) return variantColor;
  return FURN_GROUP_TINTS[item?.group] || "#8A7868";
}
function furniture2DStroke(f, item) {
  const tint = safeThreeColor(furniture2DTint(f, item), "#7B6B5E");
  const hsl = { h: 0, s: 0, l: 0 };
  tint.getHSL(hsl);
  if (hsl.l > 0.6) return "rgba(68,52,40,.82)";
  return threeColorToRgba(tint.clone().offsetHSL(0, 0.04, -0.22), 0.96);
}
function furniture2DLabelInk(f, item) {
  const tint = safeThreeColor(furniture2DTint(f, item), "#7B6B5E");
  const hsl = { h: 0, s: 0, l: 0 };
  tint.getHSL(hsl);
  return hsl.l > 0.55 ? "rgba(58,44,34,.88)" : "rgba(248,244,236,.92)";
}
window.Planner2DFurnitureStyle = Object.freeze({
  FURN_GROUP_TINTS,
  furniture2DLabelInk,
  furniture2DStroke,
  furniture2DTint,
  threeColorToRgba,
});
