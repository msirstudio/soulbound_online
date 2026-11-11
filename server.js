const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_, res) => res.json({ ok: true, game: "SOULBOUND Online", version: "0.2.0" }));

const rooms = new Map();
const monsters = [
  { name: "Shadow Wolf", icon: "🐺", hp: 90, atk: 12, def: 2, xp: 35, gold: 18 },
  { name: "Goblin Raider", icon: "👺", hp: 130, atk: 17, def: 5, xp: 55, gold: 30 },
  { name: "Cursed Knight", icon: "💀", hp: 210, atk: 23, def: 8, xp: 90, gold: 55 },
  { name: "Ember Dragon", icon: "🐉", hp: 330, atk: 30, def: 11, xp: 150, gold: 100 }
];

function cleanName(value) {
  return String(value || "Adventurer").trim().replace(/[<>]/g, "").slice(0, 16) || "Adventurer";
}
function bounded(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}
function publicRoom(room) {
  return {
    code: room.code, stage: room.stage, monster: room.monster,
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, hp: p.hp, maxHp: p.maxHp,
      mp: p.mp, maxMp: p.maxMp, level: p.level, xp: p.xp,
      gold: p.gold, potions: p.potions, atk: p.atk, def: p.def,
      alive: p.hp > 0
    })),
    turnIndex: room.turnIndex, status: room.status, log: room.log.slice(-12)
  };
}
function emitRoom(room) { io.to(room.code).emit("state", publicRoom(room)); }
function say(room, message) {
  room.log.push(message);
  if (room.log.length > 30) room.log.shift();
}
function createRoom(code) {
  const room = { code, stage: 0, monster: null, players: new Map(), turnIndex: 0, status: "waiting", log: [] };
  rooms.set(code, room);
  return room;
}
function currentPlayer(room) {
  const players = [...room.players.values()];
  return players.length ? players[room.turnIndex % players.length] : null;
}
function livingPlayers(room) { return [...room.players.values()].filter(p => p.hp > 0); }
function startBattle(room) {
  const template = monsters[room.stage];
  room.monster = { ...template, maxHp: template.hp };
  room.status = "battle";
  room.turnIndex = 0;
  for (const p of room.players.values()) { p.hp = p.maxHp; p.mp = p.maxMp; }
  say(room, `A ${room.monster.name} appears!`);
}
function nextTurn(room) {
  const alive = livingPlayers(room);
  if (!alive.length) {
    room.status = "defeat";
    say(room, "The party has fallen. The host can restart the adventure.");
    return;
  }
  const all = [...room.players.values()];
  let attempts = 0;
  do {
    room.turnIndex = (room.turnIndex + 1) % all.length;
    attempts++;
  } while (all[room.turnIndex].hp <= 0 && attempts <= all.length);
}
function endMonster(room) {
  const m = room.monster;
  room.status = "victory";
  for (const p of room.players.values()) {
    p.xp += m.xp; p.gold += m.gold;
    while (p.xp >= p.level * 100) {
      p.xp -= p.level * 100; p.level++;
      p.maxHp += 20; p.maxMp += 8; p.atk += 4; p.def += 2;
      p.hp = p.maxHp; p.mp = p.maxMp;
      say(room, `${p.name} reached level ${p.level}!`);
    }
  }
  say(room, `Victory! The party defeated ${m.name}.`);
}
function validTurn(socket, room) {
  if (room.status !== "battle") return false;
  const player = room.players.get(socket.id);
  return !!player && player.hp > 0 && currentPlayer(room)?.id === socket.id;
}
function defaultPlayer(id, name) {
  return { id, name: cleanName(name), hp: 120, maxHp: 120, mp: 40, maxMp: 40, level: 1, xp: 0, gold: 0, potions: 3, atk: 20, def: 8 };
}

