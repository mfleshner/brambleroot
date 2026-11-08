const fs=require('fs');
const src=fs.readFileSync('b.js','utf8').replace("requestAnimationFrame(frame);\n})();","globalThis.__t={VILLAGERS,VIDS,ITEMS,FEST,VISIT_SPOT,VISIT_STAND,VISIT_LINES,BDAY_NOTES,THANKS,HEART_LETTERS,PLACES,portrait,CROPS,POTIONS,FISH,FORAGE};})();");
const noop=()=>{}; const ctxP=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop:noop}):k==='measureText'?()=>({width:10}):(typeof k==='string'?noop:undefined),set:()=>true});
const els={}; const el=()=>({style:{},hidden:false,textContent:'',innerHTML:'',dataset:{},scrollTop:0,getBoundingClientRect:()=>({height:60}),addEventListener:noop,querySelector:()=>null,getContext:()=>ctxP,firstChild:{}});
globalThis.Image=function(){return {complete:false,naturalWidth:0}};
globalThis.document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),addEventListener:noop};
Object.assign(globalThis,{window:globalThis,innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>({matches:false}),addEventListener:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,performance:{now:()=>0},setTimeout:()=>{},clearTimeout:noop});
globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
eval(src);const T=globalThis.__t;
let h='<html><body style="margin:0;background:#1e1626;font:12px sans-serif;color:#eee">';
for(const v of T.VIDS){h+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px"><b style="width:70px">${v}</b>`;for(const m of ['neutral','happy','love','sad','shock'])h+=T.portrait(v,m,72);h+='</div>';}
fs.writeFileSync('gallery.html',h+'</body></html>');
