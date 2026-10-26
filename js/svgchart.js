/* R6b: własny lekki renderer wykresów SVG (bez canvas, bez animacji, bez requestAnimationFrame).
   Obsługuje podzbiór konfiguracji Chart.js używany w aplikacji: bar (pionowe/poziome, grupowane, stosowane, pływające [a,b]),
   line (luki null, borderDash, oś prawa y1/y2), scatter/bubble (oś log), doughnut/pie. Tooltip = natywny <title>. */
(function(){
const NS="http://www.w3.org/2000/svg";
const PALD=["#0a84ff","#ff9f0a","#30d158","#bf5af2","#ff375f","#64d2ff","#ffd60a","#5e5ce6","#ac8e68","#ff6482","#32ade6","#8e8e93"];
const cssv=(n,d)=>{try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||d;}catch(e){return d;}};
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const unl=l=>Array.isArray(l)?l.join(" "):String(l==null?"":l);
const CW=6.4; // szer. znaku przy 12 px (szacunek)
const nfmt=v=>{if(v==null||!isFinite(v)) return ""; const a=Math.abs(v); const d=a>=100||Number.isInteger(v)?0:a>=10?1:2; return (+v.toFixed(d)).toLocaleString("pl-PL",{maximumFractionDigits:d});};
function nice(min,max,n){if(min===max){if(min===0){max=1;}else{min=min>0?0:min*1.1; max=max>0?max*1.1:0;}} const span=max-min; let st=Math.pow(10,Math.floor(Math.log10(span/n))); const e=span/n/st; st*=e>=5?10:e>=2?5:e>=1?2:1;
  const lo=Math.floor(min/st+1e-9)*st, hi=Math.ceil(max/st-1e-9)*st; const t=[]; for(let v=lo;v<=hi+st/2;v+=st) t.push(+v.toPrecision(12)); return {min:lo,max:hi,ticks:t};}
function logT(min,max){min=Math.max(min,1e-9); const a=Math.floor(Math.log10(min)), b=Math.ceil(Math.log10(max)); const t=[]; for(let k=a;k<=b;k++) t.push(Math.pow(10,k)); return {min:Math.pow(10,a),max:Math.pow(10,b),ticks:t};}
// R6e: kontrast serii (WCAG 1.4.11 ≥3:1 do tła karty) w trybie jasnym i ciemnym; kolory var(--x) rozwiązywane
const isDark=()=>{const t=document.documentElement.dataset.theme; if(t) return t==="dark"; try{return matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){return false;}};
function parseC(c){c=String(c||"").trim(); const v=c.match(/^var\((--[\w-]+)/); if(v) c=cssv(v[1],""); let m=c.match(/^#([0-9a-f]{3,8})$/i);
  if(m){let h=m[1]; if(h.length<=4) h=h.split("").map(x=>x+x).join(""); const n=parseInt(h.slice(0,6),16); return [n>>16&255,n>>8&255,n&255,h.length===8?parseInt(h.slice(6),16)/255:1];}
  m=c.match(/^rgba?\(([^)]+)\)/i); if(m){const a=m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return [a[0],a[1],a[2],a[3]==null?1:a[3]];} return null;}
const lin=x=>{x/=255; return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);}; const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
const cratio=(a,b)=>{const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
let BG=[255,255,255], DARK=false; const CC={};
function fixC(c){if(c==null) return c; const k=c+"|"+BG.join(","); if(k in CC) return CC[k]; const p=parseC(c); if(!p) return CC[k]=c; if(p[3]<.35) return CC[k]=c;
  let [r,g,b]=p; const t=DARK?255:0; let i=0; while(cratio([r,g,b],BG)<3&&i<24){r+=(t-r)*.1; g+=(t-g)*.1; b+=(t-b)*.1; i++;}
  return CC[k]=i?`rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+p[3].toFixed(2)})`:(/^var/.test(c)?`rgba(${p[0]},${p[1]},${p[2]},${p[3]})`:c);}
const NARROW=W=>W<480;
// skróty liczb na wąskich ekranach: 81 550 000 → 81,6 mln
function compact(sv){const s0=String(sv); const m=s0.replace(/\u00a0/g," ").match(/^(-?[\d\s.,]+)\s*(zł|%|)?$/); if(!m) return s0; const num=+m[1].replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."); if(!isFinite(num)) return s0;
  const a=Math.abs(num); const u=m[2]?" "+m[2]:""; const f=(x,d)=>(+x.toFixed(d)).toLocaleString("pl-PL",{maximumFractionDigits:d});
  if(a>=1e9) return f(num/1e9,1)+" mld"+u; if(a>=1e6) return f(num/1e6,a>=1e7?0:1)+" mln"+u; if(a>=1e4) return f(num/1e3,0)+" tys."+u; return s0;}
const pv=v=>v==null?null:Array.isArray(v)?v:typeof v==="object"?v:+v;
function col(ds,i,j,kind){let c=kind==="b"?(ds.backgroundColor!=null?ds.backgroundColor:ds.borderColor):(ds.borderColor!=null?ds.borderColor:ds.backgroundColor);
  if(typeof c==="function"){try{c=c({dataIndex:j,datasetIndex:i,raw:(ds.data||[])[j],dataset:ds,type:"data"});}catch(e){c=null;}}
  if(Array.isArray(c)) c=c[j%c.length]; return fixC(c||PALD[i%PALD.length]);}
function tipText(cfg,ds,i,j,label,val){const tp=((cfg.options||{}).plugins||{}).tooltip||{}; const cb=tp.callbacks||{}; const raw=(ds.data||[])[j];
  const ctx={raw,dataIndex:j,datasetIndex:i,dataset:ds,label,formattedValue:Array.isArray(val)?val.map(nfmt).join("–"):nfmt(val),parsed:typeof raw==="object"&&raw&&!Array.isArray(raw)?raw:{x:j,y:val},chart:{data:cfg.data}};
  let s=null; if(cb.label){try{s=cb.label(ctx);}catch(e){}} if(s==null||s==="") s=(ds.label?ds.label+": ":"")+ctx.formattedValue; if(Array.isArray(s)) s=s.join(" · ");
  let t=label; if(cb.title){try{const x=cb.title([ctx]); if(x!=null) t=Array.isArray(x)?x.join(" "):x;}catch(e){}}
  let f=""; if(cb.footer){try{const x=cb.footer([ctx]); if(x) f=Array.isArray(x)?x.join(" "):x;}catch(e){}}
  return [t,s,f].filter(Boolean).map(unl).join("\n");}
function tickFmt(ax,v,idx,labels){const t=(ax&&ax.ticks)||{}; if(t.callback){try{const r=t.callback.call({getLabelForValue:k=>labels?labels[k]:k},v,idx,[]); return r==null?"":unl(r);}catch(e){}} return labels?unl(labels[v]):nfmt(v);}
function trunc(s,px){const m=Math.max(3,Math.floor(px/CW)); return s.length>m?s.slice(0,m-1)+"…":s;}
function el(tag,a,txt){let s="<"+tag; for(const k in a) if(a[k]!=null) s+=" "+k+'="'+esc(a[k])+'"'; return s+(txt!=null?">"+txt+"</"+tag+">":"/>");}
function legendItems(cfg,type){const d=cfg.data||{}; if(/doughnut|pie/.test(type)) {const ds=(d.datasets||[])[0]||{}; return (d.labels||[]).map((l,j)=>({t:unl(l),c:col(ds,0,j,"b"),k:j}));}
  return (d.datasets||[]).map((ds,i)=>[ds,i]).filter(([ds])=>ds.label).map(([ds,i])=>({t:unl(ds.label),c:col(ds,i,0,(ds.type||type)==="line"?"l":"b"),line:(ds.type||type)==="line",k:i}));}
function legend(items,W,y0){let x=8,y=y0,out=""; items.forEach(it=>{const w=Math.min(W-16,14+it.t.length*CW*0.95+14); if(x+w>W-4&&x>8){x=8;y+=18;}
  out+=el("circle",{cx:x+5,cy:y+6,r:4.5,fill:it.c})+el("text",{x:x+14,y:y+10,"font-size":11.5,fill:"var(--text,#1d1d1f)"},esc(trunc(it.t,W-40))); x+=w;}); return {svg:out,h:y-y0+18};}
function legendH(items,W){return legend(items,W,0).h;}
function render(box,cfg,W,H,F){F=F||{}; DARK=isDark(); BG=(parseC(cssv("--card",""))||(DARK?[28,28,30]:[255,255,255])).slice(0,3); const o=cfg.options||{}, d=cfg.data||{}, type=cfg.type||"bar"; const plug=o.plugins||{}; const lg=plug.legend||{}; const NW=NARROW(W);
  const DS=(d.datasets||[]).filter(ds=>!ds.hidden); const labels=(d.labels||[]).map(unl); const text=cssv("--text","#1d1d1f"), muted=cssv("--muted","#5e5e66"), line=cssv("--line","rgba(0,0,0,.1)");
  let svg="", top=6, bottom=H; const showLg=!F.htmlLegend&&lg.display!==false&&!(DS.length<=1&&!/doughnut|pie/.test(type)&&lg.display!==true)&&legendItems(cfg,type).length>0;
  const LI=showLg?legendItems(cfg,type):[]; const lh=showLg?legendH(LI,W):0; const lgBottom=lg.position==="bottom"||/doughnut|pie/.test(type)&&lg.position!=="top";
  if(showLg){if(lgBottom){bottom=H-lh-4;} else {svg+=legend(LI,W,4).svg; top=lh+8;}}
  if(/doughnut|pie/.test(type)){const ds=DS[0]||{data:[]}; const vals=(ds.data||[]).map(v=>Math.max(0,+ptN(v)||0)); const tot=vals.reduce((a,b)=>a+b,0)||1; const cx=W/2, cy=(top+bottom)/2, R=Math.max(10,Math.min(W/2,(bottom-top)/2)-4);
    const cut=type==="pie"?0:(parseFloat(o.cutout||ds.cutout||"50%")/100); let a0=-Math.PI/2;
    vals.forEach((v,j)=>{if(v<=0) return; const a1=a0+2*Math.PI*v/tot; const lg2=a1-a0>Math.PI?1:0; const r0=R*cut; const p=(r,a)=>(cx+r*Math.cos(a)).toFixed(2)+" "+(cy+r*Math.sin(a)).toFixed(2);
      let dd; if(v>=tot*0.9999){dd=`M${p(R,0)} A${R} ${R} 0 1 1 ${p(R,Math.PI)} A${R} ${R} 0 1 1 ${p(R,0)} Z`+(r0?` M${p(r0,0)} A${r0} ${r0} 0 1 0 ${p(r0,Math.PI)} A${r0} ${r0} 0 1 0 ${p(r0,0)} Z`:"");}
      else dd=`M${p(R,a0)} A${R} ${R} 0 ${lg2} 1 ${p(R,a1)} `+(r0?`L${p(r0,a1)} A${r0} ${r0} 0 ${lg2} 0 ${p(r0,a0)} Z`:`L${cx} ${cy} Z`);
      svg+=`<path d="${dd}" fill="${esc(col(ds,0,j,"b"))}" stroke="var(--card,#fff)" stroke-width="1.5" fill-rule="evenodd"><title>${esc(tipText(cfg,ds,0,j,labels[j],vals[j]))} (${nfmt(100*v/tot)}%)</title></path>`; a0=a1;});
    if(showLg&&lgBottom) svg+=legend(LI,W,bottom+4).svg; return wrap(svg,W,H);}
  const S=o.scales||{}; const horiz=o.indexAxis==="y"; const xy=/scatter|bubble/.test(type);
  const catK=horiz?"y":"x", valK=horiz?"x":"y"; const stacked=!!((S[valK]||{}).stacked||(S[catK]||{}).stacked);
  // osie wartości: główna + ew. prawa
  const axOf=ds=>{const id=ds[horiz?"xAxisID":"yAxisID"]||valK; return S[id]&&S[id].position==="right"?id:(id!==valK&&S[id]?id:valK);};
  const AX={}; const add=(id,v)=>{if(v==null||!isFinite(v)) return; const a=AX[id]||(AX[id]={min:Infinity,max:-Infinity}); a.min=Math.min(a.min,v); a.max=Math.max(a.max,v);};
  const n=xy?0:Math.max(labels.length,...DS.map(ds=>(ds.data||[]).length),0);
  let xr=null; if(xy){xr={min:Infinity,max:-Infinity}; DS.forEach(ds=>(ds.data||[]).forEach(p=>{if(p&&p.x!=null&&isFinite(p.x)){xr.min=Math.min(xr.min,+p.x); xr.max=Math.max(xr.max,+p.x);} if(p&&p.y!=null) add("y",+p.y);}));}
  else {const bars=DS.filter(ds=>(ds.type||type)==="bar"); const sumP={},sumN={};
    DS.forEach(ds=>{const id=axOf(ds); const isBar=(ds.type||type)==="bar"; (ds.data||[]).forEach((v,j)=>{v=pv(v); if(v==null) return; if(Array.isArray(v)){add(id,+v[0]); add(id,+v[1]); return;} if(typeof v==="object") v=+(v[valK]!=null?v[valK]:v.y); if(!isFinite(v)) return;
      if(stacked&&isBar){const k=id+"|"+j; if(v>=0){sumP[k]=(sumP[k]||0)+v; add(id,sumP[k]);} else {sumN[k]=(sumN[k]||0)+v; add(id,sumN[k]);}} else add(id,v);});});
    bars.length&&Object.keys(AX).forEach(id=>{add(id,0);});}
  const scaleFor=id=>{const ax=S[id]||{}; const a=AX[id]||{min:0,max:1}; let mn=ax.min!=null?+ax.min:a.min, mx=ax.max!=null?+ax.max:a.max; if(ax.suggestedMax!=null) mx=Math.max(mx,+ax.suggestedMax); if(ax.suggestedMin!=null) mn=Math.min(mn,+ax.suggestedMin);
    if(ax.beginAtZero&&mn>0) mn=0; if(!isFinite(mn)) mn=0; if(!isFinite(mx)) mx=mn+1; if(ax.type==="logarithmic") return Object.assign(logT(mn>0?mn:1,mx),{log:1,ax});
    const r=nice(mn,mx,NW?(horiz||id==="x"?3:4):5); if(ax.min!=null) r.min=+ax.min; if(ax.max!=null) r.max=+ax.max; r.ticks=r.ticks.filter(t=>t>=r.min-1e-9&&t<=r.max+1e-9); r.ax=ax; return r;};
  const SC={}; Object.keys(AX).forEach(id=>SC[id]=scaleFor(id)); if(!SC[valK]) SC[valK]=scaleFor(valK); let XS=null; if(xy){AX.x=xr; XS=scaleFor("x");}
  const rightId=Object.keys(SC).find(id=>id!==valK&&(S[id]||{}).position==="right"&&!horiz);
  const fmtV=(id,v)=>{const r=tickFmt(S[id],v,0,null); return NW?compact(r):r;};
  // marginesy
  const valLabW=id=>Math.max(...SC[id].ticks.map(t=>fmtV(id,t).length),1)*CW+8;
  const ttl=ax=>ax&&ax.title&&ax.title.display&&ax.title.text?unl(ax.title.text):"";
  let L=8,R=8,B=bottom,T=top+4; let rot=false, step=1, catLab=[];
  if(horiz){catLab=labels.map((l,j)=>tickFmt(S.y,j,j,labels)); const want=Math.max(...catLab.map(s=>s.length),1)*CW+10; L=Math.min(Math.max(60,want),W*0.42); B=bottom-20-(ttl(S.x)?16:0);}
  else {L=(xy?valLabW("y"):valLabW(valK))+(ttl(S[valK])?16:0); if(rightId) R=valLabW(rightId)+(ttl(S[rightId])?16:0);
    if(!xy){catLab=labels.map((l,j)=>tickFmt(S.x,j,j,labels)); const band=(W-L-R)/Math.max(n,1); const mw=Math.max(...catLab.map(s=>s.length),1)*CW;
      if(mw>band*0.95){if(n>4){rot=true; step=Math.max(1,Math.ceil((NW?24:15)/band));} else step=1;} B=bottom-(rot?Math.min(NW?72:90,Math.min(mw,NW?84:110)*0.72+12):20)-(ttl(S.x)?16:0);}
    else B=bottom-20-(ttl(S.x)?16:0);}
  const PW=Math.max(20,W-L-R), PH=Math.max(20,B-T);
  const vpos=(sc,v)=>{if(sc.log){const a=Math.log10(sc.min),b=Math.log10(sc.max); const t=(Math.log10(Math.max(v,sc.min))-a)/((b-a)||1); return t;} return (v-sc.min)/((sc.max-sc.min)||1);};
  const VY=(id,v)=>horiz?L+vpos(SC[id]||SC[valK],v)*PW:B-vpos(SC[id]||SC[valK],v)*PH;
  // siatka + etykiety osi wartości
  const g=[]; const vs=SC[valK];
  if(xy){SC.y.ticks.forEach(t=>{const y=B-vpos(SC.y,t)*PH; g.push(el("line",{x1:L,x2:L+PW,y1:y.toFixed(1),y2:y.toFixed(1),stroke:line}),el("text",{x:L-6,y:(y+4).toFixed(1),"text-anchor":"end"},esc(fmtV("y",t))));});
    XS.ticks.forEach(t=>{const x=L+vpos(XS,t)*PW; g.push(el("line",{x1:x.toFixed(1),x2:x.toFixed(1),y1:T,y2:B,stroke:line}),el("text",{x:x.toFixed(1),y:B+15,"text-anchor":"middle"},esc(fmtV("x",t))));});}
  else if(horiz){vs.ticks.forEach(t=>{const x=L+vpos(vs,t)*PW; g.push(el("line",{x1:x.toFixed(1),x2:x.toFixed(1),y1:T,y2:B,stroke:line}),el("text",{x:x.toFixed(1),y:B+15,"text-anchor":"middle"},esc(fmtV("x",t))));});}
  else {vs.ticks.forEach(t=>{const y=B-vpos(vs,t)*PH; g.push(el("line",{x1:L,x2:L+PW,y1:y.toFixed(1),y2:y.toFixed(1),stroke:line}),el("text",{x:L-6,y:(y+4).toFixed(1),"text-anchor":"end"},esc(fmtV(valK,t))));});
    if(rightId) SC[rightId].ticks.forEach(t=>{const y=B-vpos(SC[rightId],t)*PH; g.push(el("text",{x:L+PW+6,y:(y+4).toFixed(1),"text-anchor":"start"},esc(fmtV(rightId,t))));});}
  // tytuły osi
  const tx=ttl(horiz||xy?S.x:S.x), ty=ttl(horiz?S.y:S[valK]);
  if(tx&&(xy||horiz||!rot||true)) g.push(el("text",{x:L+PW/2,y:bottom-4,"text-anchor":"middle"},esc(trunc(tx,PW))));
  if(ty&&!horiz) g.push(el("text",{transform:`translate(12 ${T+PH/2}) rotate(-90)`,"text-anchor":"middle"},esc(trunc(ty,PH))));
  if(rightId&&ttl(S[rightId])) g.push(el("text",{transform:`translate(${W-6} ${T+PH/2}) rotate(90)`,"text-anchor":"middle"},esc(trunc(ttl(S[rightId]),PH))));
  // etykiety kategorii
  if(!xy){const band=(horiz?PH:PW)/Math.max(n,1);
    if(horiz){const st=Math.max(1,Math.ceil(13/band)); catLab.forEach((s,j)=>{if(j%st) return; const y=T+band*(j+.5); g.push(el("text",{x:L-6,y:(y+4).toFixed(1),"text-anchor":"end"},esc(trunc(s,L-10))+"<title>"+esc(labels[j])+"</title>"));});}
    else catLab.forEach((s,j)=>{if(j%step) return; const x=L+band*(j+.5); if(rot) g.push(el("text",{transform:`translate(${x.toFixed(1)} ${B+10}) rotate(-40)`,"text-anchor":"end"},esc(trunc(s,NW?84:110))+"<title>"+esc(labels[j])+"</title>")); else g.push(el("text",{x:x.toFixed(1),y:B+15,"text-anchor":"middle"},esc(trunc(s,band*1.05))+"<title>"+esc(labels[j])+"</title>"));});}
  svg+=`<g font-size="11.5" fill="${esc(muted)}">${g.join("")}</g>`;
  // dane
  const band=(horiz?PH:PW)/Math.max(n,1); const barDS=DS.map((ds,i)=>[ds,i]).filter(([ds])=>(ds.type||type)==="bar"); const groups=stacked?1:Math.max(1,barDS.length);
  const bw=Math.max(1,band*0.8/groups); const accP={},accN={}; let body="";
  barDS.forEach(([ds,i],gi)=>{const id=axOf(ds); (ds.data||[]).forEach((v0,j)=>{let v=pv(v0); if(v==null) return; let a,b; if(Array.isArray(v)){a=+v[0];b=+v[1];} else {if(typeof v==="object") v=+(v[valK]!=null?v[valK]:v.y); if(!isFinite(v)) return;
      if(stacked){const k=id+"|"+j; if(v>=0){a=accP[k]||0; b=a+v; accP[k]=b;} else {a=accN[k]||0; b=a+v; accN[k]=b;}} else {a=0;b=v;}}
    if(!isFinite(a)||!isFinite(b)) return; const off=stacked?band*0.1:band*0.1+gi*bw; const c0=(horiz?T:L)+band*j+off; const p1=VY(id,a), p2=VY(id,b); const lo=Math.min(p1,p2), len=Math.max(Math.abs(p2-p1),v===0?0:1);
    const tip=esc(tipText(cfg,ds,i,j,labels[j],Array.isArray(v)?v:b-a)); const fill=esc(col(ds,i,j,"b")); const rr=Math.min(3,bw/3,len/2);
    body+=horiz?`<rect x="${lo.toFixed(1)}" y="${c0.toFixed(1)}" width="${len.toFixed(1)}" height="${(bw*0.98).toFixed(1)}" rx="${rr.toFixed(1)}" fill="${fill}"><title>${tip}</title></rect>`
      :`<rect x="${c0.toFixed(1)}" y="${lo.toFixed(1)}" width="${(bw*0.98).toFixed(1)}" height="${len.toFixed(1)}" rx="${rr.toFixed(1)}" fill="${fill}"><title>${tip}</title></rect>`;});});
  DS.forEach((ds,i)=>{const t=ds.type||type; if(t!=="line"&&t!=="scatter"&&t!=="bubble") return; const c=col(ds,i,0,t==="line"?"l":"b");
    if(t==="line"&&!xy){const id=axOf(ds); let path="",pen=false; const pts=[]; (ds.data||[]).forEach((v0,j)=>{let v=pv(v0); if(v!=null&&typeof v==="object"&&!Array.isArray(v)) v=+v.y; if(v==null||!isFinite(v)){if(!ds.spanGaps) pen=false; return;}
        const x=(horiz?0:L+band*(j+.5)), y=VY(id,v); path+=(pen?"L":"M")+x.toFixed(1)+" "+y.toFixed(1); pen=true; pts.push([x,y,j,v]);});
      const dash=Array.isArray(ds.borderDash)&&ds.borderDash.length?ds.borderDash.join(" "):null; const w=ds.borderWidth!=null?ds.borderWidth:2.2;
      if(ds.fill&&pts.length>1){const y0=B; body+=`<path d="M${pts[0][0].toFixed(1)} ${y0} ${pts.map(p=>"L"+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ")} L${pts[pts.length-1][0].toFixed(1)} ${y0} Z" fill="${esc(c)}" opacity=".15"/>`;}
      body+=`<path d="${path}" fill="none" stroke="${esc(c)}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:""}/>`;
      const pr=ds.pointRadius!=null?ds.pointRadius:(pts.length>40?0:3); pts.forEach(([x,y,j,v])=>{body+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(pr,pts.length===1?3:0)||0.01}" fill="${esc(c)}"><title>${esc(tipText(cfg,ds,i,j,labels[j],v))}</title></circle>`+(pr<2||NW?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${NW?14:6}" fill="transparent"><title>${esc(tipText(cfg,ds,i,j,labels[j],v))}</title></circle>`:"");});}
    else if(xy){(ds.data||[]).forEach((p,j)=>{if(!p||p.x==null||p.y==null) return; const x=L+vpos(XS,+p.x)*PW, y=B-vpos(SC.y,+p.y)*PH; const r=p.r!=null?Math.max(2,+p.r):(ds.pointRadius!=null?ds.pointRadius:4);
      body+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${esc(col(ds,i,j,"b"))}"><title>${esc(tipText(cfg,ds,i,j,"",p.y))}</title></circle>`;});}});
  svg+=`<g clip-path="none">${body}</g>`+el("line",{x1:L,x2:L+(horiz||xy?PW:PW),y1:B,y2:B,stroke:muted,"stroke-opacity":.35});
  if(showLg&&lgBottom) svg+=legend(LI,W,bottom+2).svg;
  return wrap(svg,W,H);}
const ptN=v=>v==null?null:Array.isArray(v)?v[v.length-1]:typeof v==="object"?(v.y!=null?v.y:v.r):v;
function wrap(inner,W,H){return `<svg xmlns="${NS}" class="svgc" role="img" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="var(--font,system-ui)" style="display:block;width:100%;height:${H}px;overflow:visible">${inner}</svg>`;}
// konfiguracja z ukrytymi seriami (legenda = przełącznik) i ew. automatycznym obrotem do słupków poziomych na wąskim ekranie
function variant(cfg,hid,W){const type=cfg.type||"bar"; const d=cfg.data||{}; const pie=/doughnut|pie/.test(type);
  const DS=(d.datasets||[]).map((ds,i)=>{const c={...ds}; if(c.backgroundColor==null&&c.borderColor==null){c.backgroundColor=PALD[i%PALD.length]; c.borderColor=PALD[i%PALD.length];}
    if(pie){if(hid.size) c.data=(ds.data||[]).map((v,j)=>hid.has(j)?0:v);} else if(hid.has(i)) c.hidden=true; return c;});
  let o=cfg.options||{}; let flip=false;
  if(NARROW(W)&&type==="bar"&&o.indexAxis!=="y"&&DS.every(ds=>!ds.type||ds.type==="bar")){const S=o.scales||{}; const labs=(d.labels||[]).map(unl); const n=labs.length;
    const mw=Math.max(0,...labs.map(s=>s.length))*CW; const band=(W-60)/Math.max(n,1); if(n>=3&&n<=30&&mw>band*0.95&&mw>40){flip=true; const sc={...S}; sc.x=S.y||{}; sc.y=S.x||{}; o={...o,indexAxis:"y",scales:sc};}}
  return {cfg:{...cfg,options:o,data:{...d,datasets:DS}},flip,n:(d.labels||[]).length};}
function legendHTML(cfg,hid,box){const type=cfg.type||"bar"; const o=cfg.options||{}; const lg=(o.plugins||{}).legend||{}; const DS=(cfg.data||{}).datasets||[];
  const show=lg.display!==false&&!(DS.length<=1&&!/doughnut|pie/.test(type)&&lg.display!==true); if(!show) return ""; DARK=isDark(); BG=(parseC(cssv("--card",""))||(DARK?[28,28,30]:[255,255,255])).slice(0,3);
  const LI=legendItems(cfg,type); if(!LI.length) return "";
  return `<div class="svglg" role="group" aria-label="Legenda – kliknij, aby ukryć/pokazać serię">${LI.map(it=>`<button type="button" class="svglgb${hid.has(it.k)?" off":""}" data-k="${it.k}" aria-pressed="${hid.has(it.k)?"false":"true"}" title="${esc(it.t)} – ${hid.has(it.k)?"pokaż":"ukryj"}"><i style="background:${esc(it.c)}${it.line?";height:3px;border-radius:2px":""}"></i>${esc(it.t)}</button>`).join("")}</div>`;}
const REG=new Set();
function draw(target,cfg){const box=target.closest?(target.closest(".chartbox")||target.parentElement):target; if(!box) return null; const id=target.id;
  if(box.__svcfg!==cfg){box.__hid=new Set(); box.__svcfg=cfg;} if(box.__h0==null) box.__h0=box.style.height||"";
  const go=()=>{if(box.__drawn&&!document.body.contains(box)){REG.delete(go); return true;} const hid=box.__hid||new Set(); const W=Math.round(box.clientWidth||box.getBoundingClientRect().width||600);
    const V=variant(cfg,hid,W); box.style.height=box.__h0; const vo=V.cfg.options||{}; if(V.cfg.type==="bar"&&vo.indexAxis==="y"&&V.n){const nd=(V.cfg.data.datasets||[]).filter(ds=>!ds.hidden&&!(vo.scales&&vo.scales.y&&vo.scales.y.stacked)).length||1; const need=V.n*(nd>1?14+nd*7:22)+70; if((box.clientHeight||0)<need) box.style.height=Math.min(need,1400)+"px";}
    let H=Math.round(box.clientHeight||0); if(H<60){const ar=(cfg.options||{}).aspectRatio||(/doughnut|pie/.test(cfg.type)?1:2); H=Math.round(Math.min(420,W/ar));}
    let host=box.querySelector(":scope > .svgwrap"); if(!host){host=document.createElement("div"); host.className="svgwrap"; host.dataset.chart="1"; if(id) host.dataset.id=id; box.appendChild(host);}
    const lgh=legendHTML(V.cfg,hid,box); host.innerHTML=lgh; const lh=lgh?(host.firstChild.offsetHeight||0):0; if(lh&&H-lh<180){box.style.height=(lh+180)+"px"; H=lh+180;}
    let html; try{html=render(box,V.cfg,Math.max(W,120),Math.max(H-lh,120),{htmlLegend:1});}catch(e){console.error("svgchart",id,e); return false;}
    host.insertAdjacentHTML("beforeend",html); host.__w=W; host.__go=go; box.__drawn=1; host.classList.toggle("flip",V.flip);
    if(lgh) host.querySelectorAll(".svglgb").forEach(b=>b.onclick=ev=>{ev.stopPropagation(); const k=+b.dataset.k; if(hid.has(k)) hid.delete(k); else hid.add(k); box.__hid=hid; go();});
    return true;};
  REG.add(go);
  target.style && target.tagName==="CANVAS" && (target.style.display="none");
  const ok=go(); if(ok===false) return false;
  if(window.ResizeObserver&&!box.__svro){let t=null; box.__svro=new ResizeObserver(()=>{clearTimeout(t); t=setTimeout(()=>{const host=box.querySelector(":scope > .svgwrap"); if(host&&Math.abs((box.clientWidth||0)-(host.__w||0))>4&&document.body.contains(box)) go();},120);}); box.__svro.observe(box);}
  return true;}
// R6e: dotknij, aby zobaczyć wartość (tooltip HTML, także na telefonie; najbliższy element w promieniu 28 px)
function tipAt(ev){const host=ev.target.closest&&ev.target.closest(".svgwrap"); document.querySelectorAll(".svgtip").forEach(t=>{if(!host||t.parentElement!==host) t.remove();}); if(!host||ev.target.closest(".svglg")) return;
  const svg=host.querySelector("svg"); if(!svg) return; let el=ev.target; let tt=el&&el.querySelector&&el.querySelector(":scope > title");
  if(!tt){let best=null,bd=28; svg.querySelectorAll("rect,circle,path").forEach(e=>{const t=e.querySelector(":scope > title"); if(!t) return; const r=e.getBoundingClientRect(); const dx=Math.max(r.left-ev.clientX,0,ev.clientX-r.right), dy=Math.max(r.top-ev.clientY,0,ev.clientY-r.bottom); const dd=Math.hypot(dx,dy); if(dd<bd){bd=dd; best=t;}}); tt=best;}
  let tip=host.querySelector(".svgtip"); if(!tt){tip&&tip.remove(); return;} if(!tip){tip=document.createElement("div"); tip.className="svgtip"; tip.setAttribute("role","status"); host.appendChild(tip);}
  tip.textContent=tt.textContent; const hr=host.getBoundingClientRect(); const x=ev.clientX-hr.left, y=ev.clientY-hr.top; tip.style.left="0px"; tip.style.top="0px";
  const tw=tip.offsetWidth, th=tip.offsetHeight; tip.style.left=Math.max(0,Math.min(hr.width-tw,x-tw/2))+"px"; tip.style.top=(y-th-12<0?y+16:y-th-12)+"px";}
if(!window.__svtip){window.__svtip=1; document.addEventListener("click",tipAt,true); document.addEventListener("keydown",e=>{if(e.key==="Escape") document.querySelectorAll(".svgtip").forEach(t=>t.remove());});
  // przełączenie motywu (przycisk / ?theme= / systemowy) → przerysowanie wszystkich wykresów
  const redraw=()=>{Object.keys(CC).forEach(k=>delete CC[k]); REG.forEach(g=>{try{g();}catch(e){}});};
  try{new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]}); matchMedia("(prefers-color-scheme: dark)").addEventListener("change",redraw);}catch(e){}}
window.SVGC={draw,render,compact,fixC:c=>fixC(c),_reg:REG};
})();
