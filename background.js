importScripts('lib/queue.js', 'lib/grid.js');

let queue = [];
let parallelism = 4;
let zoom = 0.67;
let windowType = 'normal';
let running = false;
const slots = {}; // slotIndex (0..N-1) -> { windowId, url }

async function loadState() {
  const data = await chrome.storage.local.get(['queue', 'parallelism', 'zoom', 'windowType']);
  queue = data.queue || [];
  parallelism = data.parallelism || 4;
  zoom = data.zoom !== undefined ? data.zoom : 0.67;
  windowType = data.windowType || 'normal';
}

async function persistState() {
  await chrome.storage.local.set({ queue, parallelism, zoom, windowType });
}

async function openSlot(slotIndex, url) {
  const [display] = await chrome.system.display.getInfo();
  const positions = getGridPositions(parallelism, display.workArea);
  const pos = positions[slotIndex];
  const win = await chrome.windows.create({
    url,
    left: pos.left,
    top: pos.top,
    width: pos.width,
    height: pos.height,
    type: windowType,
  });
  slots[slotIndex] = { windowId: win.id, url };
  if (zoom !== 1) {
    const tabId = win.tabs && win.tabs[0] && win.tabs[0].id;
    if (tabId) chrome.tabs.setZoom(tabId, zoom).catch(() => {});
  }
}

async function start() {
  await loadState();
  if (running || isEmpty(queue)) return;
  running = true;

  const n = Math.min(parallelism, queue.length);
  const batch = dequeue(queue, n);
  await persistState();

  for (let i = 0; i < batch.length; i++) {
    await openSlot(i, batch[i]);
  }
  broadcast();
}

async function pause() {
  running = false;
  broadcast();
}

async function stop() {
  running = false;
  for (const { windowId } of Object.values(slots)) {
    try { await chrome.windows.remove(windowId); } catch (_) {}
  }
  for (const k of Object.keys(slots)) delete slots[k];
  broadcast();
}

function broadcast() {
  chrome.runtime
    .sendMessage({ type: 'stateUpdate', running, queueLength: queue.length })
    .catch(() => {});
}

chrome.windows.onRemoved.addListener(async (closedId) => {
  const idx = Object.keys(slots).find(k => slots[k].windowId === closedId);
  if (idx === undefined) return;
  delete slots[idx];

  if (!running || isEmpty(queue)) {
    if (Object.keys(slots).length === 0 && running) {
      running = false;
      chrome.action.setBadgeText({ text: '✓' });
      broadcast();
    }
    return;
  }

  const [url] = dequeue(queue, 1);
  await persistState();
  await openSlot(parseInt(idx, 10), url);
  broadcast();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'start':
        await start();
        break;
      case 'pause':
        await pause();
        break;
      case 'stop':
        await stop();
        break;
      case 'setParallelism':
        await loadState();
        parallelism = Math.max(1, Math.min(8, msg.value));
        await persistState();
        break;
      case 'getState':
        await loadState();
        sendResponse({ running, queueLength: queue.length, parallelism, zoom, windowType });
        return;
    }
    sendResponse({ ok: true });
  })();
  return true; // keep message channel open for async response
});
