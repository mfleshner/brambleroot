const fs=require('fs');
const src=fs.readFileSync('b.js','utf8').replace("requestAnimationFrame(frame);\n})();","globalThis.__t={get S(){return S},get HV(){return HV},startGame,update,draw,visit,hollowTap,caveVisit,enterHollow,firebolt,frostRing,updateHollow,closeSheet,openSheet,renderSheet,get sheet(){return sheetOpen},get queue(){return queue},witch,buildStatic,get ox(){return ox},get oy(){return oy},get T(){return T},setTab:v=>{marketTab=v}};\n})();");
const noop=()=>{}; const ctxP=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop:noop}):k==='measureText'?()=>({width:10}):(typeof k==='string'?noop:undefined),set:()=>true});
const els={}; const el=()=>({style:{},hidden:false,textContent:'',innerHTML:'',dataset:{},scrollTop:0,getBoundingClientRect:()=>({height:60}),addEventListener:noop,querySelector:()=>null,getContext:()=>ctxP,firstChild:{}});
globalThis.Image=function(){return {complete:false,naturalWidth:0}};
globalThis.document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),addEventListener:noop};
Object.assign(globalThis,{window:globalThis,innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>({matches:false}),addEventListener:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,performance:{now:()=>0},setTimeout:()=>{},clearTimeout:noop});
const save=JSON.parse(fs.readFileSync('shot-save.json','utf8')); save.grove=true; save.time=600; save.day=10;
const store={'brambleroot-save-v1':JSON.stringify(save)}; globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
eval(src); const t=__t; t.startGame(false); const S=t.S;
if (t.sheet) t.closeSheet();
t.caveVisit(); console.log('first visit learns firebolt:', S.spells.includes('firebolt'), 'sheet', t.sheet); t.closeSheet();
t.caveVisit(); console.log('scene', S.scene, 'floor', t.HV.floor, 'mobs', t.HV.mobs.map(m=>m.k).join(','));
// fight: keep mana topped, tap mobs via screen coords; step update
let floors=0, guard=0, hits=0; const startCoins=S.coins;
S.energy=999; S.maxEnergy=999;
while (S.scene==='hollow' && floors<6 && guard++<20000) {
  S.mana=50;
  const H=t.HV;
  if (H.mobs.length) { const m=H.mobs[0]; t.hollowTap(t.ox+(m.x+.5)*t.T, t.oy+(m.y+.3)*t.T); hits++; }
  else if (H.stairs) { t.hollowTap(t.ox+(H.stairs[0]+.5)*t.T, t.oy+(H.stairs[1]+.5)*t.T); for(let i=0;i<200 && t.HV===H;i++) t.update(1/30); floors++; if (t.sheet) { console.log('  milestone sheet at floor', t.HV&&t.HV.floor, '->', t.sheet); t.closeSheet(); } continue; }
  for (let i=0;i<6;i++) t.update(1/30);
  t.draw();
}
console.log('reached floor', t.HV&&t.HV.floor, 'hollowMax', S.hollowMax, 'frost learned', S.spells.includes('frost'), 'bolts thrown', hits);
console.log('drops', JSON.stringify(Object.fromEntries(['jelly','batwing','shell','crystal'].map(k=>[k,S.inv[k]||0]))), 'coins delta', S.coins-startCoins);
// frost ring
S.mana=50; t.frostRing(); console.log('frost ring ok, mana', S.mana);
// fainting
S.maxEnergy=100; S.energy=5; S.mana=0; t.enterHollow(4); t.witch.x=4; t.witch.y=4; for (let i=0;i<2000 && S.scene==='hollow';i++) t.update(1/30);
console.log('after faint: scene', S.scene, 'sheet', t.sheet, 'fainted line', els.shBody.innerHTML.includes('fainted in the Hollow'), 'day', S.day);
// lift
t.closeSheet(); S.scene='wood'; t.caveVisit(); console.log('lift sheet', t.sheet, els.shBody.innerHTML.match(/Floor \d+/g));
t.closeSheet();
S.inv.crystal=3; S.up.can=true; S.up.can2=true; S.coins+=1000; t.setTab('upgrades'); t.openSheet('market'); 
console.log('can3 listed', els.shBody.innerHTML.includes('Gold watering can'));
t.openSheet('spells'); console.log('spellbook firebolt row', els.shBody.innerHTML.includes('Firebolt'));
