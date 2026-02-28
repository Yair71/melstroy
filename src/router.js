export function parseHash() {
  const h = (location.hash || "#/lobby").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean); // ["lobby"] or ["game","taprush"]
  return { parts, raw: h };
}

export function nav(toHash) {
  location.hash = toHash;
}