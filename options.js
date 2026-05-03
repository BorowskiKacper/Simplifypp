const textarea = document.getElementById('urls');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoomInput');
const zoomError = document.getElementById('zoomError');
const settingsStatus = document.getElementById('settingsStatus');

function parseUrls(text) {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function updateStatus(urls) {
  status.textContent = `${urls.length} URL${urls.length !== 1 ? 's' : ''} loaded`;
}

function updateFocusModeGroup(enabled) {
  const group = document.getElementById('focusModeTypeGroup');
  group.querySelectorAll('input').forEach(el => { el.disabled = !enabled; });
  group.style.opacity = enabled ? '1' : '0.45';
}

document.getElementById('focusModeEnabled').addEventListener('change', e => {
  updateFocusModeGroup(e.target.checked);
});

document.getElementById('saveFocusModeBtn').addEventListener('click', async () => {
  const enabled = document.getElementById('focusModeEnabled').checked;
  const type = document.querySelector('input[name="focusModeType"]:checked').value;
  await chrome.storage.local.set({ focusMode: enabled, focusModeType: type });
  await chrome.runtime.sendMessage({ type: 'setFocusMode', enabled }).catch(() => {});
  await chrome.runtime.sendMessage({ type: 'setFocusModeType', value: type }).catch(() => {});
  const st = document.getElementById('focusModeStatus');
  st.textContent = 'Saved!';
  st.style.color = '#4fc3f7';
  setTimeout(() => { st.textContent = ''; }, 1500);
});

async function load() {
  const data = await chrome.storage.local.get(['queue', 'zoom', 'windowType', 'focusMode', 'focusModeType']);
  const urls = data.queue || [];
  textarea.value = urls.join('\n');
  updateStatus(urls);

  const zoomPct = Math.round(((data.zoom !== undefined ? data.zoom : 0.67)) * 100);
  zoomInput.value = zoomPct;
  const wt = data.windowType || 'normal';
  document.querySelector(`input[name="windowType"][value="${wt}"]`).checked = true;

  const fm = data.focusMode || false;
  document.getElementById('focusModeEnabled').checked = fm;
  const fmt = data.focusModeType || 'sbs65';
  const radio = document.querySelector(`input[name="focusModeType"][value="${fmt}"]`);
  if (radio) radio.checked = true;
  updateFocusModeGroup(fm);
}

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const pct = parseInt(zoomInput.value, 10);
  if (isNaN(pct) || pct < 10 || pct > 100) {
    zoomError.textContent = 'Zoom must be between 10 and 100.';
    return;
  }
  zoomError.textContent = '';
  const windowType = document.querySelector('input[name="windowType"]:checked').value;
  await chrome.storage.local.set({ zoom: pct / 100, windowType });
  settingsStatus.textContent = 'Saved!';
  settingsStatus.style.color = '#4fc3f7';
  setTimeout(() => { settingsStatus.textContent = ''; }, 1500);
});

zoomInput.addEventListener('input', () => { zoomError.textContent = ''; });

document.getElementById('saveBtn').addEventListener('click', async () => {
  const urls = parseUrls(textarea.value);
  await chrome.storage.local.set({ queue: urls });
  updateStatus(urls);
  status.style.color = '#4fc3f7';
  setTimeout(() => { status.style.color = ''; }, 1500);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  textarea.value = '';
  updateStatus([]);
});

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    textarea.value = ev.target.result;
    updateStatus(parseUrls(ev.target.result));
  };
  reader.readAsText(file);
  e.target.value = '';
});

textarea.addEventListener('input', () => {
  updateStatus(parseUrls(textarea.value));
});

load();
