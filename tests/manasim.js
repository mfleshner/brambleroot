const fs=require('fs');
const K=JSON.parse(process.argv[2]||'{}');
const src=fs.readFileSync('b.js','utf8').replace(/MANA_PER_KILL = [\d.]+, SPRING_FRAC = [\d.]+/, m=> K.k!==undefined?`MANA_PER_KILL = ${K.k}, SPRING_FRAC = ${K.s}`:m).replace("requestAnimationFrame(frame);\n})();","globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,draw,hollowTap,caveVisit,enterHollow,closeSheet,get sheet(){return sheetOpen},get ox(){return ox},get oy(){return oy},get T(){return T}};\n})();");
const noop=()=>{}; const ctxP=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop:noop}):k==='measureText'?()=>({width:10}):(typeof k==='string'?noop:undefined),set:()=>true});
const els={}; const el=()=>({style:{},hidden:false,textContent:'',innerHTML:'',dataset:{},scrollTop:0,getBoundingClientRect:()=>({height:60}),addEventListener:noop,querySelector:()=>null,getContext:()=>ctxP,firstChild:{}});
globalThis.Image=function(){return {complete:false,naturalWidth:0}};
globalThis.document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),addEventListener:noop};
Object.assign(globalThis,{window:globalThis,innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>({matches:false}),addEventListener:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,performance:{now:()=>0},setTimeout:()=>{},clearTimeout:noop});
const base=JSON.parse(fs.readFileSync('shot-save.json','utf8'));
const store={}; globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
eval(src); const t=__t;
const SELL={jelly:15,batwing:25,shell:35,crystal:90}; const worth=S=>S.coins+Object.entries(SELL).reduce((a,[k,v])=>a+(S.inv[k]||0)*v,0);
// one dive: start at floor f0 with mana M, fight until out of mana; return deepest floor reached and coins/items value
function dive(M, f0, nSpells){
  const save=JSON.parse(JSON.stringify(base)); save.grove=true; save.time=600; save.day=10; save.hollowMax=Math.max(f0, 1);
  save.spells=['quicken','hearth','rain','firebolt','frost'].slice(0,nSpells); for (const k of ['firebolt','frost']) if(!save.spells.includes(k)) save.spells.push(k);
  localStorage.setItem('brambleroot-save-v1', JSON.stringify(save));
  t.startGame(false); const S=t.S; while(t.sheet) t.closeSheet();
  S.manaMax=M; S.mana=M; S.energy=999; S.maxEnergy=999; S.scene='wood'; t.enterHollow(f0);
  const v0=worth(S); let g=0;
  while(S.scene==='hollow' && g++<40000){
    while(t.sheet) t.closeSheet();
    const H=t.HV; if(!H) break;
    if(H.mobs.length){ if(S.mana<2 && !H.bolts.length) break; const m=H.mobs[0]; t.hollowTap(t.ox+(m.x+.5)*t.T, t.oy+(m.y+.3)*t.T); }
    else if(H.stairs){ if(H.floor>=15) break; t.hollowTap(t.ox+(H.stairs[0]+.5)*t.T, t.oy+(H.stairs[1]+.5)*t.T); for(let i=0;i<300 && t.HV===H;i++) t.update(1/30); continue; }
    for(let i=0;i<6;i++) t.update(1/30);
  }
  return { reached: t.S.hollowMax, value: worth(t.S)-v0 };
}
const avg=(M,f0,n=300)=>{ let s=0, five=0, val=0; for(let i=0;i<n;i++){ const r=dive(M,f0); s+=r.reached; val+=r.value; if(r.reached>=Math.max(5,f0+3)) five++; } return `value ${Math.round(val/n)} coins, avg deepest floor ${(s/n).toFixed(1)}, reach floor 5 (or 3 below the start) in ${Math.round(five/n*100)}% of dives`; };
for (const M of [20,30,40]) console.log(`mana ${M} from floor 1:`, avg(M,1));
console.log('mana 40 from floor 5:', avg(40,5));
