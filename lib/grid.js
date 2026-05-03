function getGridPositions(n, workArea) {
  const { left = 0, top = 0, width, height } = workArea;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const positions = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x1 = left + Math.round((col * width) / cols);
    const x2 = left + Math.round(((col + 1) * width) / cols);
    const y1 = top + Math.round((row * height) / rows);
    const y2 = top + Math.round(((row + 1) * height) / rows);
    positions.push({ left: x1, top: y1, width: x2 - x1, height: y2 - y1 });
  }
  return positions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getGridPositions };
}
