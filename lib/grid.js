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

function getFocusLayoutPositions(focusedIdx, n, mode, workArea) {
  const { left: wl, top: wt, width: W, height: H } = workArea;

  if (mode === 'zen') {
    return Array.from({ length: n }, (_, i) =>
      i === focusedIdx ? { maximize: true } : { minimize: true }
    );
  }

  const mainRatio = mode === 'sbs80' ? 0.80 : 0.65;
  const stripW = mode === 'peek' ? 100 : Math.round(W * (1 - mainRatio));
  const mainW = W - stripW;
  const othersCount = n - 1;
  const stripH = othersCount > 0 ? Math.floor(H / othersCount) : H;

  const positions = [];
  let strip = 0;
  for (let i = 0; i < n; i++) {
    if (i === focusedIdx) {
      positions.push({ left: wl, top: wt, width: mainW, height: H });
    } else {
      positions.push({ left: wl + mainW, top: wt + strip * stripH, width: stripW, height: stripH });
      strip++;
    }
  }
  return positions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getGridPositions, getFocusLayoutPositions };
}
