const { dequeue, isEmpty } = require('../lib/queue');

describe('dequeue', () => {
  test('returns first n items and mutates the array', () => {
    const q = ['a', 'b', 'c', 'd'];
    expect(dequeue(q, 2)).toEqual(['a', 'b']);
    expect(q).toEqual(['c', 'd']);
  });

  test('returns all items when n exceeds length', () => {
    const q = ['a', 'b'];
    expect(dequeue(q, 10)).toEqual(['a', 'b']);
    expect(q).toEqual([]);
  });

  test('returns empty array from empty queue', () => {
    expect(dequeue([], 3)).toEqual([]);
  });

  test('returns single item when n=1', () => {
    const q = ['x', 'y'];
    expect(dequeue(q, 1)).toEqual(['x']);
    expect(q).toEqual(['y']);
  });
});

describe('isEmpty', () => {
  test('returns true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  test('returns false for non-empty array', () => {
    expect(isEmpty(['a'])).toBe(false);
  });
});
