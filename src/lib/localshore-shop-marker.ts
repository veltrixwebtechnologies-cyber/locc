/** Branded Google Maps marker artwork shared by the picker and shop map. */
export function localShoreShopMarker(name: string, selected = false, demo = false) {
  const label = name.length > 23 ? `${name.slice(0, 22).trimEnd()}…` : name;
  const safeLabel = label.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character] ?? character);
  const width = Math.max(142, Math.min(205, Math.round(label.length * 6.5 + 62)));
  const height = 58;
  const center = Math.round(width / 2);
  const border = selected ? "#981495" : demo ? "#DBC7E5" : "#E9D7EE";
  const accent = selected ? "#7D1079" : demo ? "#AD4CB0" : "#981495";
  const text = selected ? "#471150" : "#291B34";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><filter id="shadow" x="-25%" y="-35%" width="150%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#311539" flood-opacity=".22"/></filter></defs>
    <g filter="url(#shadow)">
      <rect x="4" y="3" width="${width - 8}" height="43" rx="18" fill="#FFFFFF" stroke="${border}" stroke-width="${selected ? 2.5 : 1.5}"/>
      <path d="M${center - 9} 44 L${center} 55 L${center + 9} 44" fill="#FFFFFF" stroke="${border}" stroke-width="${selected ? 2.5 : 1.5}" stroke-linejoin="round"/>
      <path d="M${center - 8} 44 H${center + 8}" stroke="#FFFFFF" stroke-width="3"/>
    </g>
    <circle cx="25" cy="24" r="14" fill="${accent}"/>
    <path d="M18 22h14l-1.8 2.5v7h-10.4v-7L18 22Zm2.2-1 1.5-3h6.6l1.5 3M23 27h4v4h-4Z" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>
    <text x="47" y="23" fill="${text}" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">${safeLabel}</text>
    <text x="47" y="37" fill="${demo ? "#9A5A9A" : "#981495"}" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" letter-spacing=".5">${demo ? "DEMO CATALOG · APPROX AREA" : "LOCALSHORE SHOP"}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    width,
    height,
    anchorX: center,
    anchorY: 55,
  };
}
