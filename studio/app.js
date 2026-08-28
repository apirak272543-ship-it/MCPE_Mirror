const state = { root: null, files: new Map(), current: null };
const $ = (id) => document.getElementById(id);
const status = (message, kind = '') => { $('status').textContent = message; $('status').className = `status ${kind}`; };

async function chooseFolder() {
  if (!window.showDirectoryPicker) {
    status('เบราว์เซอร์นี้ยังไม่รองรับการบันทึกลงโฟลเดอร์โดยตรง ให้ใช้ Chrome/Edge รุ่นล่าสุด', 'error');
    return;
  }
  try {
    state.root = await window.showDirectoryPicker({ mode: 'readwrite' });
    $('folder-status').textContent = `โฟลเดอร์: ${state.root.name}`;
    await scanFiles();
    status('พร้อมทำงานแล้ว เปิดไฟล์ แก้ไข และกด “บันทึกการแก้ไข” ได้เลย', 'success');
  } catch (error) { if (error.name !== 'AbortError') status(`เปิดโฟลเดอร์ไม่ได้ ลองเลือกโฟลเดอร์ใหม่อีกครั้ง (${error.message})`, 'error'); }
}

async function scanFiles() {
  state.files.clear();
  const walk = async (dir, prefix = '') => {
    for await (const [name, handle] of dir.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (handle.kind === 'file' && (name.endsWith('.json') || name.endsWith('.mcmeta') || name.endsWith('.txt'))) state.files.set(path, handle);
      if (handle.kind === 'directory' && !name.startsWith('.') && name !== 'node_modules' && prefix.split('/').length < 3) await walk(handle, path);
    }
  };
  await walk(state.root);
  renderFileList();
}

function renderFileList() {
  const list = $('file-list'); list.innerHTML = '';
  if (!state.files.size) { list.innerHTML = '<p class="muted">ยังไม่พบไฟล์ที่ Studio รองรับในโฟลเดอร์นี้</p>'; return; }
  [...state.files.keys()].sort().forEach(path => {
    const button = document.createElement('button'); button.className = 'file-item'; button.textContent = path; button.onclick = () => openFile(path); list.appendChild(button);
  });
}

async function openFile(path) {
  const handle = state.files.get(path); if (!handle) return;
  const file = await handle.getFile(); $('editor').value = await file.text();
  state.current = path; $('welcome').hidden = true; $('editor').hidden = false; $('save-file').disabled = false;
  $('file-title').textContent = path.split('/').pop(); $('file-path').textContent = path;
  document.querySelectorAll('.file-item').forEach(item => item.classList.toggle('active', item.textContent === path)); status('เปิดไฟล์แล้ว แก้ไขข้อความได้ในช่องด้านขวา');
}

async function getOrCreateFile(path) {
  const parts = path.split('/'); let dir = state.root;
  for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create: true });
  const handle = await dir.getFileHandle(parts.at(-1), { create: true }); state.files.set(path, handle); return handle;
}

async function saveFile() {
  if (!state.root || !state.current) return;
  try {
    if (state.current.endsWith('.json')) JSON.parse($('editor').value);
    const handle = await getOrCreateFile(state.current); const writable = await handle.createWritable(); await writable.write($('editor').value); await writable.close();
    status('บันทึกการแก้ไขลงในเครื่องเรียบร้อยแล้ว', 'success'); await scanFiles();
  } catch (error) { status(error instanceof SyntaxError ? 'บันทึกไม่ได้ เพราะข้อมูลในไฟล์ JSON ยังไม่ครบหรือมีเครื่องหมายผิดตำแหน่ง' : `บันทึกไม่ได้ ลองใหม่อีกครั้ง (${error.message})`, 'error'); }
}

async function createStarterFiles() {
  if (!state.root) { status('เลือกโฟลเดอร์งานก่อน แล้วจึงสร้างไฟล์ตั้งต้นได้', 'error'); return; }
  const files = {
    'manifest.json': { format_version: 2, header: { name: 'โปรเจกต์ของฉัน', description: 'สร้างด้วย MCPE Studio', uuid: crypto.randomUUID(), version: [1, 0, 0], min_engine_version: [1, 16, 0] }, modules: [{ type: 'data', uuid: crypto.randomUUID(), version: [1, 0, 0] }] },
    'world.json': { name: 'โลกของฉัน', seed: 12345, difficulty: 'normal', game_mode: 'survival', cheats: false },
    'README.txt': 'ไฟล์ในโฟลเดอร์นี้สร้างและแก้ไขด้วย MCPE Studio\nเปิดเกมจากหน้า MCPE เพื่อทดสอบการเปลี่ยนแปลง\n'
  };
  for (const [path, value] of Object.entries(files)) { const handle = await getOrCreateFile(path); const writable = await handle.createWritable(); await writable.write(typeof value === 'string' ? value : JSON.stringify(value, null, 2)); await writable.close(); }
  await scanFiles(); await openFile('world.json'); status('เตรียมไฟล์ตั้งต้นให้แล้ว เปิดไฟล์เพื่อปรับแต่งต่อได้เลย', 'success');
}

$('choose-folder').onclick = chooseFolder; $('new-project').onclick = createStarterFiles; $('save-file').onclick = saveFile;
$('editor').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 's') { event.preventDefault(); saveFile(); } });
