"use strict";

const world = require("../world-v040");
const session = require("./session-v059");

// Membership order is runtime room metadata. Combat may sort players by speed;
// that order must never grant or transfer the founder's party permissions.
function addMember(room, id) {
  if (!room.memberOrder.includes(id)) room.memberOrder.push(id);
  if (room.leaderId === null) room.leaderId = id;
}

function remapMember(room, oldId, newId) {
  room.memberOrder = room.memberOrder.map(id => id === oldId ? newId : id);
  if (room.leaderId === oldId) room.leaderId = newId;
}

// Called only after removal, following the existing reconnect grace period.
// A member still reserved for reconnect retains their original join priority.
function removeMember(room, id) {
  room.memberOrder = room.memberOrder.filter(member => member !== id && room.players.has(member));
  if (room.leaderId === id) room.leaderId = room.memberOrder[0] || null;
}

function isLeader(room, id) {
  return room.leaderId === id && room.players.has(id);
}

// Pure validation: callers must check this before changing region, stage,
// encounter, health, logs or persistent player progress.
function battleReadiness(room, regionIndex, { secureEnabled = false } = {}) {
  const region = world.regions[regionIndex];
  if (!region) return "Unknown region.";
  const players = [...room.players.values()];
  if (!players.length) return "Join a party first.";
  if (secureEnabled && players.some(player => !player.verified && !player.guest)) {
    return "All signed-in heroes must finish secure restore first.";
  }
  if (session.hasMissing(room)) return "Wait for disconnected party members to return.";
  const blocked = players.filter(player => !world.canEnter(player.level, regionIndex));
  if (blocked.length) {
    return "Region locked: " + blocked.map(player => player.name).join(", ") +
      " must reach LV " + region.requiredLevel + ".";
  }
  return null;
}

module.exports = { addMember, remapMember, removeMember, isLeader, battleReadiness };
