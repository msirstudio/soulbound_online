"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Execute the shipped client in a small DOM/socket environment: the test clicks
// JOIN and resumes using the ticket the server acknowledged, without a browser.
function client(joinReply, resumeReply = { ok: true, code: "ABCDE", ticket: "rotated-ticket" }) {
  const nodes = new Map(), storage = new Map(), emitted = [];
  function element() {
    return {
      value: "", hidden: false, disabled: false, dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, setAttribute() {}, appendChild() {}, focus() {},
      querySelectorAll() { return []; }, querySelector() { return null; }
    };
  }
  function node(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); }
  const socket = {
    connected: true, id: "friend-socket", on() {},
    emit(event, data, ack) {
      emitted.push({ event, data });
      ack(event === "joinRoom" ? joinReply : event === "resumeRoom"
        ? resumeReply : { ok: true });
    }
  };
  const document = {
    getElementById: node, querySelectorAll() { return []; },
    querySelector() { return { value: "male" }; },
    createElement: element, addEventListener() {}, body: element()
  };
  const context = vm.createContext({
    document, io: () => socket, window: { addEventListener() {} },
    sessionStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
    setTimeout, clearTimeout, setInterval, clearInterval, console
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/game.js"), "utf8"), context);
  vm.runInContext('selectedGameMode="continue";guestMode=true;savedCharacter={class_id:"swordsman"}', context);
  node("classId").value = "swordsman";
  node("name").value = "Friend";
  node("roomCode").value = "ABCDE";
  return { nodes, storage, emitted, context };
}

test("joining a party stores its private ticket and can resume the same room", async () => {
  const c = client({ ok: true, code: "ABCDE", ticket: "joined-player-ticket" });
  await c.nodes.get("join").onclick();
  const ticket = JSON.parse(c.storage.get("soulbound_reconnect_v059_guest"));
  assert.equal(ticket.code, "ABCDE");
  assert.equal(ticket.ticket, "joined-player-ticket");
  assert.ok(ticket.at > 0);
  assert.equal(await vm.runInContext("v59TryResume()", c.context), true);
  const resume = c.emitted.find(x => x.event === "resumeRoom");
  assert.equal(resume.data.code, "ABCDE");
  assert.equal(resume.data.ticket, "joined-player-ticket");
  assert.equal(JSON.parse(c.storage.get("soulbound_reconnect_v059_guest")).ticket, "rotated-ticket");
});

test("a rejected join does not create a reconnect ticket", async () => {
  const c = client({ ok: false, error: "Room is full." });
  await c.nodes.get("join").onclick();
  assert.equal(c.storage.has("soulbound_reconnect_v059_guest"), false);
  assert.equal(c.emitted.some(x => x.event === "restoreCharacter"), false);
});


test("a long active game can resume when its original ticket is older than two minutes", async () => {
  const c = client({ ok: true, code: "ABCDE", ticket: "older-valid-ticket" });
  await c.nodes.get("join").onclick();
  const key = "soulbound_reconnect_v059_guest", ticket = JSON.parse(c.storage.get(key));
  ticket.at = Date.now() - 60 * 60 * 1000;
  c.storage.set(key, JSON.stringify(ticket));
  assert.equal(await vm.runInContext("v59TryResume()", c.context), true);
  assert.equal(c.emitted.find(x => x.event === "resumeRoom").data.ticket, "older-valid-ticket");
});

test("a server-expired ticket is cleared so the player can return to the lobby", async () => {
  const c = client({ ok: true, code: "ABCDE", ticket: "expired-ticket" },
    { ok: false, error: "Reconnect expired or invalid. Return to the lobby." });
  await c.nodes.get("join").onclick();
  assert.equal(await vm.runInContext("v59TryResume()", c.context), false);
  assert.equal(c.storage.has("soulbound_reconnect_v059_guest"), false);
});
