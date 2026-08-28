# Hybrid Game Studio สำหรับ MCPE

## เป้าหมาย

โปรเจกต์แบ่งเป็นสองส่วนที่เปิดแยกกัน แต่ใช้โฟลเดอร์งานเดียวกัน ได้แก่ **MCPE Game** สำหรับผู้เล่น และ **MCPE Studio** สำหรับผู้พัฒนา เกมจึงไม่เปิดสิทธิ์ให้ผู้เล่นแก้ไฟล์เอง ขณะที่ผู้พัฒนายังปรับระบบ เนื้อหา และรูปภาพได้จากเครื่องมือเดียว

## ขอบเขตการแก้ไข

| ชั้นงาน | ตัวอย่าง | วิธีเห็นผล |
|---|---|---|
| Engine source | C++, header, CMake, renderer, physics, input, network | แก้ source แล้ว build WebAssembly ใหม่ |
| Game content | กติกาโลก, item, block, entity, recipe, loot, quest | อ่านจาก `content/` ในรอบโหลดถัดไป หรือใช้ adapter เพิ่มตาม format |
| Visual assets | รูป terrain, block, item, UI, mob | วาง override ใน `content/images/` แล้ว build/embed ใหม่ |
| Live developer tools | ตรวจ JSON, preview รูป, สร้างไฟล์ตั้งต้น | ใช้หน้า `/studio/` และบันทึกลงโฟลเดอร์ที่ผู้พัฒนาเลือก |
| MMORPG content | season, quest, drops, shop, spawn, balance | server เป็นผู้ส่ง content ที่อนุญาตให้ผู้เล่นใช้ เกมตรวจ version/hash ก่อนเปิดใช้ |

## สัญญาโฟลเดอร์

```text
MCPE_Mirror/
├── content/
│   ├── game-content.json
│   ├── world-settings.json
│   └── images/                 # asset override จาก Studio
├── projects/addons/             # พื้นที่งาน addon แยกตามโปรเจกต์
├── studio/                      # HTML Studio ภาษาไทย
├── tools/addoncrate-studio/     # AddonCrate VS Code extension ต้นฉบับที่เก็บแยก
└── src/                         # engine source ที่ต้อง build ใหม่เมื่อแก้ระบบ
```

## การทำงานร่วมกัน

หน้า Studio ไม่แก้ memory ของเกมที่กำลังรันอยู่ แต่เขียนไฟล์ลงโฟลเดอร์ที่ผู้พัฒนาอนุญาตโดยตรง วิธีนี้ทำให้เกมและเครื่องมือเปิดแยกกัน ป้องกันการแก้ไฟล์โดยผู้เล่นปลายทาง และตรวจสอบประวัติการเปลี่ยนแปลงผ่าน Git ได้

ใน Web build เกมจะฝัง `data/` และ `content/` เข้า virtual filesystem ด้วย Emscripten ส่วน `AppPlatform_glfw` จะเลือก asset ใน `content/images/` ก่อน asset เดิม จึงมีจุดรองรับการทำ asset override โดยไม่ต้องแทนที่ไฟล์ต้นฉบับ

## แนวทางสำหรับ MMORPG

เมื่อเริ่มทำ multiplayer จริง ควรแยก **authoritative content** ออกจากไฟล์ที่ผู้เล่นแก้ได้ เซิร์ฟเวอร์จะประกาศ `content manifest` ที่มี version, hash และรายการความสามารถของ season จากนั้น client ดาวน์โหลดเฉพาะ content ที่อนุญาตและใช้กฎที่เซิร์ฟเวอร์ตรวจซ้ำ เช่น item stats, quest completion, loot และ economy ห้ามเชื่อค่าจากไฟล์ผู้เล่นสำหรับสิ่งที่มีผลต่อความยุติธรรม

การแก้ engine, renderer, physics และ network ยังคงต้องผ่าน source control และ build pipeline ส่วนการแก้ item, block, รูปภาพ และ quest ควรค่อย ๆ ย้ายไปอยู่ใน data-driven schema เพื่อให้เพิ่มเนื้อหาได้โดยไม่ต้อง rebuild engine ทุกครั้ง
