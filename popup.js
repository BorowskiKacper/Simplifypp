let parallelism = 4;
let running = false;

async function refresh() {
  const resp = await chrome.runtime.sendMessage({ type: 'getState' }).catch(() => null);
  if (!resp) return;
  parallelism = resp.parallelism;
  running = resp.running;
  document.getElementById('parallelism').textContent = parallelism;
  document.getElementById('queueCount').textContent = resp.queueLength;
  updateButtons();
}

function updateButtons() {
  document.getElementById('startBtn').disabled = running;
  document.getElementById('pauseBtn').disabled = !running;
  document.getElementById('stopBtn').disabled = !running;
}

document.getElementById('editQueue').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

document.getElementById('dec').addEventListener('click', async () => {
  if (parallelism <= 1) return;
  parallelism--;
  document.getElementById('parallelism').textContent = parallelism;
  await chrome.runtime.sendMessage({ type: 'setParallelism', value: parallelism });
});

document.getElementById('inc').addEventListener('click', async () => {
  if (parallelism >= 8) return;
  parallelism++;
  document.getElementById('parallelism').textContent = parallelism;
  await chrome.runtime.sendMessage({ type: 'setParallelism', value: parallelism });
});

document.getElementById('startBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'start' });
  running = true;
  updateButtons();
});

document.getElementById('pauseBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'pause' });
  running = false;
  updateButtons();
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'stop' });
  running = false;
  updateButtons();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'stateUpdate') {
    running = msg.running;
    document.getElementById('queueCount').textContent = msg.queueLength;
    updateButtons();
  }
});

refresh();
