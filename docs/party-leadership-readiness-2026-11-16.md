# Party leadership และ encounter readiness

ฐาน: PR #39 (`audit/session-boundary-hardening`, commit `3d94911d50b1aaa816a8a9059819e93d8d20600d`)

งานนี้อยู่บน branch `fix/party-leadership-readiness` แยกจาก PR #39 ที่ยังไม่ merge เป็น PR ต่อกันเพื่อให้ review เฉพาะความเปลี่ยนแปลงชุดนี้ ไม่ส่งเข้า main หรือ production อัตโนมัติ

## ปัญหาและพฤติกรรมหลังแก้

เดิม `start()` เรียง players Map ตาม speed แต่ permission checks ใช้สมาชิกคนแรกของ Map เป็นหัวหน้า ทำให้ Archer ที่เข้าทีหลังแต่เร็วกว่า founder ได้สิทธิ์ควบคุมปาร์ตี้หลังเริ่ม battle ขณะที่ UI ก็ใช้ `players[0]` แสดงสิทธิ์ตามผิดไปด้วย

แยก `leaderId` กับ `memberOrder` เป็น metadata ของ **room ในหน่วยความจำ** โดยไม่เปลี่ยนลำดับเทิร์น:

- ผู้สร้างห้องเป็นหัวหน้า; speed sort ไม่โอนสิทธิ์
- สงวนสิทธิ์หัวหน้าตลอด reconnect grace 120 วินาทีเดิม
- reconnect remap socket ID ทั้ง leader และ join order ก่อนส่ง state; stale expiry ไม่ถอดผู้เล่นที่กลับมาแล้ว
- เมื่อหัวหน้าหมด grace และถูกนำออก จึงโอนให้สมาชิกที่ยังอยู่ตามลำดับเข้าร่วมเดิม ไม่ใช้ speed order
- ถ้าผู้รับสิทธิ์คนถัดไปยังอยู่ใน reconnect grace จะสงวนสิทธิ์ให้คนนั้นจน reconnect หรือหมด grace; battle transitions ยังรอสมาชิกที่ขาดอยู่ ไม่ให้คนที่เร็วกว่าแย่งสิทธิ์
- การ reconnect/expiry ของ nonleader ไม่เปลี่ยนหัวหน้า; สมาชิกคนสุดท้ายหมด grace แล้วลบห้องว่างตามเดิม

อีกจุดคือ `travelRegion` และ `nextStage` ไม่ตรวจความพร้อมครบเหมือน `startBattle` จึงเริ่ม encounter ขณะ account hero ยังไม่ verified หรือสมาชิกกำลัง reconnect ได้ ย้าย guard กลางมาใช้ครบทั้งสามเส้นทาง โดยตรวจ secure verification, missing members และ canonical region level gate **ก่อน**แก้ stage/region/monster/HP/log หรือเรียก persist

`startBattle` ตรวจ region ปัจจุบัน, `travelRegion` ตรวจ region เป้าหมาย, `nextStage` ตรวจ region ของด่านถัดไป Guest/legacy ยังเล่นได้ตามข้อจำกัดเดิม ไม่บังคับ guest restore เพิ่ม ไม่แก้สูตร damage/XP/drop/ราคา

## ไฟล์ที่แก้

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `multiplayer/party-policy.js` | แยก membership/leadership policy และ pure readiness validation จาก server |
| `server.js` | ใช้ policy ใน create/join/resume/expiry, แก้ permission checks ครบ 7 commands, ใช้ readiness guard ใน encounter entry ครบ 3 paths |
| `public/game.js` | ใช้ `isPartyLeader(state)` สำหรับ world map, command buttons และ shop close/ESC; fallback เป็นสมาชิกแรกเฉพาะเมื่อ server เก่าไม่ส่ง leaderId |
| `tests/party-policy.test.js` | 28 tests/subtests สำหรับ server policy, lifecycle, authorization และ transition consistency |
| `tests/ui-party-leader.test.js` | 5 behavior tests ใช้ full client ใน DOM/socket VM |
| `tests/v040.test.js` | ปรับ source assertion ให้ชี้ guard ที่ extract; behavior tests เรื่อง level gates เดิมยังรันครบ |
| `.github/workflows/session-boundary.yml` | รันบน stacked PR/base และ branch ใหม่ พร้อม syntax check โมดูลใหม่; มีเฉพาะ test steps |
| เอกสารนี้ | พฤติกรรม, validation, compatibility และความเสี่ยงคงเหลือ |

