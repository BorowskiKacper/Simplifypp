const textarea = document.getElementById('urls');
const status = document.getElementById('status');

function parseUrls(text) {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function updateStatus(urls) {
  status.textContent = `${urls.length} URL${urls.length !== 1 ? 's' : ''} loaded`;
}

async function load() {
  const data = await chrome.storage.local.get('queue');
  const urls = data.queue || [];
  textarea.value = urls.join('\n');
  updateStatus(urls);
}

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
