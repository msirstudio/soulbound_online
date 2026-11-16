# SOULBOUND Online v0.63 — Multiplayer Fixes

ฐานที่ผู้ใช้เลือก: `v0.62-foundation-single-source` (`4ad15a7`)

Branch สำหรับเลือกใน Render: **`v0.63-multiplayer-fixes`**

## สิ่งที่รวมในรุ่นนี้

- รวมแพตช์ Socket/session จาก PR #39 และ party leadership/readiness จาก PR #40 ไว้ใน branch เดียว
- ป้องกัน payload ผิดรูปแบบ, socket เข้าหลายห้อง และ restore/reconnect ซ้อนกัน
- แก้ reconnect ticket ของผู้เข้าร่วมและการนับหมดอายุหลังเล่นนานเกินสองนาที
- หัวหน้าปาร์ตี้คงสิทธิ์แม้สมาชิกอื่นเร็วกว่า; reconnect รักษาสิทธิ์ และเมื่อหมด grace จะโอนตามลำดับเข้าร่วม
- ใช้ readiness guard เดียวกันก่อน start/travel/next stage โดยรักษา speed turn order และ combat balance
- รักษา catalog กลาง, Archer และ assets จาก foundation เดิม
- เปลี่ยน package/API/ข้อความในเกมเป็น `0.63` พร้อมบันทึกอัปเดตและ cache keys ของ client รุ่นใหม่

## GitHub, Supabase และ Render

**GitHub:** โค้ดรุ่นนี้อยู่บน branch ใหม่ มี PR รวมให้ตรวจเทียบกับ foundation เดิม ไม่จำเป็นต้องรวม PR ย่อยทีละตัวเพื่อให้ Render ดึง branch นี้ได้ ยังไม่มีการ merge อัตโนมัติ

**Supabase:** ไม่ต้องอัปโหลดหรือรัน SQL ไม่มีการเปลี่ยน persistence implementation, schema, save format, slot IDs, storage keys, inventory UIDs หรือ config และไม่มีการอ่าน/เขียนข้อมูลผู้เล่นจริง

**Render:** เมื่อตรวจรุ่นนี้แล้ว ให้เปิดบริการ SOULBOUND → Settings → Build & Deploy → Branch เลือก `v0.63-multiplayer-fixes` แล้วบันทึก หากการบันทึกยังไม่เริ่ม deploy ให้ใช้ Manual Deploy → Deploy latest commit เก็บ environment variables เดิมทั้งหมด ไม่ต้องสร้าง database ใหม่หรือเปลี่ยน secret

หลัง Render แสดง Live ให้เปิดเกมและรีเฟรช หน้าเกมกับ `/health` ควรแสดง `0.63` ส่วน `/health` จะรายงาน secure-save mode ตาม env เดิม งานนี้ไม่ได้เปลี่ยนโหมดนั้น

การจัดเตรียมรุ่นนี้ไม่ได้เข้าถึง Render dashboard หรือสั่ง production deploy การเลือก branch/deploy ใน Render เป็นขั้นตอนแยกโดยผู้ใช้ ไม่จำเป็นต้องตั้ง staging เพิ่มเพื่อเลือกใช้วิธีนี้

## การทดสอบและไฟล์

- `npm test` ผ่านทั้ง 50 test files รวม regressions ของทั้งสองแพตช์
- ปรับ current-version assertions ใน 20 test files ให้ตรวจรุ่น 0.63 โดยเก็บ historical releases, component versions และ asset version IDs เดิม
- `audit:foundation`, `audit:elemental`, syntax checks และ `git diff --check` ผ่าน
- ทดสอบ local HTTP/Socket.IO จริงด้วย Supabase env ที่ถอดออกและ outbound fetch ที่ปิดไว้; ตรวจ version/API/static content, authority/turn order, reconnect และ nextStage หลังชนะจริง
- รัน version-sync script ใน VM เพื่อตรวจ brand/header/footer จาก `/health`; ไม่มีการเชื่อม Supabase หรือ deploy เพื่อทดสอบ
- ไฟล์ runtime ของการจัดรุ่น: `package.json`, `server.js` (startup version log), `public/index.html`, `public/version-v0564.js`, `public/update-log-v045.js`; ปรับ audit/CI ให้ตรวจรุ่นใหม่ด้วย

ดูรายละเอียดแพตช์และไฟล์ทั้งหมดใน [repository audit](docs/repository-audit-2026-11-15.md) และ [party leadership report](docs/party-leadership-readiness-2026-11-16.md)

## ความเสี่ยงคงเหลือ

Save queue snapshot/recovery, i18n observer, RPC timeout และ process-restart/multi-instance support ยังเป็น backlog ตามรายงานเดิม ไม่ใช่สิ่งที่รุ่นนี้อ้างว่าแก้แล้ว Audit scripts เก่าสี่ตัวมี stale version/catalog assertions ที่เคย fail บนฐานเดิม; ใช้ full regression suite และ audits ที่ระบุข้างต้นเป็นหลักฐานของรุ่นนี้

การ deploy/restart ยังคงทำให้ active rooms ในหน่วยความจำหายตามโครงสร้างเดิม และยังไม่ได้ทดสอบ live Supabase RLS/config หรือ browser visual/audio/mobile กับ production
