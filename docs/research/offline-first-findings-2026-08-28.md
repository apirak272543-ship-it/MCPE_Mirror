# ข้อค้นพบสำหรับระบบ Offline-first

MDN ระบุว่า Service Worker ทำหน้าที่คล้าย proxy ที่ควบคุมคำขอและตอบกลับจาก cache ได้ ทำให้เว็บใช้แนวทาง cache-first/offline-first ได้ และต้องให้หน้าเว็บอยู่บน HTTPS หรือ localhost จึงจะลงทะเบียน Service Worker ได้ [1]

Cache API เป็น storage แบบถาวรสำหรับคู่ Request/Response แต่การคงอยู่และ quota ขึ้นกับ browser ผู้ใช้, cache ไม่อัปเดตเองจนกว่าจะสั่งอัปเดต, และควรตั้งชื่อ cache แบบมี version เพื่อจัดการไฟล์เก่า [2]

ข้อสรุปสำหรับ MCPE_Mirror คือควรเพิ่ม Service Worker ใน root ของ GitHub Pages และ cache ไฟล์ HTML, JS, WASM, data, worker, content และ Studio ที่จำเป็น พร้อม version cache และกลยุทธ์อัปเดตเมื่อมี build ใหม่ การมี cache ไม่ควรถูกสื่อว่าเป็นการรับประกันถาวร เพราะ browser อาจลบข้อมูลเมื่อ quota หรือผู้ใช้ล้างข้อมูลเว็บ

## แหล่งอ้างอิง

[1] MDN, Using Service Workers — https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
[2] MDN, Cache — https://developer.mozilla.org/en-US/docs/Web/API/Cache
