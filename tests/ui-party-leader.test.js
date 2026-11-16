"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Run the shipped client and its event listeners. Player order below represents
// combat speed order: the faster guest precedes the founder in every snapshot.
function client(id) {
  const nodes = new Map(), socketEvents = new Map(), documentEvents = new Map();
  const commands = [], worldRenders = [];
  function element() {
    const listeners = new Map();
    return {
      value: "", hidden: false, disabled: false, dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(event, handler) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(handler);
      },
      dispatch(event, data = {}) { for (const handler of listeners.get(event) || []) handler(data); },
      setAttribute() {}, removeAttribute() {}, appendChild() {}, focus() {},
      querySelectorAll() { return []; }, querySelector() { return null; }
    };
  }
  function node(key) { if (!nodes.has(key)) nodes.set(key, element()); return nodes.get(key); }
  const socket = {
    connected: true, id,
    on(event, handler) { socketEvents.set(event, handler); },
    emit(event, data, ack) { commands.push({ event, data }); ack({ ok: true }); }
  };
  const document = {
    getElementById: node, querySelectorAll() { return []; },
    querySelector() { return { value: "male" }; },
    createElement: element, body: element(),
    addEventListener(event, handler) {
      if (!documentEvents.has(event)) documentEvents.set(event, []);
      documentEvents.get(event).push(handler);
    }
  };
  const context = vm.createContext({
    document, io: () => socket,
    window: {
      addEventListener() {},
      SoulboundWorldV40: { render(state, player, leader, handlers) { worldRenders.push({ state, player, leader, handlers }); } }
    },
    sessionStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    setTimeout, clearTimeout, setInterval, clearInterval, console
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8"), context);
  socketEvents.get("connect")();
  return {
    node, commands, worldRenders,
    state(value) { socketEvents.get("state")(value); },
    escape() {
      for (const handler of documentEvents.get("keydown") || []) {
        handler({ key: "Escape", preventDefault() {}, stopPropagation() {} });
      }
    }
  };
}

function hero(id, classId, speed) {
  return {
    id, name: id, classId, className: classId, speed, level: 1,
    hp: 130, maxHp: 130, mp: 40, maxMp: 40, atk: 22, def: 10,
    xp: 0, gold: 80, inventory: [], weapon: "Training Sword", armor: "Traveler Armor"
  };
}
function state(overrides = {}) {
  return {
    code: "ABCDE", status: "city", stage: 1, turnIndex: 0,
    players: [hero("fast-guest", "archer", 30), hero("founder", "swordsman", 10)],
    leaderId: "founder", enemies: [], monster: null, shopItems: [], log: [], chat: [],
    ...overrides
  };
}
function assertLeadership(c, expected) {
  for (const id of ["start", "next", "openShop", "continueShop", "restart"]) {
    assert.equal(c.node(id).disabled, !expected, id + " follows explicit party leadership");
  }
  assert.equal(c.worldRenders.at(-1).leader, expected, "world map receives the same authority");
}

test("founder retains party controls after a faster guest moves to the first combat position", async () => {
  const founder = client("founder"), guest = client("fast-guest");
  for (const snapshot of [
    state(),
    state({ status: "victory", stage: 2 }),
    state({ status: "victory", stage: 4, monster: { name: "Mini", miniBoss: true } }),
    state({ status: "regionClear", stage: 5 })
  ]) {
    founder.state(snapshot); guest.state(snapshot);
    assertLeadership(founder, true); assertLeadership(guest, false);
  }
  founder.state(state());
  const map = founder.worldRenders.at(-1);
  await map.handlers.travel(2);
  await map.handlers.openShop("weapon");
  assert.deepEqual(founder.commands.map(x => x.event), ["travelRegion", "openShop"]);
  assert.equal(founder.commands[0].data.regionIndex, 2);
  assert.equal(founder.commands[1].data.category, "weapon");
});

for (const shortcut of ["click", "Escape"]) {
  test("only the explicit leader closes the shared shop using " + shortcut, () => {
    const founder = client("founder"), guest = client("fast-guest");
    const snapshot = state({ status: "shop", shopOrigin: "city", shopCategory: "weapon" });
    founder.state(snapshot); guest.state(snapshot);
    if (shortcut === "click") {
      founder.node("v23ShopClose").dispatch("click"); guest.node("v23ShopClose").dispatch("click");
    } else { founder.escape(); guest.escape(); }
    assert.deepEqual(founder.commands.map(x => x.event), ["closeShop"]);
    assert.equal(guest.commands.length, 0);
    assert.equal(founder.node("shopPanel").hidden, true);
    assert.equal(guest.node("shopPanel").hidden, true);
  });
}

test("old servers without leaderId retain the first-player compatibility fallback", () => {
  const snapshot = state(); delete snapshot.leaderId;
  const first = client("fast-guest"), second = client("founder");
  first.state(snapshot); second.state(snapshot);
  assertLeadership(first, true); assertLeadership(second, false);
  first.state({ ...snapshot, status: "shop" }); first.escape();
  second.state({ ...snapshot, status: "shop" }); second.escape();
  assert.deepEqual(first.commands.map(x => x.event), ["closeShop"]);
  assert.equal(second.commands.length, 0);
});

test("an explicit null leaderId does not grant leadership to the first combat player", () => {
  const first = client("fast-guest");
  first.state(state({ leaderId: null })); assertLeadership(first, false);
  first.state(state({ leaderId: null, status: "shop" })); first.escape();
  assert.equal(first.commands.length, 0);
});