## ความเข้ากันได้ของข้อมูล

`leaderId` ส่งเพิ่มใน public room state; client ใหม่อ่าน field นี้ก่อน และมี fallback สำหรับ snapshot จาก server เก่า ส่วน `memberOrder` ไม่เผยแพร่ต่อ client ไม่วางสอง field นี้บน player และไม่เพิ่มลง profile serializer, save JSON, localStorage หรือฐานข้อมูล

ไม่มีการแก้ persistence implementation, SQL, table/schema, save format/keys, slot IDs, inventory UIDs หรือ dependency/configuration ของ production ไม่มี Supabase request จริง, migration, merge หรือ deploy

## การทดสอบ

- `npm test`: ผ่าน 50 test files รวมสองไฟล์ใหม่; direct runs ของไฟล์ใหม่ผ่าน server 28 tests/subtests และ UI 5 cases
- ยืนยัน regression บน base server ก่อนแก้ด้วย harness ชุดแรก: fail 21 จาก 26 tests/subtests รวมสมาชิกที่เร็วกว่าใช้คำสั่งหัวหน้าได้ครบ 7 เส้นทาง และ readiness bypass ของ travel/nextStage หลังแก้ผ่านทั้งหมด
- ทดสอบ slow/fast founder, nonleader commands, founder/nonleader resume, stale expiry, succession ตาม join order, final-member cleanup และกรณี successor ยัง disconnect อยู่
- ตรวจ rejected commands ด้วย full room snapshots พร้อมจำนวน emissions/save calls/timers เพื่อยืนยันว่าไม่ mutate state หรือคิวเซฟ
- ตรวจ secure account, guest และ legacy ready parties; mock Supabase/queue/transport ไม่มีการอ่านหรือเขียนข้อมูลจริง
- UI tests ครอบคลุมปุ่ม, world callbacks, click/ESC ของร้าน, old-server fallback และ explicit null leader
- Syntax checks, `git diff --check`, `audit:foundation`, `audit:elemental` ผ่าน; audit scripts เก่าที่ hardcode version/catalog ยังมีข้อจำกัดตามรายงานรอบแรก
- Real local HTTP + Socket.IO WebSocket smoke ผ่าน 9 กลุ่ม: health/index/static/null payload, faster Archer ยังออกเทิร์นก่อนแต่ founder เป็นหัวหน้า, nonleader ถูกปฏิเสธครบ 7 commands, founder disconnect/resume คงตัวละคร/turn และ remap leaderId พร้อม rotate ticket, โจมตีจนชนะ encounter จริง, nextStage ถูก block เมื่อสมาชิกหลุดและสำเร็จหลัง reconnect โดยไม่แก้ room ตรงๆ ใช้ port ชั่วคราว, ลบ `SUPABASE_*`, block outbound fetch และปิด server ใน finally หลักฐาน local: `/tmp/soulbound-party-smoke.js` และ `/tmp/soulbound-party-smoke.log`

## ขอบเขตที่ยังต้องทำต่อ

- Save queue snapshot consistency, save-error recovery และ per-slot operation reservation ยังไม่แก้ เพราะต้องแยกอนุญาตการเปลี่ยนพฤติกรรมระบบเซฟ
- i18n observer feedback/memory growth, RPC timeout, progression ระหว่าง battle และ skill6/7 stagger อยู่ใน backlog เดิม
- leader/session/receipts ยังเก็บใน process เดียว ไม่รอด server restart หรือหลาย instances
- client เก่าที่ไม่อ่าน leaderId อาจแสดงปุ่มคลาดเคลื่อน แม้ server ปฏิเสธคำสั่งที่ไม่มีสิทธิ์เสมอ ควรใช้ frontend/backend จากชุดเดียวกันเมื่ออนุมัติ staging ในภายหลัง
- ยังไม่ตรวจ live Supabase RLS/config, browser visual/audio/mobile หรือ stress test; ไม่ได้ deploy เพื่อทำการตรวจเหล่านี้

แผนถัดไปยังคงเป็นการแยก controller ทีละส่วน พร้อมรักษา event/save contracts เดิม ดู [รายงาน architecture/refactor](repository-audit-2026-11-15.md)
