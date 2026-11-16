"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const root = path.join(__dirname, "..");
const requireGame = createRequire(path.join(root, "server.js"));

// Execute the real Socket handlers with in-memory transports, clocks and saves.
// No HTTP listener, Supabase credentials, database writes or production requests.
function harness({ secureEnabled = false } = {}) {
  let connection;
  const messages = [], timers = [], saves = [], claims = new Map();
  const app = { use() {}, get() {}, post() {}, delete() {} };
  const express = () => app;
  express.static = () => () => {};
  express.json = () => () => {};
  class Server {
    on(event, handler) { if (event === "connection") connection = handler; }
    to(room) { return { emit: (event, state) => messages.push({ room, event, state }) }; }
  }
  const queue = {
    register(claim) {
      const key = claim.userId + ":" + claim.slot;
      if (claims.has(key)) throw new Error("Save slot already active");
      const active = { ...claim };
      claims.set(key, active);
      return active;
    },
    persist(claim, player) { saves.push({ claim, player }); return Promise.resolve(); },
    release(claim) { claims.delete(claim.userId + ":" + claim.slot); },
    isActive(userId, slot) { return claims.has(userId + ":" + slot); }
  };
  const secure = {
    enabled: secureEnabled,
    createQueue: () => queue,
    authenticate: async token => "account-" + token,
    load: async (token, slot) => ({
      userId: "account-" + token, slot, revision: 0,
      data: { class_id: "swordsman", level: 30, gold: 500, speed: 10 }
    })
  };
  const deps = name => name === "express" ? express
    : name === "http" ? { createServer: () => ({ listen() {} }) }
    : name === "socket.io" ? { Server }
    : name.endsWith("persistence/secure-saves-v057.js") ? secure
    : requireGame(name);
  const source = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const runtime = new Function("require", "process", "console", "__dirname", "setTimeout",
    source + ";return {rooms,verifiedCharacters};")(
    deps, { env: {} }, { log() {}, error() {} }, root,
    (fn, ms) => { timers.push({ fn, ms }); return timers.length; });
  function connect(id) {
    const events = {}, joined = new Set();
    connection({ id, join: code => joined.add(code), on: (event, handler) => { events[event] = handler; } });
    return {
      id, joined,
      call: (event, data = {}) => new Promise((resolve, reject) => {
        try {
          const result = events[event](data, resolve);
          if (result?.catch) result.catch(reject);
        } catch (error) { reject(error); }
      }),
      disconnect: () => events.disconnect()
    };
  }
  return { ...runtime, connect, messages, timers, saves, claims };
}

function snapshot(room) {
  return JSON.stringify(room, (_key, value) => value instanceof Map ? [...value.entries()] : value);
}

async function deniedWithoutMutation(h, socket, room, event, data = {}) {
  const before = snapshot(room), emissions = h.messages.length, writes = h.saves.length, timers = h.timers.length;
  const response = await socket.call(event, data);
  assert.equal(response.ok, false, event + " must be denied");
  assert.equal(snapshot(room), before, event + " must not mutate room, hero, encounter or turn state");
  assert.equal(h.messages.length, emissions, event + " must not broadcast a state change");
  assert.equal(h.saves.length, writes, event + " must not queue a save");
  assert.equal(h.timers.length, timers, event + " must not schedule enemy actions");
  return response;
}

async function party(h, { guest = true, count = 2 } = {}) {
  const founder = h.connect("founder");
  const created = await founder.call("createRoom", { name: "Founder", classId: "swordsman", guest });
  assert.equal(created.ok, true);
  const members = [founder], tickets = [created.ticket];
  for (let i = 1; i < count; i++) {
    const member = h.connect("member-" + i);
    const joined = await member.call("joinRoom", {
      code: created.code, name: "Member " + i, classId: "archer", guest
    });
    assert.equal(joined.ok, true);
    members.push(member); tickets.push(joined.ticket);
  }
  return { room: h.rooms.get(created.code), code: created.code, founder, members, tickets };
}

async function restoreAccounts(party) {
  for (const socket of party.members) {
    assert.equal((await socket.call("restoreCharacter", { accessToken: socket.id, slot: 1 })).ok, true);
  }
}

