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
}

function openDrawer(panel) {
  const drawer = $('drawer');
  const titles = { maps:['แผนที่ของเรา','เลือกโลกที่จะออกเดินทาง'], inventory:['คลังส่วนกลาง','ของที่เดินทางไปกับคุณ'], quests:['ภารกิจ','เรื่องราวที่กำลังรอคุณ'], profile:['ตัวละคร','ชุดและอุปกรณ์ของคุณ'], character:['ปรับแต่งตัวละคร','จัดการสิ่งที่สวมใส่'], settings:['การตั้งค่า','ปรับการเล่นให้เหมาะกับคุณ'], home:['หน้าหลัก',''] };
  const [eyebrow, title] = titles[panel] || titles.home;
  $('drawer-eyebrow').textContent = eyebrow; $('drawer-title').textContent = title; $('drawer-content').innerHTML = renderPanel(panel);
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false');
  if (panel === 'maps') document.querySelectorAll('[data-world]').forEach((button) => button.addEventListener('click', () => selectWorld(button.dataset.world)));
  if (panel === 'inventory') document.querySelectorAll('[data-item]').forEach((button) => button.addEventListener('click', () => { const item = state.items.find((entry) => entry.id === button.dataset.item); if (item) toast(`${item.name}: ${item.access}`); }));
}
function closeDrawer() { $('drawer').classList.remove('open'); $('drawer').setAttribute('aria-hidden','true'); }
function renderPanel(panel) {
  if (panel === 'maps') return `<div class="drawer-grid">${state.worlds.map((world) => `<button class="drawer-card ${world.status === 'ล็อกอยู่' ? 'locked' : ''}" data-world="${esc(world.id)}"><span>${esc(world.type)} · แนะนำเลเวล ${esc(world.level)}</span><h3>${esc(world.name)}</h3><p>${esc(world.description)}</p><span class="status">${esc(world.status)} · ${esc(world.access)}</span></button>`).join('')}</div>`;
  if (panel === 'inventory') return `<div class="drawer-items">${state.items.map((item, index) => `<button class="item-card" data-item="${esc(item.id)}"><span class="item-icon">${['✦','◇','◈','⬡','◌','⌘'][index % 6]}</span><span><strong>${esc(item.name)}</strong><span>${esc(item.category)} · x${esc(item.count)}</span></span></button>`).join('')}</div>`;
  if (panel === 'quests') return '<div class="story-copy"><strong>สัญญาณจากประตูนรกเถ้าดำ</strong><br>ผู้เฝ้าประตูกำลังเรียกหาผู้ถือเข็มทิศเอเธอร์ เดินทางไปยังแผนที่ประตูนรกเถ้าดำเพื่อค้นหาความจริงของสงครามครั้งเก่า</div>';
  if (panel === 'profile' || panel === 'character') return '<div class="story-copy"><strong>ผู้เดินทางระหว่างโลก</strong><br>ชุดและไอเทมของคุณอยู่ในคลังส่วนกลาง จึงนำไปใช้ในโลกอื่นได้เมื่อ access ของเนื้อเรื่องอนุญาต</div>';
  if (panel === 'settings') return '<div class="story-copy"><strong>การตั้งค่าเกม</strong><br>ปรับเสียง ภาพ การควบคุม และภาษาได้จากเมนูตั้งค่าของเกม</div>';
  return '';
}
function selectWorld(id) { state.selectedWorld = id; const world = state.worlds.find((entry) => entry.id === id); if (!world) return; toast(world.status === 'ล็อกอยู่' ? `${world.name} ยังเข้าไม่ได้ — ${world.access}` : `เลือก ${world.name} แล้ว`); }
function enterWorld() { const world = state.worlds.find((entry) => entry.id === state.selectedWorld); if (!world) return; if (world.status === 'ล็อกอยู่') { toast(`ยังเข้า ${world.name} ไม่ได้: ${world.access}`); return; } window.location.href = `../?world=${encodeURIComponent(world.id)}`; }
function toast(message) { const element = $('toast'); element.textContent = message; element.classList.add('toast-show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => element.classList.remove('toast-show'), 3200); }

document.querySelectorAll('[data-action="enter-world"]').forEach((button) => button.addEventListener('click', enterWorld));
document.querySelectorAll('[data-panel]').forEach((button) => button.addEventListener('click', () => { const panel = button.dataset.panel; if (panel === 'home') { closeDrawer(); return; } document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button)); openDrawer(panel); }));
document.querySelectorAll('[data-close-drawer]').forEach((button) => button.addEventListener('click', closeDrawer));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
loadContent();
