"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib");
const root=path.resolve(__dirname,"..");
const filename=path.join(root,"public/assets/hero-animations/female_swordsman_idle_8f.png");
const sig=Buffer.from("89504e470d0a1a0a","hex");
function decodeRows(bytes){
 assert.ok(bytes.subarray(0,8).equals(sig),"Valid PNG signature");
 let off=8,w=0,h=0,depth=0,kind=0;const parts=[];let transparent=false;
 while(off<bytes.length){
  const size=bytes.readUInt32BE(off),tag=bytes.toString("ascii",off+4,off+8),payload=bytes.subarray(off+8,off+8+size);
  assert.ok(off+12+size<=bytes.length,"No truncated PNG chunks");
  if(tag==="IHDR"){w=payload.readUInt32BE(0);h=payload.readUInt32BE(4);depth=payload[8];kind=payload[9]}
  if(tag==="tRNS")transparent=true;
  if(tag==="IDAT")parts.push(payload);
  off+=size+12;
  if(tag==="IEND")break;
 }
 assert.equal(depth,8);assert.equal(kind,3,"8-bit indexed palette for small, crisp pixel art");
 assert.ok(transparent,"Transparent background is retained");
 const data=zlib.inflateSync(Buffer.concat(parts)),rows=[];
 let p=0,prev=Buffer.alloc(w);
 for(let y=0;y<h;y++){
  const filter=data[p++],src=data.subarray(p,p+w),dst=Buffer.alloc(w);p+=w;
  const paeth=(a,b,c)=>{const pred=a+b-c,da=Math.abs(pred-a),db=Math.abs(pred-b),dc=Math.abs(pred-c);return da<=db&&da<=dc?a:db<=dc?b:c};
  for(let x=0;x<w;x++){
   const left=x?dst[x-1]:0,above=prev[x],diag=x?prev[x-1]:0;
   const recon=filter===0?0:filter===1?left:filter===2?above:filter===3?Math.floor((left+above)/2):filter===4?paeth(left,above,diag):NaN;
   assert.ok(Number.isFinite(recon),"Supported PNG row filter "+filter);
   dst[x]=(src[x]+recon)&255;
  }
  rows.push(dst);prev=dst;
 }
 return {width:w,height:h,rows};
}
test("Shipped artwork is a real transparent 2048×256 PNG, not a placeholder",()=>{
 const png=decodeRows(fs.readFileSync(filename));
 assert.equal(png.width,8*256);assert.equal(png.height,256);
 assert.ok(png.rows.length===256);
});
test("All eight frames share pixel-identical boots / ground baseline",()=>{
 const png=decodeRows(fs.readFileSync(filename)),size=256;
 for(let y=192;y<256;y++){
  const row=png.rows[y],base=row.subarray(0,size);
  for(let i=1;i<8;i++){
   assert.ok(row.subarray(i*size,(i+1)*size).equals(base),"Foot/leg drift at frame "+i+", y="+y);
  }
 }
});
test("Idle is animated above the hips rather than eight copies of the same frame",()=>{
 const png=decodeRows(fs.readFileSync(filename));let changes=0;
 for(let y=0;y<160;y++)for(let x=0;x<256;x++)if(png.rows[y][x]!==png.rows[y][256+x])changes++;
 assert.ok(changes>100,"At least two unique upper-body animation keyframes required");
});
