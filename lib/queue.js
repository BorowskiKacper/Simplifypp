function dequeue(arr, n) {
  return arr.splice(0, n);
}

function isEmpty(arr) {
  return arr.length === 0;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dequeue, isEmpty };
}
