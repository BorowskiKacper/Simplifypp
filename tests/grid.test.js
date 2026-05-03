const { getGridPositions } = require('../lib/grid');

const WA = { left: 0, top: 0, width: 1920, height: 1080 };

describe('getGridPositions', () => {
  test('n=1: single full-size cell', () => {
    const [p] = getGridPositions(1, WA);
    expect(p).toEqual({ left: 0, top: 0, width: 1920, height: 1080 });
  });

  test('n=2: two side-by-side columns', () => {
    const ps = getGridPositions(2, WA);
    expect(ps).toHaveLength(2);
    // cols=2, rows=1, cellW=960, cellH=1080
    expect(ps[0]).toEqual({ left: 0,   top: 0, width: 960, height: 1080 });
    expect(ps[1]).toEqual({ left: 960, top: 0, width: 960, height: 1080 });
  });

  test('n=4: 2x2 grid', () => {
    const ps = getGridPositions(4, WA);
    expect(ps).toHaveLength(4);
    // cols=2, rows=2, cellW=960, cellH=540
    expect(ps[0]).toEqual({ left: 0,   top: 0,   width: 960, height: 540 });
    expect(ps[1]).toEqual({ left: 960, top: 0,   width: 960, height: 540 });
    expect(ps[2]).toEqual({ left: 0,   top: 540, width: 960, height: 540 });
    expect(ps[3]).toEqual({ left: 960, top: 540, width: 960, height: 540 });
  });

  test('n=6: 3x2 grid', () => {
    const ps = getGridPositions(6, WA);
    expect(ps).toHaveLength(6);
    // cols=3 (ceil(sqrt(6))=3), rows=2, cellW=640, cellH=540
    expect(ps[0]).toEqual({ left: 0,    top: 0,   width: 640, height: 540 });
    expect(ps[2]).toEqual({ left: 1280, top: 0,   width: 640, height: 540 });
    expect(ps[3]).toEqual({ left: 0,    top: 540, width: 640, height: 540 });
  });

  test('n=8: 3x3 grid (8 of 9 cells filled)', () => {
    const ps = getGridPositions(8, WA);
    expect(ps).toHaveLength(8);
    // cols=3 (ceil(sqrt(8))=3), rows=3, cellW=640, cellH=360
    expect(ps[0]).toEqual({ left: 0, top: 0, width: 640, height: 360 });
  });

  test('respects non-zero workArea offset', () => {
    const wa = { left: 50, top: 30, width: 1920, height: 1050 };
    const [p] = getGridPositions(1, wa);
    expect(p.left).toBe(50);
    expect(p.top).toBe(30);
  });

  test('returns correct count for odd n=3', () => {
    // cols=2 (ceil(sqrt(3))=2), rows=2, 3 positions returned
    const ps = getGridPositions(3, WA);
    expect(ps).toHaveLength(3);
  });
});