test("a slower founder keeps control after a faster joiner takes the first combat turn", async () => {
  const h = harness(), p = await party(h), member = p.members[1];
  assert.equal((await p.founder.call("startBattle")).ok, true);
  assert.equal([...p.room.players.keys()][0], member.id, "speed still determines combat turn order");
  p.room.status = "victory";
  assert.equal((await p.founder.call("returnCity")).ok, true, "founder retains leader permissions");
  assert.equal(p.room.leaderId, p.founder.id);
  assert.equal(h.messages.at(-1).state.leaderId, p.founder.id, "UI receives explicit leader identity");
  assert.equal((await p.founder.call("openShop", { category: "potion" })).ok, true);
  assert.equal((await p.founder.call("closeShop")).ok, true);
});

test("a faster founder remains leader without changing speed order or hero data", async () => {
  const h = harness(), p = await party(h);
  const hero = p.room.players.get(p.founder.id);
  hero.speed = 40; hero.gold = 777;
  assert.equal((await p.founder.call("startBattle")).ok, true);
  assert.equal([...p.room.players.keys()][0], p.founder.id);
  assert.equal(p.room.leaderId, p.founder.id);
  assert.strictEqual(p.room.players.get(p.founder.id), hero);
  assert.equal(hero.gold, 777);
  assert.equal(Object.hasOwn(hero, "leaderId"), false, "party authority stays outside saved character data");
});

test("every leader-only command rejects the faster nonleader without mutations", async t => {
  const h = harness(), p = await party(h), member = p.members[1];
  await p.founder.call("startBattle");
  assert.equal([...p.room.players.keys()][0], member.id);
  const commands = [
    ["startBattle", "city", {}], ["travelRegion", "city", { regionIndex: 0 }],
    ["returnCity", "victory", {}], ["nextStage", "victory", {}],
    ["restart", "defeat", {}], ["openShop", "city", { category: "potion" }],
    ["closeShop", "shop", {}]
  ];
  for (const [event, status, data] of commands) await t.test(event, async () => {
    p.room.status = status; p.room.stage = 1; p.room.regionIndex = 0;
    p.room.shopOrigin = status === "shop" ? "city" : null;
    await deniedWithoutMutation(h, member, p.room, event, data);
  });
});

test("founder reconnect remaps leadership while preserving the paused hero and speed order", async () => {
  const h = harness(), p = await party(h, { count: 3 });
  await p.founder.call("startBattle");
  const original = p.room.players.get(p.founder.id), turn = p.room.turnIndex;
  original.gold = 888;
  p.founder.disconnect();
  assert.equal(p.room.leaderId, p.founder.id, "temporary disconnect cannot transfer leadership");
  const staleExpiry = h.timers.find(timer => timer.ms === 120000);
  const reconnected = h.connect("founder-reconnected");
  const response = await reconnected.call("resumeRoom", { code: p.code, ticket: p.tickets[0] });
  assert.equal(response.ok, true);
  assert.equal(p.room.leaderId, reconnected.id);
  assert.equal(h.messages.at(-1).state.leaderId, reconnected.id);
  assert.strictEqual(p.room.players.get(reconnected.id), original);
  assert.equal(original.gold, 888); assert.equal(original.disconnected, false);
  assert.equal(p.room.turnIndex, turn);
  assert.equal(p.room.players.has(p.founder.id), false);
  staleExpiry.fn();
  assert.equal(p.room.leaderId, reconnected.id, "stale old-socket expiry cannot revoke resumed leadership");
  p.room.status = "victory";
  assert.equal((await reconnected.call("returnCity")).ok, true);
});

test("grace expiry chooses the oldest remaining member rather than the fastest member", async () => {
  const h = harness(), p = await party(h, { count: 3 });
  p.room.players.get(p.members[1].id).speed = 20;
  p.room.players.get(p.members[2].id).speed = 50;
  await p.founder.call("startBattle");
  assert.equal([...p.room.players.keys()][0], p.members[2].id);
  p.founder.disconnect();
  assert.equal(p.room.leaderId, p.founder.id);
  p.room.status = "victory";
  await deniedWithoutMutation(h, p.members[2], p.room, "restart");
  h.timers.find(timer => timer.ms === 120000).fn();
  assert.equal(p.room.players.has(p.founder.id), false);
  assert.equal(p.room.leaderId, p.members[1].id);
  assert.equal(h.messages.at(-1).state.leaderId, p.members[1].id);
  assert.equal([...p.room.players.keys()][0], p.members[2].id, "succession does not reorder combat turns");
  await deniedWithoutMutation(h, p.members[2], p.room, "returnCity");
  assert.equal((await p.members[1].call("returnCity")).ok, true);
});

