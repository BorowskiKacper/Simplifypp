importScripts('lib/queue.js', 'lib/grid.js');

let queue = [];
let parallelism = 4;
let zoom = 0.67;
let windowType = 'normal';
let running = false;
const slots = {}; // slotIndex (0..N-1) -> { windowId, url }

let focusMode = false;
let focusModeType = 'sbs65';
let windowsHidden = false;
let applyingLayout = false;
let openingSlots = false;

async function loadState() {
  const data = await chrome.storage.local.get([
    'queue', 'parallelism', 'zoom', 'windowType',
    'focusMode', 'focusModeType', 'windowsHidden'
  ]);
  queue = data.queue || [];
  parallelism = data.parallelism || 4;
  zoom = data.zoom !== undefined ? data.zoom : 0.67;
  windowType = data.windowType || 'normal';
  focusMode = data.focusMode || false;
  focusModeType = data.focusModeType || 'sbs65';
  windowsHidden = data.windowsHidden || false;
}

async function persistState() {
  await chrome.storage.local.set({ queue, parallelism, zoom, windowType,
                                    focusMode, focusModeType, windowsHidden });
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

  openingSlots = true;
  try {
    for (let i = 0; i < batch.length; i++) await openSlot(i, batch[i]);
  } finally {
    openingSlots = false;
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
    .sendMessage({ type: 'stateUpdate', running, queueLength: queue.length, focusMode, windowsHidden })
    .catch(() => {});
}

async function restoreGridLayout() {
  const slotKeys = Object.keys(slots).map(Number).sort((a, b) => a - b);
  if (!slotKeys.length) return;
  const [display] = await chrome.system.display.getInfo();
  const positions = getGridPositions(slotKeys.length, display.workArea);
  await Promise.all(slotKeys.map((k, i) =>
    chrome.windows.update(slots[k].windowId, {
      state: 'normal',
      left: positions[i].left, top: positions[i].top,
      width: positions[i].width, height: positions[i].height,
    }).catch(() => {})
  ));
  windowsHidden = false;
}

async function hideAllWindows() {
  const ids = Object.values(slots).map(s => s.windowId);
  if (!ids.length) return;
  await Promise.all(ids.map(id =>
    chrome.windows.update(id, { state: 'minimized' }).catch(() => {})
  ));
  windowsHidden = true;
  await persistState();
}

async function showAllWindows() {
  await restoreGridLayout();
  windowsHidden = false;
  await persistState();
}

async function toggleHideAll() {
  await loadState();
  if (windowsHidden) await showAllWindows();
  else await hideAllWindows();
  broadcast();
}

async function bringAllToFront() {
  await loadState();
  applyingLayout = true;
  try {
    await restoreGridLayout();
    for (const { windowId } of Object.values(slots)) {
      await chrome.windows.update(windowId, { focused: true }).catch(() => {});
    }
  } finally {
    applyingLayout = false;
  }
  broadcast();
}

async function applyFocusLayout(focusedWindowId) {
  if (applyingLayout || openingSlots) return;
  applyingLayout = true;
  try {
    const slotKeys = Object.keys(slots).map(Number).sort((a, b) => a - b);
    if (!slotKeys.length) return;
    const focusedIdx = slotKeys.findIndex(k => slots[k].windowId === focusedWindowId);

    if (focusedIdx === -1) {
      if (focusModeType !== 'zen') await restoreGridLayout();
      return;
    }

    const [display] = await chrome.system.display.getInfo();
    const positions = getFocusLayoutPositions(focusedIdx, slotKeys.length, focusModeType, display.workArea);
    await Promise.all(slotKeys.map((k, i) => {
      const { windowId } = slots[k];
      const pos = positions[i];
      if (pos.maximize) return chrome.windows.update(windowId, { state: 'maximized' }).catch(() => {});
      if (pos.minimize) return chrome.windows.update(windowId, { state: 'minimized' }).catch(() => {});
      return chrome.windows.update(windowId, {
        state: 'normal', left: pos.left, top: pos.top, width: pos.width, height: pos.height,
      }).catch(() => {});
    }));
  } finally {
    applyingLayout = false;
  }
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
  openingSlots = true;
  try {
    await openSlot(parseInt(idx, 10), url);
  } finally {
    openingSlots = false;
  }
  broadcast();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'hide-all-windows') await toggleHideAll();
  else if (command === 'bring-to-front') await bringAllToFront();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!focusMode) return;
  if (applyingLayout || openingSlots) return;
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  await loadState();
  if (!focusMode) return;
  await applyFocusLayout(windowId);
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
        sendResponse({ running, queueLength: queue.length, parallelism, zoom, windowType,
                       focusMode, focusModeType, windowsHidden });
        return;
      case 'showAllWindows':
        applyingLayout = true;
        try { await restoreGridLayout(); } finally { applyingLayout = false; }
        broadcast();
        break;
      case 'setFocusMode':
        await loadState();
        focusMode = msg.enabled;
        await persistState();
        if (!focusMode) {
          applyingLayout = true;
          try { await restoreGridLayout(); } finally { applyingLayout = false; }
        }
        break;
      case 'setFocusModeType':
        await loadState();
        focusModeType = msg.value;
        await persistState();
        break;
    }
    sendResponse({ ok: true });
  })();
  return true; // keep message channel open for async response
});
