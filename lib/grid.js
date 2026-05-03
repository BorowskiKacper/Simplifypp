function getGridPositions(n, workArea) {
  const { left = 0, top = 0, width, height } = workArea;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const positions = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      left: left + col * cellW,
      top: top + row * cellH,
      width: cellW,
      height: cellH,
    });
  }
  return positions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getGridPositions };
}
