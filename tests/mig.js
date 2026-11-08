const fs=require('fs');
function engine(file, store){
  const s=fs.readFileSync(file,'utf8'); const js=s.match(/<script>([\s\S]*)<\/script>/)[1].replace("requestAnimationFrame(frame);\n})();","globalThis.__t={get S(){return S},startGame,endDay,load};\n})();");
  const noop=()=>{}; const ctxP=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop:noop}):k==='measureText'?()=>({width:10}):(typeof k==='string'?noop:undefined),set:()=>true});
  const els={}; const el=()=>({style:{},hidden:false,textContent:'',innerHTML:'',dataset:{},scrollTop:0,getBoundingClientRect:()=>({height:60}),addEventListener:noop,querySelector:()=>null,getContext:()=>ctxP,firstChild:{}});
  globalThis.Image=function(){return {complete:false,naturalWidth:0}};
  globalThis.document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),addEventListener:noop};
  Object.assign(globalThis,{window:globalThis,innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>({matches:false}),addEventListener:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,performance:{now:()=>0},setTimeout:()=>{},clearTimeout:noop});
  globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
  eval(js); return {t:__t, els};
}
// 1) play the pre-charter version (v10) for a while to produce a realistic save
const store={};
let {t,els}=engine('brambleroot.v10.bak', store); t.startGame(true);
for(let i=0;i<20;i++){ t.S.coins+=200; t.endDay(false); }
console.log('v10 save made: season', t.S.season, 'day', t.S.day, 'bytes', store['brambleroot-save-v1'].length);
const snap=store['brambleroot-save-v1'];
// 2) load that save in last night's version (v12 = charters, 28 days) and in today's
for (const f of ['brambleroot.v12.bak','brambleroot.html']) {
  const st={'brambleroot-save-v1':snap};
  try { const e=engine(f, st); const s=e.t.load(); console.log(f.padEnd(22), s ? `loads OK: ${['Spring','Summer','Autumn','Winter'][s.season]} ${s.day}, coins ${s.coins}` : 'FAILED TO LOAD -> title would show only Begin', '| title buttons:', e.els.titleBtns.innerHTML.includes('Continue') ? 'Continue shown' : 'NO Continue'); }
  catch(err){ console.log(f, 'THREW', err.message); }
}
