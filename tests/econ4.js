// 28-day season sim: farming, plus optional forage + spells, using a parameter set.
const DAYS=28;
const SEAS={
 spring:{C:{mint:{seed:10,sell:20,grow:3},ember:{seed:20,sell:46,grow:4},moon:{seed:25,sell:55,grow:4,unlock:3},thorn:{seed:40,sell:18,grow:5,regrow:2,yield:2,unlock:3},glow:{seed:45,sell:110,grow:6,noWater:true,unlock:5}}, F:[30,65,40]},
 summer:{C:{mint:{seed:10,sell:20,grow:3},thorn:{seed:40,sell:18,grow:5,regrow:2,yield:2},pepper:{seed:30,sell:70,grow:4},star:{seed:70,sell:55,grow:7,regrow:3,yield:2,unlock:3},melon:{seed:60,sell:220,grow:8}}, F:[35,50,60]},
 autumn:{C:{ember:{seed:20,sell:46,grow:4},glow:{seed:45,sell:110,grow:6,noWater:true},gourd:{seed:50,sell:180,grow:7},wolf:{seed:35,sell:75,grow:5}}, F:[60,35,60]},
 winter:{C:{frost:{seed:40,sell:90,grow:5,noWater:true}}, F:[40,70,70]}
};
function run(season,start,o){
  const {C:C0,F}=SEAS[season]; const C=Object.fromEntries(Object.entries(C0).map(([k,c])=>[k,{...c,grow:c.grow+(o.slow||0),sell:Math.round(c.sell*(o.cheap||1))}])); const fAvg=F.reduce((a,b)=>a+b,0)/F.length*(o.fScale||1);
  let coins=start, plots=[], tilled=0, earned=0;
  for(let d=1; d<=DAYS; d++){
    for(const p of plots){ if(p.ready<=d && !p.done){ const c=C[p.c]; const n=(c.yield||1)*(p.b?2:1); p.b=false; coins+=c.sell*n; earned+=c.sell*n; if(c.regrow) p.ready=d+c.regrow; else p.done=true; } }
    plots=plots.filter(p=>!p.done);
    let energy=100*o.eff + (o.spells?30:0);
    let mana=o.spells?o.mana:0;
    const rain=o.spells && mana>=o.rainCost; if(rain) mana-=o.rainCost;
    if(!rain) energy-=plots.filter(p=>!C[p.c].noWater).length;
    if(o.fest && d===14){ if(o.festPlant){ energy*=o.festPlant; } else continue; } // festival day: water in the morning, then off to the fair
    if(o.forage){ const spots=o.spots+(o.spells?6:0); for(let i=0;i<spots && energy>=o.fE;i++){ energy-=o.fE; coins+=fAvg; earned+=fAvg; } if(o.spells){ coins+=3*fAvg; earned+=3*fAvg; } }
    if(o.spells){ // bountiful once: best bed ripening soonest
      if(mana>=o.bCost){ const b=plots.filter(p=>!p.b).sort((a,b)=>C[b.c].sell*(C[b.c].yield||1)-C[a.c].sell*(C[a.c].yield||1))[0]; if(b){ b.b=true; mana-=o.bCost; } }
      while(mana>=8){ const q=plots.filter(p=>p.ready>d+1).sort((a,b)=>C[b.c].sell/C[b.c].grow-C[a.c].sell/C[a.c].grow)[0]; if(!q) break; q.ready--; mana-=8; }
    }
    const opts=Object.keys(C).filter(id=>(C[id].unlock||1)<=d && d+C[id].grow<=DAYS).map(id=>{const c=C[id]; const days=DAYS-d; const harv=1+(c.regrow?Math.floor((days-c.grow)/c.regrow):0); return {id, rate:((c.yield||1)*c.sell*harv-c.seed)/Math.min(days,c.grow+(harv-1)*(c.regrow||0)), w:(c.noWater||rain)?0:1, cost:c.seed};}).filter(o=>o.rate>0).sort((a,b)=>b.rate-a.rate);
    for(const op of opts) while(plots.length<56){ const e=(plots.length>=tilled?2:0)+op.w; if(energy<e||coins<op.cost) break; coins-=op.cost; energy-=e; if(plots.length>=tilled) tilled++; plots.push({c:op.id, ready:d+C[op.id].grow}); }
  }
  return Math.round(earned);
}
const base={eff:1,forage:false,spells:false};
const P=JSON.parse(process.argv[2]||'{}');
const cfg=Object.assign({spots:7,fE:2,fScale:1,mana:80,rainCost:25,bCost:10},P);
const rows=[['spring',150,'early (spring)'],['summer',1500],['autumn',1500],['winter',1500]];
for(const [s,st] of rows){
  const f=run(s,st,{...base}), fr=run(s,st,{...base,eff:.6});
  const all=run(s,st,{...cfg,eff:1,forage:true,spells:s!=='spring'}), allr=run(s,st,{...cfg,eff:.6,forage:true,spells:s!=='spring'});
  const spF=s==='spring'?run(s,st,{...cfg,eff:1,forage:true,spells:false}):all;
  if(cfg.curses){ const base0=spF; const sim=o=>s==='spring'?run(s,st,{...cfg,...o,eff:1,forage:true,spells:false}):run(s,st,{...cfg,...o,eff:1,forage:true,spells:true});
    const slow=sim({slow:1}), cheap=sim({cheap:.85}), few=sim({spots:cfg.spots-2});
    console.log(s.padEnd(7),'  whole-season curses: Sluggard Hex',String(Math.round((slow/base0-1)*100))+'%',"| Haggler's",String(Math.round((cheap/base0-1)*100))+'%','| Hidden Wood',String(Math.round((few/base0-1)*100))+'%'); }
  if(cfg.fest){ const sim=o=>s==='spring'?run(s,st,{...cfg,...o,eff:1,forage:true,spells:false}):run(s,st,{...cfg,...o,eff:1,forage:true,spells:true}); const b0=sim({}), all=sim({fest:1}), half=sim({fest:1,festPlant:.5});
    console.log(s.padEnd(7),'  festival day at the fair: whole day',String(Math.round((all/b0-1)*1000)/10)+'%','| morning chores only, half the energy',String(Math.round((half/b0-1)*1000)/10)+'%'); }
  if(cfg.cookE){ const ck=run(s,st,{...cfg,eff:1+cfg.cookE/100,forage:true,spells:s!=='spring'})-28*cfg.cookK; console.log(s.padEnd(7),`  cooking (+${cfg.cookE} energy/day for ${cfg.cookK} coins/day):`,String(ck).padStart(6),' (+'+Math.round((ck/spF-1)*100)+'% over Wood'+(s==='spring'?'':' + spells')+')'); }
  console.log(s.padEnd(7),'farm only good/relaxed:',String(f).padStart(6),String(fr).padStart(6),' | with Wood'+(s==='spring'?'':' + spells')+' good/relaxed:',String(spF).padStart(6),String(allr).padStart(6), ' (+'+Math.round((spF/f-1)*100)+'%)');
}
