/* SOULBOUND v0.56.4 · server-defined release version.
 * The package.json version is authoritative; HTML text is a static offline
 * fallback that CI verifies. No gameplay or network state is modified.
 */
(()=>{
"use strict";
const apply=version=>{
 if(typeof version!=="string"||!/^\d+\.\d+(?:\.\d+)?$/.test(version))return;
 version=version.replace(/\.0$/,"");
 const brand=document.querySelector(".v16-game-brand small");
 if(brand)brand.textContent="v"+version;
 const footer=document.querySelector(".v041-menu-foot");
 if(footer)footer.textContent=footer.textContent.replace(/v\d+\.\d+(?:\.\d+)?/, "v"+version);
 const title=document.querySelector("[data-soulbound-version]");
 if(title)title.textContent="VERSION "+version+" · SECURE SAVES";
};
if(typeof fetch!=="function")return;
fetch("/health",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
 if(data?.ok)apply(data.version);
}).catch(()=>{/* Keep the verified static fallback in offline mode. */});
})();