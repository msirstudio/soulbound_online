/* Shared save epoch. New seasonal slots ignore pre-v0.65 progress. */
(function(){
"use strict";
const ID="rebirth-2026-11";
const isCurrent=(data)=>!!data&&data.season_id===ID;
const api=Object.freeze({ID,isCurrent});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.SoulboundSeasonV065=api;
})();