test("nonleader reconnect and expiry cannot transfer founder leadership", async () => {
  const h = harness(), p = await party(h, { count: 3 });
  await p.founder.call("startBattle");
  p.members[1].disconnect();
  const resumed = h.connect("member-reconnected");
  assert.equal((await resumed.call("resumeRoom", { code: p.code, ticket: p.tickets[1] })).ok, true);
  assert.equal(p.room.leaderId, p.founder.id);
  p.members[2].disconnect();
  h.timers.filter(timer => timer.ms === 120000).at(-1).fn();
  assert.equal(p.room.players.has(p.members[2].id), false);
  assert.equal(p.room.leaderId, p.founder.id);
  p.founder.disconnect();
  h.timers.filter(timer => timer.ms === 120000).at(-1).fn();
  assert.equal(p.room.leaderId, resumed.id, "a reconnected member keeps original succession priority");
  p.room.status = "victory";
  assert.equal((await resumed.call("returnCity")).ok, true);
});

test("expiring the final member removes the empty room", async () => {
  const h = harness(), p = await party(h, { count: 1 });
  p.founder.disconnect();h.timers.find(timer => timer.ms === 120000).fn();
  assert.equal(h.rooms.has(p.code), false);
});

for (const event of ["startBattle", "travelRegion", "nextStage"]) {
  for (const reason of ["unverified", "disconnected", "underlevel"]) {
    test(event + " rejects a " + reason + " party before changing any encounter or save state", async () => {
      const h = harness({ secureEnabled: true }), p = await party(h, { guest: false });
      if (reason === "unverified") {
        assert.equal((await p.founder.call("restoreCharacter", { accessToken: p.founder.id, slot: 1 })).ok, true);
      } else await restoreAccounts(p);
      if (reason === "disconnected") p.members[1].disconnect();
      if (reason === "underlevel") {
        p.room.players.get(p.members[1].id).level = 1;
        if (event !== "travelRegion") { p.room.regionIndex = 1; p.room.stage = 6; }
      }
      p.room.status = event === "nextStage" ? "victory" : "city";
      const data = event === "travelRegion" ? { regionIndex: reason === "underlevel" ? 1 : 0 } : {};
      await deniedWithoutMutation(h, p.founder, p.room, event, data);
    });
  }
}

for (const mode of ["legacy", "guest", "account"]) {
  test(mode + " parties can start, advance and travel when every member is ready", async () => {
    const h = harness({ secureEnabled: mode !== "legacy" });
    const p = await party(h, { guest: mode === "guest" });
    if (mode === "account") await restoreAccounts(p);
    for (const hero of p.room.players.values()) { hero.level = 30; hero.speed = 10; }
    assert.equal((await p.founder.call("startBattle")).ok, true);
    assert.equal(p.room.status, "battle");assert.equal(p.room.stage, 1);
    p.room.status = "victory";
    assert.equal((await p.founder.call("nextStage")).ok, true);
    assert.equal(p.room.status, "battle");assert.equal(p.room.stage, 2);
    p.room.status = "regionClear";
    assert.equal((await p.founder.call("travelRegion", { regionIndex: 1 })).ok, true);
    assert.equal(p.room.status, "battle");assert.equal(p.room.stage, 6);
    assert.equal(p.room.regionIndex, 1);assert.equal(p.room.leaderId, p.founder.id);
  });
}

for (const resolution of ["resume", "expire"]) {
  test("a reserved successor retains join priority until they " + resolution, async () => {
    const h = harness(), p = await party(h, { count: 3 });
    p.room.players.get(p.members[2].id).speed = 50;
    await p.founder.call("startBattle");
    p.room.status = "victory";
    p.founder.disconnect(); p.members[1].disconnect();
    const expiry = h.timers.filter(timer => timer.ms === 120000);
    expiry[0].fn();
    assert.equal(p.room.leaderId, p.members[1].id);
    assert.equal(p.room.players.get(p.members[1].id).disconnected, true);
    await deniedWithoutMutation(h, p.members[2], p.room, "nextStage");
    let leader;
    if (resolution === "resume") {
      leader = h.connect("successor-resumed");
      const response = await leader.call("resumeRoom", { code: p.code, ticket: p.tickets[1] });
      assert.equal(response.ok, true);
      assert.notEqual(response.ticket, p.tickets[1]);
      expiry[1].fn();
      assert.equal(p.room.players.has(p.members[1].id), false);
    } else {
      expiry[1].fn(); leader = p.members[2];
    }
    assert.equal(p.room.leaderId, leader.id);
    assert.equal((await leader.call("nextStage")).ok, true);
    assert.equal(p.room.stage, 2);
  });
}