io.on("connection", socket => {
  socket.on("createRoom", ({ name } = {}, callback = () => {}) => {
    const code = Math.random().toString(36).slice(2, 7).toUpperCase();
    const room = createRoom(code);
    room.players.set(socket.id, defaultPlayer(socket.id, name));
    socket.join(code);
    say(room, `${cleanName(name)} created the party.`);
    emitRoom(room);
    callback({ ok: true, code });
  });

  socket.on("joinRoom", ({ code, name } = {}, callback = () => {}) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return callback({ ok: false, error: "Room not found. Check the code." });
    if (room.players.size >= 4) return callback({ ok: false, error: "This party is full (maximum 4)." });
    if (room.status !== "waiting") return callback({ ok: false, error: "This adventure has already started." });
    const playerName = cleanName(name);
    room.players.set(socket.id, defaultPlayer(socket.id, playerName));
    socket.join(code);
    say(room, `${playerName} joined the party.`);
    emitRoom(room);
    callback({ ok: true, code });
  });

  // Prototype restore hook: only the connected player can restore their own room slot,
  // and only before the party starts. Database ownership is enforced by Supabase RLS in the browser.
  socket.on("restoreCharacter", (stats = {}, callback = () => {}) => {
    const room = [...rooms.values()].find(r => r.players.has(socket.id));
    if (!room || room.status !== "waiting") return callback({ ok: false, error: "Character can only be restored in the waiting room." });
    const p = room.players.get(socket.id);
    p.level = bounded(stats.level, 1, 999, 1);
    p.xp = bounded(stats.xp, 0, 999999, 0);
    p.gold = bounded(stats.gold, 0, 99999999, 0);
    p.maxHp = bounded(stats.max_hp, 120, 999999, 120);
    p.hp = bounded(stats.hp, 1, p.maxHp, p.maxHp);
    p.maxMp = bounded(stats.max_mp, 40, 999999, 40);
    p.mp = bounded(stats.mp, 0, p.maxMp, p.maxMp);
    p.atk = bounded(stats.attack, 20, 999999, 20);
    p.def = bounded(stats.defense, 8, 999999, 8);
    p.potions = bounded(stats.potions, 0, 999999, 3);
    emitRoom(room);
    callback({ ok: true });
  });

  socket.on("startBattle", (_, callback = () => {}) => {
    const room = [...rooms.values()].find(r => r.players.has(socket.id));
    if (!room) return callback({ ok: false, error: "Join a room first." });
    if ([...room.players.keys()][0] !== socket.id) return callback({ ok: false, error: "Only the party leader can start." });
    if (room.status !== "waiting") return callback({ ok: false, error: "The battle has already started." });
    startBattle(room); say(room, "The party's adventure begins!");
    emitRoom(room); callback({ ok: true });
  });

  socket.on("action", ({ type } = {}, callback = () => {}) => {
    const room = [...rooms.values()].find(r => r.players.has(socket.id));
    if (!room) return callback({ ok: false, error: "You are not in a room." });
    if (!validTurn(socket, room)) return callback({ ok: false, error: "Wait for your turn." });
    const p = room.players.get(socket.id), m = room.monster;
    let damage = 0;
    if (type === "attack") {
      damage = Math.max(1, p.atk + Math.floor(Math.random() * 8) - m.def);
      m.hp = Math.max(0, m.hp - damage);
      say(room, `${p.name} attacks for ${damage} damage.`);
    } else if (type === "skill") {
      if (p.mp < 12) return callback({ ok: false, error: "Not enough MP." });
      p.mp -= 12;
      damage = Math.max(1, Math.floor(p.atk * 1.8) + Math.floor(Math.random() * 10) - m.def);
      m.hp = Math.max(0, m.hp - damage);
      say(room, `${p.name} casts Flame Blade for ${damage} damage!`);
    } else if (type === "heal") {
      if (p.potions < 1 || p.hp === p.maxHp) return callback({ ok: false, error: "No potion available or HP is full." });
      p.potions--;
      const amount = Math.min(45, p.maxHp - p.hp);
      p.hp += amount;
      say(room, `${p.name} restores ${amount} HP.`);
    } else if (type === "guard") {
      p.mp = Math.min(p.maxMp, p.mp + 5);
      say(room, `${p.name} guards and recovers 5 MP.`);
    } else return callback({ ok: false, error: "Unknown action." });

    if (m.hp <= 0) { endMonster(room); emitRoom(room); return callback({ ok: true }); }
    nextTurn(room);
    if (room.status === "battle" && currentPlayer(room)?.hp > 0 && room.turnIndex === 0) {
      const allAlive = livingPlayers(room);
      const target = allAlive[Math.floor(Math.random() * allAlive.length)];
      if (target) {
        const hit = Math.max(1, m.atk - target.def);
        target.hp = Math.max(0, target.hp - hit);
        say(room, `${m.name} strikes ${target.name} for ${hit} damage.`);
        if (!livingPlayers(room).length) room.status = "defeat";
      }
    }
    emitRoom(room); callback({ ok: true });
  });

  socket.on("nextStage", (_, callback = () => {}) => {
    const room = [...rooms.values()].find(r => r.players.has(socket.id));
    if (!room) return callback({ ok: false, error: "Room not found." });
    if ([...room.players.keys()][0] !== socket.id) return callback({ ok: false, error: "Only the party leader can continue." });
    if (room.status !== "victory") return callback({ ok: false, error: "Win the battle first." });
    if (room.stage >= monsters.length - 1) {
      room.status = "complete"; say(room, "The Ember Dragon has fallen. The kingdom is free!");
    } else {
      room.stage++; startBattle(room); say(room, "The party advances to the next encounter.");
    }
    emitRoom(room); callback({ ok: true });
  });

  socket.on("restart", (_, callback = () => {}) => {
    const room = [...rooms.values()].find(r => r.players.has(socket.id));
    if (!room) return callback({ ok: false, error: "Room not found." });
    if ([...room.players.keys()][0] !== socket.id) return callback({ ok: false, error: "Only the party leader can restart." });
    room.stage = 0; room.status = "waiting"; room.monster = null;
    for (const p of room.players.values()) { p.hp = p.maxHp; p.mp = p.maxMp; }
    room.log = ["A new adventure is ready. The party leader can start the battle."];
    emitRoom(room); callback({ ok: true });
  });

  socket.on("disconnect", () => {
    for (const room of rooms.values()) {
      if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        room.players.delete(socket.id);
        say(room, `${player.name} disconnected.`);
        if (!room.players.size) rooms.delete(room.code);
        else { room.turnIndex = 0; emitRoom(room); }
      }
    }
  });
});

server.listen(PORT, () => console.log(`SOULBOUND Online v0.2.0 running on ${PORT}`));
