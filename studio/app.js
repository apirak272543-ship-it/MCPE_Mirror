const state = { root: null, files: new Map(), current: null, previewUrl: null };
const $ = (id) => document.getElementById(id);
const TEXT_EXTENSIONS = new Set(['.json', '.mcmeta', '.txt', '.md', '.cpp', '.c', '.h', '.hpp', '.cmake', '.js', '.ts', '.html', '.css', '.yml', '.yaml']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const extensionOf = (path) => { const name = path.toLowerCase(); const dot = name.lastIndexOf('.'); return dot >= 0 ? name.slice(dot) : ''; };
const isSupported = (path) => TEXT_EXTENSIONS.has(extensionOf(path)) || IMAGE_EXTENSIONS.has(extensionOf(path));
const status = (message, kind = '') => { $('status').textContent = message; $('status').className = `status ${kind}`; };

async function chooseFolder() {
  if (!window.showDirectoryPicker) { status('เบราว์เซอร์นี้ยังไม่รองรับการเขียนไฟล์ลงโฟลเดอร์ ให้ใช้ Chrome หรือ Edge รุ่นใหม่', 'error'); return; }
  try {
    state.root = await window.showDirectoryPicker({ mode: 'readwrite' });
    $('folder-status').textContent = `โฟลเดอร์หลัก: ${state.root.name}`;
    await scanFiles();
    status('พร้อมทำงานแล้ว เปิดไฟล์ แก้ไข และกด “บันทึกการแก้ไข” ได้เลย', 'success');
  } catch (error) { if (error.name !== 'AbortError') status(`เปิดโฟลเดอร์ไม่ได้ ลองเลือกโฟลเดอร์ใหม่อีกครั้ง (${error.message})`, 'error'); }
}

async function scanFiles() {
  state.files.clear();
  const walk = async (dir, prefix = '') => {
    for await (const [name, handle] of dir.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (handle.kind === 'file' && isSupported(path)) state.files.set(path, handle);
      if (handle.kind === 'directory' && !name.startsWith('.') && name !== 'node_modules' && name !== 'build' && prefix.split('/').length < 4) await walk(handle, path);
    }
  };
  await walk(state.root); renderFileList();
}

function renderFileList() {
  const list = $('file-list'); list.innerHTML = '';
  if (!state.files.size) { list.innerHTML = '<p class="muted">ยังไม่พบไฟล์ source, config หรือ asset ที่ Studio รองรับ</p>'; return; }
  [...state.files.keys()].sort().forEach(path => {
    const button = document.createElement('button'); button.className = 'file-item'; button.textContent = path; button.onclick = () => openFile(path); list.appendChild(button);
  });
}

async function openFile(path) {
  const handle = state.files.get(path); if (!handle) return;
  const file = await handle.getFile(); state.current = path;
  $('welcome').hidden = true; $('file-title').textContent = path.split('/').pop(); $('file-path').textContent = path;
  document.querySelectorAll('.file-item').forEach(item => item.classList.toggle('active', item.textContent === path));
  if (IMAGE_EXTENSIONS.has(extensionOf(path))) {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = URL.createObjectURL(file); $('image-preview').src = state.previewUrl; $('image-preview').hidden = false; $('editor').hidden = true; $('save-file').disabled = true; status('เปิดดูรูปแล้ว หากต้องการเปลี่ยนรูปให้ใช้ปุ่ม “นำรูปเข้าเกม”');
  } else {
    $('image-preview').hidden = true; $('editor').hidden = false; $('save-file').disabled = false; $('editor').value = await file.text(); status('เปิดไฟล์แล้ว แก้ไขข้อความได้ในช่องด้านขวา');
  }
}

async function getOrCreateFile(path) {
  const parts = path.split('/'); let dir = state.root;
  for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create: true });
  const handle = await dir.getFileHandle(parts.at(-1), { create: true }); state.files.set(path, handle); return handle;
}

async function saveFile() {
  if (!state.root || !state.current || IMAGE_EXTENSIONS.has(extensionOf(state.current))) return;
  try {
    if (extensionOf(state.current) === '.json') JSON.parse($('editor').value);
    const handle = await getOrCreateFile(state.current); const writable = await handle.createWritable(); await writable.write($('editor').value); await writable.close();
    status('บันทึกการแก้ไขลงในเครื่องเรียบร้อยแล้ว', 'success'); await scanFiles();
  } catch (error) { status(error instanceof SyntaxError ? 'บันทึกไม่ได้ เพราะข้อมูล JSON มีรูปแบบผิด กรุณาตรวจวงเล็บและเครื่องหมายคำพูด' : `บันทึกไม่ได้ ลองใหม่อีกครั้ง (${error.message})`, 'error'); }
}

async function importImage(file) {
  if (!state.root || !file) return;
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const path = `content/images/${safeName}`;
    const handle = await getOrCreateFile(path); const writable = await handle.createWritable(); await writable.write(file); await writable.close();
    await scanFiles(); await openFile(path); status(`นำรูป ${safeName} เข้าโฟลเดอร์ content/images แล้ว`, 'success');
  } catch (error) { status(`นำรูปเข้าเกมไม่ได้ ลองใหม่อีกครั้ง (${error.message})`, 'error'); }
}

async function createStarterFiles() {
  if (!state.root) { status('เลือกโฟลเดอร์หลักของเกมก่อน แล้วจึงสร้างไฟล์ตั้งต้นได้', 'error'); return; }
  const files = {
    'content/game-content.json': { version: 1, mode: 'development', description: 'รายการเนื้อหาที่ Studio เตรียมไว้ให้เกม', blocks: [], items: [], entities: [], rules: {} },
    'content/world-settings.json': { name: 'โลกของฉัน', seed: 12345, difficulty: 'normal', game_mode: 'survival', cheats: false },
    'content/README.txt': 'ไฟล์ใน content คือพื้นที่สำหรับเนื้อหาและ asset ที่ทำเพิ่ม\nแก้ source ของเกมแล้วต้อง build WebAssembly ใหม่จึงจะเห็นผล\n'
  };
  for (const [path, value] of Object.entries(files)) { const handle = await getOrCreateFile(path); const writable = await handle.createWritable(); await writable.write(JSON.stringify(value, null, 2)); await writable.close(); }
  await scanFiles(); await openFile('content/game-content.json'); status('เตรียมไฟล์ตั้งต้นให้แล้ว เปิดไฟล์เพื่อปรับแต่งต่อได้เลย', 'success');
}

$('choose-folder').onclick = chooseFolder;
$('new-project').onclick = createStarterFiles;
$('save-file').onclick = saveFile;
$('import-image').onclick = () => { if (!state.root) { status('เลือกโฟลเดอร์หลักของเกมก่อน แล้วจึงนำรูปเข้าเกมได้', 'error'); return; } $('image-input').click(); };
$('image-input').onchange = (event) => { importImage(event.target.files[0]); event.target.value = ''; };
$('editor').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 's') { event.preventDefault(); saveFile(); } });
