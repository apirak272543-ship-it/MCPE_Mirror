const state = { worlds: [], items: [], selectedWorld: 'homeworld' };
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

async function loadContent() {
  try {
    const [worldsResponse, itemsResponse] = await Promise.all([fetch('../content/worlds.json'), fetch('../content/items.json')]);
    if (!worldsResponse.ok || !itemsResponse.ok) throw new Error('content unavailable');
    state.worlds = (await worldsResponse.json()).worlds || [];
    state.items = (await itemsResponse.json()).items || [];
  } catch (error) {
    state.worlds = [{ id:'homeworld', name:'ดินแดนต้นกำเนิด', type:'แฟนตาซี', status:'พร้อมเล่น', level:1, description:'บ้านหลักของผู้เล่น', access:'เริ่มต้น' }];
    state.items = [];
    toast('ใช้ข้อมูลเริ่มต้นชั่วคราว ยังโหลดรายการโลกจากเซิร์ฟเวอร์ไม่ได้');
  }
  renderWorlds(); renderItems();
}

function renderWorlds() {
  $('world-list').innerHTML = state.worlds.map((world) => `<button class="world-card ${world.status === 'ล็อกอยู่' ? 'locked' : ''} ${state.selectedWorld === world.id ? 'selected' : ''}" data-world="${esc(world.id)}"><span class="world-type">${esc(world.type)} · แนะนำเลเวล ${esc(world.level)}</span><h3>${esc(world.name)}</h3><p>${esc(world.description)}</p><span class="world-status">${esc(world.status)}</span></button>`).join('');
  document.querySelectorAll('[data-world]').forEach((button) => button.addEventListener('click', () => selectWorld(button.dataset.world)));
}

function renderItems() {
  const icons = ['✦','◇','◈','⬡','◌','⌘'];
  $('inventory-strip').innerHTML = state.items.slice(0, 6).map((item, index) => `<button class="item-card" data-item="${esc(item.id)}"><span class="item-icon">${icons[index % icons.length]}</span><span><strong>${esc(item.name)}</strong><span>${esc(item.category)} · x${esc(item.count)}</span></span></button>`).join('');
  document.querySelectorAll('[data-item]').forEach((button) => button.addEventListener('click', () => { const item = state.items.find((entry) => entry.id === button.dataset.item); if (item) toast(`${item.name}: ${item.access}`); }));
}

function selectWorld(id) {
  state.selectedWorld = id; renderWorlds();
  const world = state.worlds.find((entry) => entry.id === id); if (!world) return;
  toast(world.status === 'ล็อกอยู่' ? `${world.name} ยังเข้าไม่ได้ — ${world.access}` : `เลือก ${world.name} แล้ว`);
}

function enterWorld() {
  const world = state.worlds.find((entry) => entry.id === state.selectedWorld); if (!world) return;
  if (world.status === 'ล็อกอยู่') { toast(`ยังเข้า ${world.name} ไม่ได้: ${world.access}`); return; }
  window.location.href = `../?world=${encodeURIComponent(world.id)}`;
}

function toast(message) { const element = $('toast'); element.textContent = message; element.classList.add('toast-show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => element.classList.remove('toast-show'), 3200); }

document.querySelectorAll('[data-action="enter-world"]').forEach((button) => button.addEventListener('click', enterWorld));
document.querySelectorAll('[data-panel]').forEach((button) => button.addEventListener('click', () => { const panel = button.dataset.panel; const target = panel === 'home' ? 'world-panel' : panel === 'maps' ? 'world-panel' : panel === 'inventory' ? 'content-panel' : 'story-layer'; document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
loadContent();
