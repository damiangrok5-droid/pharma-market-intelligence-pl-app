/* Pharma Market Intelligence PL – offline, dane z window.DATA (data/data.js, eksport z data/baza projektu) */
(function(){
"use strict";
const D=window.DATA; const $=s=>document.querySelector(s);
const TODAY=new Date().toISOString().slice(0,10);
const PROV=D.provinces; const M=D.molecules;
const NFZ_SRC="NFZ – Statystyka programów lekowych (api.nfz.gov.pl/app-stat-api-pl)";
const NFZ_RA="NFZ – Statystyka refundacji aptecznej (api.nfz.gov.pl/app-stat-api-ra)";
const annBy={}; D.meta.announcements.forEach(a=>annBy[a.announcement_date]=a);
const LASTANN=D.meta.last_announcement;
// hydratacja słownikowa: D.mz.g = GTIN → [marka, nazwa, opakowanie, substancja, firma]; D.mz.txt = teksty wskazań/programów
{const G=D.mz.g, T=D.mz.txt; const hy=r=>{const g=G[r.gtin]||[]; r.brand=g[0]||null; r.name=g[1]||null; r.pack=g[2]||null; r.substance=g[3]||null; r.c=g[4]||null; return r;};
 D.mz.current.forEach(r=>{hy(r); r.indications=r.ii!=null?T[r.ii]:null; r.offlabel=r.oi!=null?T[r.oi]:null;});
 D.mz.events.forEach(e=>{hy(e); e.announcement_date=e.a;});
 D.mz.first_last.forEach(hy);}
// historia cen/limitów/dopłat – plik ładowany na żądanie (data/data_mz_hist.js lub blok wbudowany w wersji jednoplikowej)
function lazyHist(cb){ if(window.DATA_MZH) return cb(window.DATA_MZH); if(document.readyState==="loading") return document.addEventListener("DOMContentLoaded",()=>lazyHist(cb),{once:true}); const inl=document.getElementById("lazy-data_mz_hist"); const s=document.createElement("script");
  if(inl){s.text=inl.textContent; document.head.appendChild(s); return cb(window.DATA_MZH||null);} s.src=D.mz.lazy_history+(window.BUILDV?"?v="+window.BUILDV:""); s.onload=()=>cb(window.DATA_MZH||null); s.onerror=()=>cb(null); document.head.appendChild(s);}
const MZRX={secukinumab:/se[ck]ukinumab/i,lcig:/levodop/i,foslevodopa:/foslevod/i,apomorphine:/apomorph/i,bont_a100:/botulin/i,bont_a100_2:/botulin/i,bont_a300:/botulin/i,bont_a500:/botulin/i,glecaprevir:/glecaprev/i,sof_vel:/velpatas/i,sof_vel_vox:/voxilap/i,led_sof:/ledipas/i,elb_gzr:/elbasvir/i,dexamethasone:/dexameth/i};
const mzrx=k=>MZRX[k]||new RegExp(k.slice(0,6),"i");
// ---------- formatowanie ----------
const nf=(v,d=0)=>v&&v.lt5?"<5":v==null||isNaN(v)?null:Number(v).toLocaleString("pl-PL",{minimumFractionDigits:d,maximumFractionDigits:d});
const pln=v=>v==null?null:(Math.abs(v)>=1e6?nf(v/1e6,2)+" mln zł":nf(v,2)+" zł");
const pct=v=>v==null||!isFinite(v)?null:(v>0?"+":v<0?"−":"")+nf(Math.abs(v)*100,1)+"%";
const esc=s=>s==null?"":String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ND='<span class="nd" title="Brak danych w pobranych źródłach – patrz Źródła i luki">brak danych</span>';
const V=(txt,src,date,url)=>txt==null?ND:`<span title="${esc("Źródło: "+src+(date?" · pobrano "+date:"")+(url?" · "+url:""))}">${txt}</span>`;
const S=(src,url,date)=>`<div class="src">Źródło: ${url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(src)}</a>`:esc(src)}${date?" · pobrano "+esc(date):""}</div>`;
const nfzUrl=k=>M[k]&&M[k].source_urls[0];
const annLink=d=>annBy[d]?`<a href="${esc(annBy[d].page||annBy[d].url)}" target="_blank" title="Obwieszczenie MZ – pobrano ${esc(annBy[d].retrieved)}">${d}</a>`:d;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const PAL=["#0a84ff","#ff9f0a","#30d158","#bf5af2","#ff375f","#64d2ff","#ffd60a","#5e5ce6","#ac8e68","#ff6482","#32ade6","#8e8e93","#a2845e","#66d4cf","#da8fff","#ffb340","#7d7aff","#4cd964","#ff2d55","#5ac8fa","#c69c6d","#34c759","#af52de"];
// ---------- tabele z sortowaniem + CSV ----------
let TID=0;
function table(cols,rows,o={}){
  const id="t"+(++TID); const st={rows,sort:null,dir:1,q:"",lim:window.innerWidth<=600?Math.min(25,o.limit||25):(o.limit||1500),pg:0};
  // QA-22: na telefonie (≤600 px) tabele są stronicowane po 5 wierszy (wiersze to karty) – krótsze strony, CSV nadal zawiera wszystko
  const MOB=window.innerWidth<=600, PER=5;
  setTimeout(()=>{
    const el=document.getElementById(id); if(!el) return;
    const draw=()=>{
      let r=st.rows; if(st.q){const N=z=>String(z??"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l"); const qs=N(st.q).split(/[\s,]+/).filter(Boolean); r=r.filter(x=>{const hay=cols.map(c=>N(c.v?c.v(x):x[c.k])).join(" | "); return qs.every(q=>hay.includes(q));});}
      // R6: wiersz wybranej firmy – wyróżniony i przypięty na 1. stronie (bez aktywnego sortowania)
      const CO=window.R1&&window.R1.CF&&window.R1.CF(); const ci=CO?cols.findIndex(c=>/^(Firma|Grupa|Podmiot|Wykonawca|Firma \(grupa\))/i.test(c.h||"")):-1; const isMe0=x=>ci>=0&&String(cols[ci].v?cols[ci].v(x):x[cols[ci].k]??"").replace(/<[^>]+>/g,"").trim()===CO; const isMe=(ci>=0&&!st.rows.every(isMe0))?isMe0:()=>false;
      if(MOB&&ci>=0&&st.sort==null&&!st.q){const me=r.filter(isMe); if(me.length&&r.indexOf(me[0])>=PER){r=[...me,...r.filter(x=>!isMe(x))]; st.pinned=true;}}
      if(st.sort!=null){const c=cols[st.sort]; const g=x=>c.v?c.v(x):x[c.k]; r=[...r].sort((a,b)=>{const A=g(a),B=g(b); if(A==null)return 1; if(B==null)return -1; return (typeof A=="number"&&typeof B=="number"?A-B:String(A).localeCompare(String(B),"pl"))*st.dir;});}
      const lim=st.lim; const npg=Math.max(1,Math.ceil(r.length/PER)); if(st.pg>=npg) st.pg=npg-1;
      const vis=MOB?r.slice(st.pg*PER,st.pg*PER+PER):r.slice(0,lim);
      el.querySelector("tbody").innerHTML=vis.map(x=>`<tr class="${o.rowClass?o.rowClass(x):""}${isMe(x)?" me":""}">${cols.map(c=>`<td class="${c.n?"n":""}">${c.f?c.f(x):(()=>{const v=c.v?c.v(x):x[c.k]; return v==null||v===""?(c.empty??ND):esc(typeof v==="number"?nf(v):v);})()}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${cols.length}" class="nd">brak danych</td></tr>`;
      const pgr=el.querySelector(".pgr"); if(pgr){pgr.hidden=!MOB||npg<2; pgr.style.display=MOB&&npg>1?"":"none"; pgr.querySelector(".pi").textContent=`${st.pg+1} / ${npg}`; pgr.querySelector(".pp").disabled=st.pg<=0; pgr.querySelector(".pn").disabled=st.pg>=npg-1;}
      if(MOB){el.querySelector(".cnt").textContent=`${nf(r.length)} wierszy`+(npg>1?` · strona ${st.pg+1}/${npg}`:"");} else
      el.querySelector(".cnt").textContent=r.length>lim?`${nf(r.length)} wierszy (pokazano ${nf(lim)}; CSV zawiera wszystkie)`:`${nf(r.length)} wierszy`;
      const mb=el.querySelector(".more"); if(mb&&MOB){mb.hidden=true; mb.style.display="none";} else if(mb){const left=Math.max(0,r.length-lim); mb.hidden=!left; mb.style.display=left?"":"none"; mb.textContent=`Pokaż więcej (${nf(Math.min(left,lim<100?100:500))})`;}
      st.cur=r;
    };
    const mb=el.querySelector(".more"); if(mb) mb.onclick=()=>{st.lim+=st.lim<100?100:500; draw();};
    const pgr=el.querySelector(".pgr"); if(pgr){pgr.querySelector(".pp").onclick=()=>{st.pg--; draw();}; pgr.querySelector(".pn").onclick=()=>{st.pg++; draw();};}
    el.querySelectorAll("th").forEach((th,i)=>th.onclick=()=>{st.dir=st.sort===i?-st.dir:1; st.sort=i; st.pg=0; draw();});
    const qi=el.querySelector("input"); if(qi) qi.oninput=()=>{st.q=qi.value; st.pg=0; draw();};
    el.querySelector(".csv").onclick=()=>{
      const vv=(c,x)=>{const v=c.v?c.v(x):x[c.k]; return v==null?"":String(v);};
      const lines=[cols.map(c=>c.h).concat(o.csvExtra?o.csvExtra.map(e=>e.h):[]).join(";")].concat(st.cur.map(x=>cols.map(c=>vv(c,x)).concat(o.csvExtra?o.csvExtra.map(e=>e.v(x)):[]).map(s=>'"'+String(s??"").replace(/"/g,'""')+'"').join(";")));
      const b=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=(o.name||"tabela")+".csv"; document.body.appendChild(a); a.click(); a.remove();
    };
    draw();
  });
  return `<div id="${id}"><div class="tbar">${o.search===false||!(rows&&rows.length)?"":'<input type="search" placeholder="Szukaj…">'}<span class="muted cnt"></span><span class="grow"></span><button class="btn sm ghost csv">Eksport CSV</button></div>
  <div class="tablewrap"><table><thead><tr>${cols.map(c=>`<th class="${c.n?"n":""}" title="${esc(c.t||"Sortuj")}">${esc(c.h)}</th>`).join("")}</tr></thead><tbody></tbody></table></div><button class="btn sm ghost more" hidden></button><div class="pgr" hidden style="display:none;margin:6px 0;gap:8px;align-items:center"><button class="btn sm ghost pp" aria-label="Poprzednia strona">‹ Poprz.</button> <span class="muted pi"></span> <button class="btn sm ghost pn" aria-label="Następna strona">Nast. ›</button></div>${o.src||""}</div>`;
}
// ---------- wykresy ----------
let CH=[];
function themeCharts(){Chart.defaults.color=css("--muted"); Chart.defaults.borderColor=css("--line"); Chart.defaults.font.family=css("--font"); Chart.defaults.font.size=12;
  const tp=Chart.defaults.plugins.tooltip; tp.backgroundColor=css("--bar")||"rgba(30,30,30,.9)"; tp.titleColor=css("--text"); tp.bodyColor=css("--text"); tp.footerColor=css("--muted"); tp.borderColor=css("--sep"); tp.borderWidth=.5; tp.cornerRadius=10; tp.padding=10; tp.boxPadding=4;
  Chart.defaults.plugins.legend.labels.usePointStyle=true; Chart.defaults.plugins.legend.labels.pointStyle="circle"; Chart.defaults.elements.bar.borderRadius=4; Chart.defaults.elements.line.borderWidth=2.2; Chart.defaults.animation={duration:500,easing:"easeOutQuart"};}
const IO="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){IO.unobserve(e.target); const f=e.target.__mk; if(f){e.target.__mk=null; f();}}}),{rootMargin:"200px"}):null;
// R6: odporne rysowanie wykresów – Chart.js może nie załadować się (proxy/antywirus w sieci firmowej, stara pamięć podręczna):
// wtedy w miejscu wykresu pokazujemy tabelę z tymi samymi danymi; wykres tworzony dopiero, gdy kontener ma wymiary (ResizeObserver);
// błąd jednego wykresu nie psuje pozostałych; pusty zbiór danych = komunikat „brak danych”, a nie pusta ramka.
const RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const unEnt=x=>typeof x==="string"?x.replace(/<[^>]+>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&"):x;
const ptV=v=>v==null?null:Array.isArray(v)?(v.length&&v[v.length-1]!=null?(typeof v[v.length-1]==="string"?Date.parse(v[v.length-1]):+v[v.length-1]):null):typeof v==="object"?(v.y!=null?v.y:v.r!=null?v.r:v.x!=null?v.x:null):v;
function chartHasData(cfg){const line=/line|scatter|bubble|radar/.test(cfg.type||"")||((cfg.data||{}).datasets||[]).some(ds=>ds.type==="line"); return ((cfg.data||{}).datasets||[]).some(ds=>(ds.data||[]).some(v=>{const n=ptV(v); return n!=null&&isFinite(+n)&&(line||+n!==0);}));}
function chartAllZero(cfg){return ((cfg.data||{}).datasets||[]).some(ds=>(ds.data||[]).some(v=>{const n=ptV(v); return n!=null&&isFinite(+n);}));}
function chartFallback(c,cfg,why){const box=c.closest(".chartbox")||c.parentElement; if(!box) return; const d=cfg.data||{}; const L=(d.labels||[]).map(l=>Array.isArray(l)?l.join(" "):unEnt(String(l))); const DS=(d.datasets||[]);
  const f=v=>{if(v==null) return "–"; if(typeof v==="object") return [v.x,v.y,v.r].filter(z=>z!=null).map(z=>typeof z==="number"?nf(z,2):esc(String(z))).join(" · "); return typeof v==="number"?nf(v,2):esc(String(v));};
  const n=Math.max(L.length,...DS.map(ds=>(ds.data||[]).length),0);
  const rows=Array.from({length:Math.min(n,60)},(_,i)=>`<tr><td>${esc(L[i]!=null?L[i]:(DS[0]&&DS[0].data&&DS[0].data[i]&&DS[0].data[i].label)||String(i+1))}</td>${DS.map(ds=>`<td class="n">${f((ds.data||[])[i])}</td>`).join("")}</tr>`).join("");
  box.classList.add("chartfb"); box.innerHTML=`<p class="muted" style="margin:0 0 6px">${esc(why)} – te same dane w tabeli:</p><div class="fbwrap"><table class="bt"><thead><tr><th></th>${DS.map(ds=>`<th class="n">${esc(unEnt(String(ds.label||"wartość")))}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;}
function chartEmpty(c,zero){const box=c.closest(".chartbox")||c.parentElement; if(!box) return; box.classList.add("chartfb","chartnd"); box.innerHTML=`<p class="nd">${zero?"wszystkie wartości = 0 dla wybranej firmy / okresu":"brak danych dla wybranej firmy / okresu"}</p>`;}
function prepCfg(cfg){const d=cfg.data||{}; if(d.labels) d.labels=d.labels.map(unEnt); (d.datasets||[]).forEach(ds=>{if(ds.label) ds.label=unEnt(ds.label);});
  const o=cfg.options||(cfg.options={}); if(RM) o.animation=false; const sc=o.scales; const cat=o.indexAxis==="y"?"y":"x";
  if(sc!==undefined||["bar","line"].includes(cfg.type)){const S=o.scales||(o.scales={}); const ax=S[cat]||(S[cat]={}); const t=ax.ticks||(ax.ticks={}); const lim=cat==="y"?30:24;
    if(!t.callback&&ax.type!=="time"&&ax.type!=="linear"&&ax.type!=="logarithmic") t.callback=function(v){const l=this.getLabelForValue?this.getLabelForValue(v):v; const s=Array.isArray(l)?l.join(" "):String(l); return s.length>lim?s.slice(0,lim-1)+"…":s;};}
  return cfg;}
function chart(id,cfg){setTimeout(()=>{const c=document.getElementById(id); if(!c)return; c.dataset.chart="1";
  if(!chartHasData(cfg)){chartEmpty(c,chartAllZero(cfg)); return;}
  // R6b: wszystkie wykresy jako SVG (bez canvas/animacji/rAF – działa przy zablokowanym GPU/canvas i w kartach w tle)
  if(window.SVGC){const p=prepCfg(cfg); let ok=false; try{ok=SVGC.draw(c,p);}catch(e){console.error("wykres",id,e);} if(ok===false) chartFallback(c,cfg,"Wykres nie mógł zostać narysowany"); return;}
  if(!window.Chart){chartFallback(c,cfg,"Wykres niedostępny w tej przeglądarce"); return;}
  const mk=()=>{c.__mk=null; if(!document.body.contains(c)||Chart.getChart(c))return; const box=c.parentElement; const r=box.getBoundingClientRect();
    if((r.width<20||r.height<20)&&window.ResizeObserver&&!c.__ro){c.__ro=new ResizeObserver(()=>{const q=box.getBoundingClientRect(); if(q.width>=20&&q.height>=20){c.__ro.disconnect(); mk();}}); c.__ro.observe(box); return;}
    try{themeCharts(); const ch=new Chart(c,prepCfg(cfg)); CH.push(ch);
      setTimeout(()=>{try{if(document.body.contains(c)&&Chart.getChart(c)===ch&&(!c.width||!c.height||!c.offsetHeight)) ch.resize();}catch(e){}},700);}
    catch(e){console.error("wykres",id,e); try{const o=Chart.getChart(c); if(o) o.destroy();}catch(_){} chartFallback(c,cfg,"Wykres nie mógł zostać narysowany");}};
  if(IO){c.__mk=mk; IO.observe(c); lazyCheck();} else mk();});}
// zapas dla IntersectionObserver (nie zawsze odpala po zmianie widoku): sprawdzenie przy przewijaniu i po renderze
function lazyCheck(){if(lazyCheck.t) return; lazyCheck.t=setTimeout(()=>{lazyCheck.t=null; document.querySelectorAll("canvas").forEach(c=>{if(!c.__mk) return; const r=c.getBoundingClientRect(); if(r.top<innerHeight+300&&r.bottom>-300) c.__mk();});},60);}
window.addEventListener("scroll",lazyCheck,{passive:true}); window.addEventListener("resize",lazyCheck); document.addEventListener("toggle",lazyCheck,true); document.addEventListener("click",()=>setTimeout(lazyCheck,50),true);
const tipSrc=src=>({callbacks:{footer:()=>src}});
// ---------- pomocnicze NFZ ----------
const yr=(k,y)=>M[k]&&M[k].yearly[y]?M[k].yearly[y]:null;
const YEARS=[2019,2020,2021,2022,2023,2024,2025];
const LASTY=2025;
function groupOf(k){return D.groups.filter(g=>g.mols.includes(k));}
// parsowanie <1>…/<2>… z obwieszczeń
function idxMap(s){const out={}; if(!s) return out; String(s).split(/[\/;]/).forEach(part=>{const m=part.match(/^\s*((?:<\d+>)*)\s*(.*)$/); if(!m)return; const ids=[...m[1].matchAll(/<(\d+)>/g)].map(x=>x[1]); const v=m[2].trim(); if(!v)return; (ids.length?ids:["*"]).forEach(i=>out[i]=v);}); return out;}
function months(p){if(!p)return null; let m=0; const y=p.match(/(\d+)\s*(rok|lata|lat)/); const mm=p.match(/(\d+)\s*miesi/); if(y)m+=12*+y[1]; if(mm)m+=+mm[1]; return m||null;}
function addM(d,m){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d||"").trim())) return null; const x=new Date(String(d).trim()+"T00:00:00Z"); if(isNaN(x)) return null; x.setUTCMonth(x.getUTCMonth()+m); x.setUTCDate(x.getUTCDate()-1); return x.toISOString().slice(0,10);}
function decisions(r){const progs=idxMap(r.programme), from=idxMap(r.decision_from), per=idxMap(r.decision_period); const keys=Object.keys(progs).length?Object.keys(progs):["*"];
  return keys.map(i=>{const f=from[i]||from["*"]; const p=per[i]||per["*"]; const m=months(p); return {prog:(progs[i]||"").replace(/\.$/,""),from:f,period:p,to:f&&m?addM(f,m):null};});}
// status: wynik rekomendacji Prezesa AOTMiT, a gdy jej brak – stanowiska/opinii Rady Przejrzystości (wyodrębniony automatycznie z PDF)
const OUT={"pozytywna":"pos","pozytywna warunkowa":"cond","negatywna":"neg"};
function aotStatus(a){const o=a.rek_outcome||(a.rek_url?null:a.srp_outcome)||a.srp_outcome; if(o&&OUT[o]) return OUT[o]; if(a.rek_url||a.srp_url) return "hdr"; return "none";}
const aotLabel={pos:'<span class="chip pos">pozytywna</span>',cond:'<span class="chip pos">pozytywna warunkowa</span>',neg:'<span class="chip neg">negatywna</span>',hdr:'<span class="chip warn">dokument wydany – wynik nieustalony (patrz PDF)</span>',none:'<span class="chip">w toku / brak dokumentu w BIP</span>'};
const outChip=o=>o?`<span class="chip ${o==="negatywna"?"neg":"pos"}">${esc(o)}</span>`:'<span class="chip warn">wynik nieustalony</span>';
const aotCos=a=>a.company?String(a.company).split(/;\s*/):[];
const aotG=a=>a.gtins?String(a.gtins).split(";").filter(Boolean):[];
const aotName=a=>a.product||a.title.split(",")[0];
const rekHtml=a=>a.rek_url?`<a href="${esc(a.rek_url)}" target="_blank">Rekomendacja Prezesa ${esc(a.rek_no||"(nr nieodczytany)")}</a> ${esc(a.rek_date||"")} ${outChip(a.rek_outcome)}`:"";
const srpHtml=a=>a.srp_url?`<a href="${esc(a.srp_url)}" target="_blank">${esc(a.srp_type||"Stanowisko/opinia")} RP ${esc(a.srp_no||"(nr nieodczytany)")}</a> ${esc(a.srp_date||"")} ${outChip(a.srp_outcome)}`:"";
const gtinsIn=s=>(String(s).match(/\b0\d{13}\b/g)||[]);
const curGtins=new Set(D.mz.current.map(r=>r.gtin));
const AOTSRC="AOTMiT BIP – zlecenia MZ";
// ---------- wybrana firma + katalog produktów (wyprowadzony z obwieszczeń MZ 2019–2026 × URPL; bez liczb wpisanych ręcznie) ----------
const CF=()=>localStorage.getItem("cf")||"";
const acc=()=>css("--accent")||"#007aff";
const slug=s=>String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const reEsc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const G2S={},G2C={};
Object.entries(D.mz.g).forEach(([g,x])=>{if(x[3]) G2S[g]=x[3]; if(x[4]) G2C[g]=x[4];});
const curBrands=new Set(D.mz.current.map(r=>r.brand));
const AREA=k=>{const g=groupOf(k)[0]; return g?g.label.split(/[:(]/)[0].trim():null;};
const PHB=new Set(D.pharmacy.map(r=>r.product));
const PRODS=(()=>{const by={}; D.mz.first_last.forEach(r=>{const b=r.brand||(r.name||"").split(",")[0]||r.gtin; const p=by[b]||(by[b]={brand:b,gt:new Set(),lists:new Set(),subs:new Set(),first:r.first,last:r.last}); p.gt.add(r.gtin); p.lists.add(r.list); if(G2S[r.gtin]) p.subs.add(G2S[r.gtin]); if(r.first<p.first) p.first=r.first; if(r.last>p.last) p.last=r.last;});
  const ids={};
  return Object.values(by).map(p=>{const cs={}; p.gt.forEach(g=>{const c=G2C[g]; if(c) cs[c]=(cs[c]||0)+1;}); const co=Object.entries(cs).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
    const subs=[...p.subs]; const isB=p.lists.has("B");
    let mols=isB?Object.keys(M).filter(k=>subs.some(s=>mzrx(k).test(s))):[];
    if(mols.length>1){const L=Math.max(...mols.map(k=>mzrx(k).source.length)); mols=mols.filter(k=>mzrx(k).source.length===L);}
    const ra=PHB.has(p.brand)?p.brand:null;
    let id=slug(p.brand)||"produkt"; if(ids[id]) id+="-"+(++ids[id]); else ids[id]=1;
    return {id,brand:p.brand,company:co[0]||null,companies:co,inn:subs.join(", ")||null,gtins:[...p.gt],first:p.first,last:p.last,lists:[...p.lists].sort(),mols,mol:mols.length===1?mols[0]:null,molGroup:mols.length>1?(groupOf(mols[0])[0]||{}).id:null,ra,
      area:(mols.length&&AREA(mols[0]))||(isB?"Programy lekowe – pozostałe":"Apteka (lista "+[...p.lists].sort().join("/")+")"),
      rx:new RegExp("(^|[^\\p{L}])"+reEsc(p.brand)+"($|[^\\p{L}])","iu"),current:curBrands.has(p.brand)};}).sort((a,b)=>a.brand.localeCompare(b.brand,"pl"));})();
const PB=Object.fromEntries(PRODS.map(p=>[p.brand,p]));
const aotOfProd=p=>{const gs=new Set(p.gtins), b=p.brand.toLowerCase(); return D.aotmit.filter(a=>(a.product&&a.product.toLowerCase()===b)||aotG(a).some(g=>gs.has(g))||(!a.product&&p.rx.test(a.title)));};
const AREAS=[...new Set(D.groups.map(g=>g.label.split(/[:(]/)[0].trim()).concat(PRODS.map(p=>p.area)))];
const rc=r=>r.c||(PB[r.brand]||{}).company||null;
const MOLCO={}; PRODS.forEach(p=>p.mols.forEach(k=>{MOLCO[k]=MOLCO[k]||new Set(); if(p.company) MOLCO[k].add(p.company);}));
const molCos=k=>[...(MOLCO[k]||[])].sort();
const molCo=k=>{const c=molCos(k); return c.length===1?c[0]:null;};
const cProds=c=>c?PRODS.filter(p=>p.companies.includes(c)):PRODS;
const coChip=c=>c?`<span class="chip ${c===CF()?"sel":""}">${esc(c)}</span>`:"";
const molChip=k=>{const c=molCos(k); return c.length===1?coChip(c[0]):c.length?`<span class="chip" title="${esc(c.join(", "))}">kilka podmiotów (${c.length})</span>`:"";};
function molNote(p){
  if(p.mols.length>1) return `NFZ raportuje substancję pod kilkoma kodami (${p.mols.map(k=>M[k].label).join("; ")}) bez nazwy handlowej – brak danych NFZ per produkt.`;
  if(p.mol){const o=PRODS.filter(q=>q!==p&&q.mols.includes(p.mol)).map(q=>q.brand); return o.length?`Dane NFZ dotyczą substancji (${M[p.mol].label}) i obejmują również: ${o.join(", ")} – nie są danymi per produkt.`:null;}
  if(p.ra) return null;
  return p.lists.includes("B")?"Substancja spoza zakresu pobranych kodów NFZ (programy lekowe) – brak danych NFZ per produkt.":"Refundacja apteczna NFZ pobrana tylko dla wybranych marek – dla tego produktu brak danych.";
}
const TEDAL={"toksyna botulinowa A":/botulin/i,"deksametazon implant":/dexameth/i};
const tedRx=s=>TEDAL[s]||new RegExp(reEsc(String(s).split("/")[0].slice(0,6)),"i");
const TEDS=[...new Set(D.tenders.map(t=>t.s))];
const tnrm=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ph/g,"f").replace(/th/g,"t").replace(/k/g,"c").replace(/y/g,"i").replace(/[^a-z]/g,"");
// dopasowanie substancji TED (nazwy angielskie) do INN z obwieszczenia (łacina/polski): wzorzec ręczny lub 6 pierwszych liter po normalizacji (secukinumab ↔ Sekukinumab)
const tedSubs=(c,all)=>{const r=tedSubs0(c,all); return window.PF&&PF.on()?new Set([...r].filter(s=>PF.subOk(s))):r;};
const tedSubs0=(c,all)=>{if(!c) return new Set(TEDS); const inns=cProds(c).filter(p=>p.lists.includes("B")&&(all||p.current)).map(p=>p.inn||""); const ni=inns.map(tnrm); return new Set(TEDS.filter(s=>inns.some(i=>tedRx(s).test(i))||(!TEDAL[s]&&tnrm(String(s).split("/")[0]).length>=6&&ni.some(i=>i.includes(tnrm(String(s).split("/")[0]).slice(0,6))))));};
const winRx=c=>new RegExp(reEsc(String(c).split(/[\s(,]/)[0]),"i");
// ---------- nawigacja ----------
const VIEWS=[...((window.R1&&window.R1.VIEWS)||[]),["przeglad","Przegląd"],["produkty","Produkty"],["rynek","Rynek i pacjenci"],["konkurencja","Konkurencja i udziały"],["firmy","Firmy"],["pacjenci","Pacjenci i rozpoznania"],["demografia","Demografia"],["sciezka","Ścieżka pacjenta"],["placowki","Placówki"],["refundacja","Refundacja"],["przetargi","Przetargi"],["alerty","Alerty i wnioski"],["zrodla","Źródła i luki"]];
function nav(){const cur=(location.hash.slice(2).split("/")[0])||HOME; if(window.V3&&window.V3.nav) return window.V3.nav(cur,VIEWS); $("#nav").innerHTML=VIEWS.map(([k,l])=>`<a href="#/${k}" class="${k===cur?"on":""}">${l}</a>`).join("");}
const HOME=(window.R1&&window.R1.HOME)||"przeglad";
function route(){CH.forEach(c=>c.destroy()); CH=[]; nav(); let [v,...a]=(location.hash.slice(2)||HOME).split("/").map(decodeURIComponent); const R1=window.R1; if(R1&&R1.defArgs&&!a.filter(Boolean).length){const d=R1.defArgs(v); if(d) a=d;} const f=(R1&&R1.views&&R1.views[v])||{przeglad:vOverview,produkty:vProducts,rynek:vMarket,konkurencja:vComp,refundacja:vReimb,przetargi:vTenders,alerty:vAlerts,zrodla:vSources,pacjenci:(...a)=>window.V2.pac(...a),placowki:(...a)=>window.V2.fac(...a),demografia:(...a)=>window.V3.demo(...a),sciezka:(...a)=>window.V3.journey(...a),firmy:(...a)=>window.V3.firms(...a)}[v]||(R1&&R1.views&&R1.views[HOME])||vOverview; const el=$("#app"); el.classList.remove("enter"); el.innerHTML=f(...a); void el.offsetWidth; el.classList.add("enter"); window.scrollTo(0,0); if(window.V3&&window.V3.after) window.V3.after(v||HOME,a); if(R1&&R1.after) R1.after(v||HOME,a);}
// ---------- ALERTY (wspólne z przeglądem; per wybrana firma lub cały rynek) ----------
const ANNSRC=()=>S("Obwieszczenie MZ "+LASTANN,annBy[LASTANN].page,annBy[LASTANN].retrieved);
const AOTRETR=()=>D.aotmit[0]&&D.aotmit[0].retrieved;
function buildAlerts(c){
  if(c===undefined) c=CF(); const A=[]; const PR=cProds(c); const who=c?esc(c):"cały rynek";
  const ab=D.aotmit.filter(a=>!c||aotCos(a).includes(c));
  const more=(n,N,where)=>N>n?`<i>Pokazano ${n} z ${N} – pełna lista: ${where}.</i>`:"";
  const lst=(arr,f,n,where)=>"<ul class='clean'>"+arr.slice(0,n).map(f).join("")+"</ul>"+more(n,arr.length,where);
  const byCo=(arr,kf)=>{if(c) return ""; const by={}; arr.forEach(x=>{const k=kf(x)||"firma nieprzypisana"; by[k]=(by[k]||0)+1;}); return "<div class='muted'>Wg firm: "+Object.entries(by).sort((x,y)=>y[1]-x[1]).slice(0,12).map(([k,n])=>`${esc(k)} ${n}`).join(" · ")+"</div>";};
  const aline=a=>`<li><b>${esc(aotName(a))}</b>${!c&&a.company?" · "+esc(a.company):""} – zlecenie <a href="${esc(a.source_url)}" target="_blank">${esc(a.order_no)}</a> ${rekHtml(a)} ${srpHtml(a)}${window.R1?window.R1.aotExtra(a):""}${a.indication?`<br><span class="muted">${esc(a.indication.slice(0,160))}</span>`:""}</li>`;
  const ASRC=S(AOTSRC+" (lista zleceń + PDF rekomendacji Prezesa i stanowisk/opinii Rady Przejrzystości)","https://bip.aotm.gov.pl/zlecenia-mz-2026",AOTRETR());
  const evL=D.mz.events.filter(e=>e.announcement_date===LASTANN&&(!c||rc(e)===c));
  const eline=e=>`<li>${PB[e.brand]?`<a href="#/produkty/${PB[e.brand].id}">${esc(e.name||e.gtin)}</a>`:esc(e.name||e.gtin)} (${e.gtin}, lista ${esc(e.list)})${!c&&rc(e)?" · "+esc(rc(e)):""}${e.old!=null||e.new!=null?`: ${e.old!=null?esc(String(e.old).slice(0,80))+" → ":""}${esc(String(e.new??"").slice(0,80))}`:""}</li>`;
  // nowe refundacje w ostatnim obwieszczeniu
  {const n=evL.filter(e=>/^Nowa refundacja|^Powrót/.test(e.event)); if(n.length) A.push({lvl:"pos",h:`Nowe refundacje / powroty na listę – obwieszczenie ${LASTANN} (${who}): ${n.length} GTIN, ${new Set(n.map(e=>e.brand)).size} marek`,b:byCo(n,rc)+lst(n,eline,c?60:25,"widok Refundacja"),src:ANNSRC()});}
  // wykreślenia w ostatnim obwieszczeniu
  {const n=evL.filter(e=>/^Brak w obwieszczeniu/.test(e.event)); if(n.length) A.push({lvl:"neg",h:`Wykreślenia z wykazu – obwieszczenie ${LASTANN} (${who}): ${n.length} GTIN, ${new Set(n.map(e=>e.brand)).size} marek`,b:byCo(n,rc)+lst(n,eline,c?60:25,"widok Refundacja")+"<i>GTIN obecny w poprzednim obwieszczeniu, nieobecny w ostatnim.</i>",src:ANNSRC()});}
  // pozytywne rekomendacje bez refundacji
  {const L=ab.filter(a=>["pos","cond"].includes(aotStatus(a))&&a.year>=2024&&aotG(a).length&&aotG(a).some(x=>!curGtins.has(x)));
  if(L.length) A.push({lvl:"warn",h:`Pozytywna rekomendacja/stanowisko AOTMiT (zlecenia od 2024), GTIN nieobecne w obwieszczeniu ${LASTANN} (${who}): ${L.length}`,b:byCo(L,a=>aotCos(a)[0])+lst(L,aline,c?50:20,"Refundacja → Pipeline AOTMiT")+"<i>Reguła: wynik pozytywny lub warunkowy; co najmniej jeden GTIN z tytułu zlecenia nieobecny w ostatnim obwieszczeniu MZ.</i>",src:ASRC});}
  // negatywne
  {const L=ab.filter(a=>aotStatus(a)==="neg"&&a.year>=2025);
  if(L.length) A.push({lvl:"neg",h:`Negatywne rekomendacje/stanowiska AOTMiT – zlecenia od 2025 (${who}): ${L.length}`,b:byCo(L,a=>aotCos(a)[0])+lst(L,aline,c?50:20,"Refundacja → Pipeline AOTMiT"),src:ASRC});}
  // wygasające decyzje (12 mies.)
  {const lim=addM(TODAY,12); const R=[]; D.mz.current.filter(r=>!c||rc(r)===c).forEach(r=>decisions(r).forEach(d=>{if(d.to&&d.to>=TODAY&&d.to<=lim) R.push({r,d});})); R.sort((x,y)=>x.d.to<y.d.to?-1:1);
  if(R.length) A.push({lvl:"warn",h:`Decyzje refundacyjne wygasające do ${lim} (${who}): ${R.length} (GTIN × program), ${new Set(R.map(x=>x.r.brand)).size} marek`,b:byCo(R,x=>rc(x.r))+lst(R,({r,d})=>`<li><b>${d.to}</b> – ${esc(r.name)} (GTIN ${r.gtin}${d.prog?", "+esc(d.prog):""}, od ${esc(d.from)}, okres ${esc(d.period)})${!c&&rc(r)?" · "+esc(rc(r)):""}</li>`,c?60:25,"Refundacja → Decyzje refundacyjne")+"<i>Data końca wyliczona z kolumn obwieszczenia (od + okres − 1 dzień).</i>",src:ANNSRC()});}
  // wszystkie zmiany w ostatnim obwieszczeniu
  if(evL.length){const by={}; evL.forEach(e=>by[e.event]=(by[e.event]||0)+1);
    A.push({lvl:"",h:`Wszystkie zmiany w obwieszczeniu ${LASTANN} (${who}): ${evL.length}`,b:"Wg typu: "+Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${esc(k)} ${n}`).join(" · ")+byCo(evL,rc),src:ANNSRC()});}
  // w toku
  {const L=ab.filter(a=>aotStatus(a)==="none"&&a.year>=2025);
  if(L.length) A.push({lvl:"",h:`W toku w AOTMiT – zlecenia od 2025 bez rekomendacji/stanowiska w BIP (${who}): ${L.length}`,b:byCo(L,a=>aotCos(a)[0])+lst(L,a=>`<li><b>${esc(aotName(a))}</b>${!c&&a.company?" · "+esc(a.company):""} – zlecenie <a href="${esc(a.source_url)}" target="_blank">${esc(a.order_no)}</a>, wpływ ${esc(a.received||"brak danych")}${a.indication?" · "+esc(a.indication.slice(0,140)):""}</li>`,c?50:20,"Refundacja → Pipeline AOTMiT"),src:ASRC});}
  // wycofania marek (ostatnie 24 mies.)
  {const lim=addM(LASTANN,-24); const L=PR.filter(p=>p.last&&p.last<LASTANN&&p.last>=lim).sort((a,b)=>a.last<b.last?1:-1);
  if(L.length) A.push({lvl:"neg",h:`Marki nieobecne w obwieszczeniu ${LASTANN}, obecne w ciągu 24 mies. przed nim (${who}): ${L.length}`,b:byCo(L,p=>p.company)+lst(L,p=>`<li><a href="#/produkty/${p.id}">${esc(p.brand)}</a>${!c&&p.company?" · "+esc(p.company):""} – ostatnio ${annLink(p.last)} (${p.gtins.length} GTIN)</li>`,c?60:25,"Produkty"),src:S("Obwieszczenia MZ "+D.meta.announcements[0].announcement_date+" – "+LASTANN,annBy[LASTANN].page,annBy[LASTANN].retrieved)});}
  // NFZ dynamika ±20% r/r (wybrane substancje)
  {const ks=c?Object.keys(M).filter(k=>molCo(k)===c):Object.keys(M); let L=[];
  ks.forEach(k=>{const a=yr(k,LASTY),b=yr(k,LASTY-1); if(a&&b&&b[0]>0){const g=a[0]/b[0]-1; if(Math.abs(g)>=0.2) L.push({k,a,b,g});}});
  if(!c) L=L.sort((x,y)=>Math.abs(y.a[0]-y.b[0])-Math.abs(x.a[0]-x.b[0])).slice(0,8);
  L.forEach(({k,a,b,g})=>A.push({lvl:g>0?"pos":"neg",h:`${esc(M[k].label)}: refundacja NFZ ${LASTY} ${pct(g)} r/r${!c&&molCo(k)?" · "+esc(molCo(k)):""}`,b:`${pln(b[0])} (${LASTY-1}) → ${pln(a[0])} (${LASTY}); pacjenci ${nf(b[1])} → ${nf(a[1])}. <i>Kryterium: zmiana ≥ 20% r/r; wybrane substancje (obszary terapeutyczne) NFZ${c?"; tylko kody NFZ, dla których jedynym podmiotem na liście B jest wybrana firma":"; pokazano 8 największych zmian kwotowych"}.</i>`,src:S(NFZ_SRC,nfzUrl(k),D.meta.nfz_retrieved)}));}
  // otwarte przetargi
  {const ts=tedSubs(c); const open=D.tenders.filter(t=>t.t.startsWith("cn")&&t.dl&&t.dl>=TODAY&&ts.has(t.s));
  if(open.length) A.push({lvl:"",h:`Otwarte przetargi (TED) ${c?"na substancje produktów "+esc(c):"na wybrane substancje (obszary terapeutyczne)"} z terminem ofert ≥ ${TODAY}: ${open.length} części`,b:"<ul class='clean'>"+open.slice(0,12).map(t=>`<li>${esc(t.s)} – ${esc(t.b)} (${esc(t.c||"")}) – termin ${t.dl} – <a href="${D.meta.ted_notice_url+t.p}" target="_blank">${t.p}</a></li>`).join("")+"</ul>",src:S("TED API v3",D.meta.ted_url,D.meta.ted_retrieved)});}
  return A;
}
const alertHtml=a=>`<div class="alert ${a.lvl}"><div class="h">${a.h}</div><div>${a.b}</div>${a.src}</div>`;
// ---------- PRZEGLĄD ----------
const X3=()=>window.DATA3||{cnat:[],repmeta:[]};
const RMETA=p=>X3().repmeta.find(r=>r.period===p)||{};
const repSrc=p=>`NFZ – Raport refundacyjny, arkusz „Programy lekowe” (bez chemioterapii), ${RMETA(p).coverage||p}, opubl. ${RMETA(p).published||"brak danych"}`;
const natRows=p=>X3().cnat.filter(r=>r.period===p);
const natTot=p=>{const r=natRows(p); return r.length?r.reduce((s,x)=>s+x.refund,0):null;};
const natRank=p=>natRows(p).filter(r=>!/^brak mapowania/i.test(r.company)).sort((a,b)=>b.refund-a.refund);
function annChart(id,c){const A=D.meta.announcements.map(a=>a.announcement_date).slice(1); const cnt=re=>A.map(d=>D.mz.events.filter(e=>e.announcement_date===d&&re.test(e.event)&&(!c||rc(e)===c)).length);
  chart(id,{type:"bar",data:{labels:A,datasets:[{label:"Nowe refundacje / powroty (GTIN)",data:cnt(/^Nowa refundacja|^Powrót/),backgroundColor:"#30d158"},{label:"Wykreślenia (GTIN)",data:cnt(/^Brak w obwieszczeniu/).map(v=>-v),backgroundColor:"#ff375f"}]},options:{maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true}},plugins:{tooltip:{callbacks:{label:t=>`${t.dataset.label}: ${nf(Math.abs(t.raw))}`,footer:t=>"Obwieszczenie MZ "+t[0].label}}}}});}
function aotChart(id,c){const ab=D.aotmit.filter(a=>!c||aotCos(a).includes(c)); const ys=[...new Set(ab.map(a=>a.year))].sort(); const K=[["pos","pozytywna","#30d158"],["cond","pozytywna warunkowa","#64d2ff"],["neg","negatywna","#ff375f"],["hdr","wynik nieustalony","#ffd60a"],["none","w toku / brak dokumentu","#8e8e93"]];
  chart(id,{type:"bar",data:{labels:ys,datasets:K.map(([k,l,col])=>({label:l,data:ys.map(y=>ab.filter(a=>a.year===y&&aotStatus(a)===k).length),backgroundColor:col}))},options:{maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,title:{display:true,text:"zlecenia"}}},plugins:{tooltip:{callbacks:{footer:()=>AOTSRC}}}}});}
function vOverview(){const c=CF(); return c?ovCompany(c):ovMarket();}
function groupSummary(){
  return table([{h:"Grupa (monitorowane kody NFZ)",k:"label"},{h:`Refundacja NFZ ${LASTY-1}`,n:1,v:x=>x.r24,f:x=>V(pln(x.r24),NFZ_SRC,D.meta.nfz_retrieved)},{h:`Refundacja NFZ ${LASTY}`,n:1,v:x=>x.r25,f:x=>V(pln(x.r25),NFZ_SRC,D.meta.nfz_retrieved)},
    {h:"r/r",n:1,v:x=>x.g,f:x=>x.g==null?`<span class="alt" title="brak wartości w roku bazowym">nowa / –</span>`:`<span class="${x.g>=0?"pos":"neg"}">${pct(x.g)}</span>`},{h:`Największa substancja ${LASTY}`,v:x=>x.top,f:x=>x.top?`<a href="#/rynek/${x.topk}">${esc(x.top)}</a> ${molChip(x.topk)}`:ND},{h:"Liczba kodów",n:1,k:"n"},{h:"Szczegóły",f:x=>`<a href="#/konkurencja/${x.id}">Udziały →</a>`,v:()=>""}],
   D.groups.map(g=>{const s=y=>{const v=g.mols.map(k=>yr(k,y)).filter(Boolean); return v.length?v.reduce((a,b)=>a+b[0],0):null;}; const r24=s(LASTY-1),r25=s(LASTY); const t=g.mols.filter(k=>yr(k,LASTY)).sort((a,b)=>yr(b,LASTY)[0]-yr(a,LASTY)[0])[0];
     return {id:g.id,label:g.label,r24,r25,g:r24&&r25?r25/r24-1:null,top:t?M[t].label:null,topk:t,n:g.mols.length};}),{name:"grupy_terapeutyczne",search:false,src:S(NFZ_SRC+" (suma kodów substancji w grupie; substancja może należeć do kilku grup)","https://api.nfz.gov.pl/app-stat-api-pl",D.meta.nfz_retrieved)});
}
function ovMarket(){
  const P25="2025",P24="2024"; const T25=natTot(P25),T24=natTot(P24); const rk=natRank(P25); const top3=rk.slice(0,3); const s3=T25&&top3.length?top3.reduce((s,r)=>s+r.refund,0)/T25:null;
  const cur=D.mz.current; const brands=new Set(cur.map(r=>r.brand)); const cos=new Set(cur.map(rc).filter(Boolean)); const ann=annBy[LASTANN]; const rm=RMETA(P25);
  let h=`<h1>Przegląd rynku</h1><p class="sub">Cały rynek leków refundowanych w programach lekowych · dane publiczne · ostatnie obwieszczenie MZ: ${annLink(LASTANN)} · raport NFZ ${esc(rm.coverage||"brak danych")} · pobrano ${esc(X3().built||D.meta.nfz_retrieved)}</p>
  <div class="grid g4">
   <div class="card kpi"><div class="l">Refundacja – programy lekowe ${P25}</div><div class="v">${V(pln(T25),repSrc(P25),X3().built,rm.page_url)}</div><div class="d ${T25!=null&&T24!=null?(T25>=T24?"pos":"neg"):""}">${T25!=null&&T24!=null?V(pct(T25/T24-1)+" r/r",repSrc(P25)+" vs "+repSrc(P24),X3().built):ND} (${P24}: ${pln(T24)??"brak danych"})</div>${S("NFZ – Raport refundacyjny (suma wszystkich EAN)",rm.page_url,X3().built)}</div>
   <div class="card kpi"><div class="l">Firmy z refundacją w programach ${P25}</div><div class="v">${V(nf(rk.length),repSrc(P25),X3().built,rm.page_url)}</div><div class="d">po zgrupowaniu podmiotów odpowiedzialnych w grupy kapitałowe</div>${S("NFZ – Raport refundacyjny × URPL (MAH)",rm.page_url,X3().built)}</div>
   <div class="card kpi"><div class="l">Top 3 firmy – udział ${P25}</div><div class="v">${s3==null?ND:V(nf(100*s3,1)+"%",repSrc(P25),X3().built,rm.page_url)}</div><div class="d">${top3.map(r=>`<a href="#/firmy/f/${encodeURIComponent(r.company)}">${esc(r.company)}</a>`).join(" · ")}</div>${S("NFZ – Raport refundacyjny",rm.page_url,X3().built)}</div>
   <div class="card kpi"><div class="l">Wykaz leków refundowanych MZ ${LASTANN}</div><div class="v">${V(nf(new Set(cur.map(r=>r.gtin)).size)+" GTIN","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)}</div><div class="d">${nf(brands.size)} marek · ${nf(cos.size)} firm · A1: ${nf(cur.filter(r=>r.list==="A1").length)} · B: ${nf(cur.filter(r=>r.list==="B").length)} · C: ${nf(cur.filter(r=>r.list==="C").length)}</div>${S("Obwieszczenie MZ – pełny wykaz (listy A1, B, C)",ann.page,ann.retrieved)}</div>
  </div>
  <div class="grid g2">
   <div class="card"><h2>Największe firmy – refundacja w programach lekowych ${P25}</h2><div class="chartbox tall"><canvas id="ovc"></canvas></div>${S(repSrc(P25),rm.page_url,X3().built)}<p><a href="#/firmy">Ranking i profile firm →</a></p></div>
   <div class="card"><h2>Najważniejsze sygnały – cały rynek</h2>${buildAlerts("").filter(a=>a.lvl).slice(0,6).map(alertHtml).join("")||`<p>${ND}</p>`}<a href="#/alerty">Wszystkie alerty →</a></div>
  </div>
  <div class="grid g2"><div class="card"><h2>Nowe refundacje i wykreślenia wg obwieszczenia – cały wykaz</h2><div class="chartbox"><canvas id="ovm"></canvas></div>${S("Zdarzenia wyliczone przez porównanie kolejnych obwieszczeń MZ (GTIN × lista)","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",ann.retrieved)}</div>
  <div class="card"><h2>AOTMiT – wynik rekomendacji/stanowisk wg roku zlecenia</h2><div class="chartbox"><canvas id="ova"></canvas></div>${S(AOTSRC+" – wynik wyodrębniony automatycznie z PDF","https://bip.aotm.gov.pl/zlecenia-mz-2026",AOTRETR())}</div></div>
  <div class="card"><h2>Wybrane obszary terapeutyczne – refundacja NFZ per substancja</h2>${groupSummary()}</div>`;
  annChart("ovm",""); aotChart("ova","");
  const t12=rk.slice(0,12);
  chart("ovc",{type:"bar",data:{labels:t12.map(r=>r.company),datasets:[{label:"Refundacja (mln zł)",data:t12.map(r=>r.refund/1e6),backgroundColor:t12.map((r,i)=>PAL[i%PAL.length])}]},options:{indexAxis:"y",maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${nf(c.raw,2)} mln zł (udział ${nf(100*t12[c.dataIndex].share,1)}%)`,footer:()=>repSrc(P25)}}},scales:{x:{title:{display:true,text:"mln zł"}}}}});
  return h;
}
function ovCompany(c){
  const P25="2025",P24="2024"; const rm=RMETA(P25); const r25=natRows(P25).find(r=>r.company===c), r24=natRows(P24).find(r=>r.company===c); const rank=natRank(P25).findIndex(r=>r.company===c)+1;
  const PR=cProds(c); const cur=D.mz.current.filter(r=>rc(r)===c); const ann=annBy[LASTANN];
  const ab=D.aotmit.filter(a=>aotCos(a).includes(c)); const st=ab.map(aotStatus);
  const ts=tedSubs(c); const t2=D.tenders.filter(t=>ts.has(t.s)&&t.d>="2025-01-01"); const won=t2.filter(t=>t.t.startsWith("can")&&winRx(c).test(t.w||""));
  const per=["2022","2023","2024","2025"].map(p=>({p,r:natRows(p).find(x=>x.company===c)}));
  let h=`<h1>Przegląd – ${esc(c)}</h1><p class="sub">Widok zawężony do wybranej firmy · dane publiczne · ostatnie obwieszczenie MZ: ${annLink(LASTANN)} · <a href="#/firmy/f/${encodeURIComponent(c)}">pełny profil firmy →</a></p>
  <div class="grid g4">
   <div class="card kpi"><div class="l">Refundacja – programy lekowe ${P25}</div><div class="v">${r25?V(pln(r25.refund),repSrc(P25),X3().built,rm.page_url):ND}</div><div class="d ${r25&&r24?(r25.refund>=r24.refund?"pos":"neg"):""}">${r25&&r24?V(pct(r25.refund/r24.refund-1)+" r/r",repSrc(P25)+" vs "+repSrc(P24),X3().built)+` (${P24}: ${pln(r24.refund)})`:"r/r: brak danych"}</div>${S("NFZ – Raport refundacyjny",rm.page_url,X3().built)}</div>
   <div class="card kpi"><div class="l">Pozycja i udział ${P25}</div><div class="v">${rank?V("#"+rank,repSrc(P25),X3().built,rm.page_url):ND}</div><div class="d">${r25?"udział "+nf(100*r25.share,1)+"% · "+nf(r25.n_ean)+" EAN":"firma nieobecna w raporcie programów lekowych"}</div>${S("NFZ – Raport refundacyjny",rm.page_url,X3().built)}</div>
   <div class="card kpi"><div class="l">Pozycje w wykazie MZ ${LASTANN}</div><div class="v">${V(cur.length+" GTIN","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)}</div><div class="d">${new Set(cur.map(r=>r.brand)).size} marek · A1: ${cur.filter(r=>r.list==="A1").length} · B: ${cur.filter(r=>r.list==="B").length} · C: ${cur.filter(r=>r.list==="C").length}</div>${S("Obwieszczenie MZ × URPL (firma wg GTIN)",ann.page,ann.retrieved)}</div>
   <div class="card kpi"><div class="l">AOTMiT – zlecenia MZ przypisane firmie 2019–2026</div><div class="v">${V(ab.length,AOTSRC,AOTRETR())}</div><div class="d"><span class="pos">${st.filter(s=>s==="pos"||s==="cond").length} pozytywne (w tym ${st.filter(s=>s==="cond").length} warunkowe)</span> · <span class="neg">${st.filter(s=>s==="neg").length} negatywne</span> · ${st.filter(s=>s==="hdr").length} wynik nieustalony · ${st.filter(s=>s==="none").length} w toku</div>${S(AOTSRC,"https://bip.aotm.gov.pl/zlecenia-mz-2026",D.aotmit[0]&&D.aotmit[0].retrieved)}</div>
  </div>
  <div class="grid g2">
   <div class="card"><h2>Refundacja w programach lekowych – trend</h2><div class="chartbox"><canvas id="ovc"></canvas></div>${S("NFZ – Raporty refundacyjne 2022–2025",rm.page_url,X3().built)}
    <h3>Przetargi szpitalne (TED) od 2025</h3><div class="grid g2"><div class="kpi"><div class="l">Części przetargów na substancje produktów firmy (lista B)</div><div class="v">${V(nf(t2.length),"TED API v3",D.meta.ted_retrieved,D.meta.ted_url)}</div></div><div class="kpi"><div class="l">Rozstrzygnięte – wykonawca pasuje do nazwy firmy</div><div class="v">${V(nf(won.length),"TED API v3",D.meta.ted_retrieved,D.meta.ted_url)}</div></div></div>
    <p class="muted">Dopasowanie wykonawcy: automatyczne, po pierwszym słowie nazwy firmy („${esc(String(c).split(/[\s(,]/)[0])}”). Tylko ogłoszenia powyżej progów UE (TED); BZP/e-Zamówienia – brak danych (źródło zablokowane).</p></div>
   <div class="card"><h2>Najważniejsze sygnały – ${esc(c)}</h2>${buildAlerts(c).filter(a=>a.lvl).slice(0,6).map(alertHtml).join("")||`<p class="muted">Brak sygnałów ostrzegawczych wg reguł alertów.</p>`}<a href="#/alerty">Wszystkie alerty →</a></div>
  </div>
  <div class="card"><h2>Produkty firmy w obwieszczeniach MZ (${D.meta.announcements[0].announcement_date.slice(0,4)}–${LASTANN.slice(0,4)})</h2>${PR.length?table([
    {h:"Obszar",k:"area"},{h:"Produkt",k:"brand",f:x=>`<a href="#/produkty/${x.id}"><b>${esc(x.brand)}</b></a>`},{h:"Substancja",k:"inn"},
    {h:`Refundacja NFZ ${LASTY-1}`,n:1,v:x=>x.r24,f:x=>V(pln(x.r24),NFZ_SRC,D.meta.nfz_retrieved,x.url)},{h:`Refundacja NFZ ${LASTY}`,n:1,v:x=>x.r25,f:x=>V(pln(x.r25),NFZ_SRC,D.meta.nfz_retrieved,x.url)},
    {h:"r/r",n:1,v:x=>x.g,f:x=>x.g==null?`<span class="alt" title="brak wartości w roku bazowym">nowa / –</span>`:`<span class="${x.g>=0?"pos":"neg"}">${pct(x.g)}</span>`},{h:`Pacjenci ${LASTY}`,n:1,v:x=>x.p25,f:x=>V(nf(x.p25),NFZ_SRC,D.meta.nfz_retrieved,x.url)},
    {h:"GTIN w obwieszczeniu",n:1,v:x=>x.ng},{h:"Programy / lista",v:x=>x.progs,f:x=>x.progs?esc(PFM(x.progs)):ND},{h:"Uwagi",v:x=>x.note,f:x=>x.note?`<span class="muted">${esc(x.note)}</span>`:""}
  ],PR.map(p=>{const k=p.mol&&!molNote(p)?p.mol:null; let r24=null,r25=null,p25=null;
    if(k){r24=yr(k,LASTY-1)?yr(k,LASTY-1)[0]:null; r25=yr(k,LASTY)?yr(k,LASTY)[0]:null; p25=yr(k,LASTY)?yr(k,LASTY)[1]:null;}
    let n2=null; if(p.ra){const f=y=>D.pharmacy.find(r=>r.product===p.ra&&r.province==="PL"&&r.year===y); const a=f(2024),b=f(2023); n2=`Apteka: refundacja 2024 = ${a?pln(a.refund):"brak danych"}${b?" (2023: "+pln(b.refund)+")":""}; dane apteczne NFZ kończą się na 2024 r.`;}
    const cc=cur.filter(r=>r.brand===p.brand); const progs=[...new Set(cc.flatMap(r=>r.programme?Object.values(idxMap(r.programme)).map(s=>s.replace(/\.$/,"")):["lista "+r.list]))].join(", ");
    return {...p,r24,r25,p25,g:r24&&r25?r25/r24-1:null,ng:cc.length,progs,url:k&&nfzUrl(k),note:[molNote(p),n2,p.current?null:"brak w obwieszczeniu "+LASTANN].filter(Boolean).join(" ")};
  }),{name:"produkty_firmy",search:PR.length>15}):`<p>${ND} – brak produktów tej firmy w obwieszczeniach MZ (firma przypisywana po GTIN z URPL).</p>`}</div>
  <div class="grid g2"><div class="card"><h2>Nowe refundacje i wykreślenia – ${esc(c)}</h2><div class="chartbox"><canvas id="ovm"></canvas></div>${S("Zdarzenia wyliczone przez porównanie kolejnych obwieszczeń MZ","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",ann.retrieved)}</div>
  <div class="card"><h2>AOTMiT – wyniki wg roku zlecenia – ${esc(c)}</h2><div class="chartbox"><canvas id="ova"></canvas></div>${S(AOTSRC,"https://bip.aotm.gov.pl/zlecenia-mz-2026",AOTRETR())}</div></div>`;
  annChart("ovm",c); aotChart("ova",c);
  const pp=per.filter(x=>x.r);
  chart("ovc",{type:"bar",data:{labels:per.map(x=>x.p),datasets:[{label:"Refundacja (mln zł)",data:per.map(x=>x.r?x.r.refund/1e6:null),backgroundColor:acc()}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c2=>`${nf(c2.raw,2)} mln zł`,footer:c2=>repSrc(per[c2[0].dataIndex].p)}}},scales:{y:{title:{display:true,text:"mln zł"}}}}});
  if(!pp.length) h+="";
  return h;
}
// ---------- PRODUKTY ----------
function prodCard(p){const c=D.mz.current.filter(r=>r.brand===p.brand); const nn=molNote(p); const y=p.mol&&!nn&&yr(p.mol,LASTY);
  return `<div class="card prod" onclick="location.hash='#/produkty/${p.id}'"><div class="area">${esc(p.area)}</div><div class="nm">${esc(p.brand)}</div><div class="muted">${esc(p.inn||"substancja: brak danych")}</div>
    <div style="margin-top:8px">${coChip(p.company)} ${c.length?`<span class="chip pos">refundowany · ${c.length} GTIN · lista ${[...new Set(c.map(r=>r.list))].join("/")}</span>`:`<span class="chip">brak w obwieszczeniu ${LASTANN}</span>`}</div>
    <div style="margin-top:8px">${y?`NFZ ${LASTY}: <b>${V(pln(y[0]),NFZ_SRC,D.meta.nfz_retrieved,nfzUrl(p.mol))}</b> · ${V(nf(y[1])+" pacj.",NFZ_SRC,D.meta.nfz_retrieved,nfzUrl(p.mol))}`:`<span class="muted">${p.ra?"refundacja apteczna – szczegóły w karcie":p.mol||p.mols.length?"NFZ: dane per substancja (kilka marek / kodów)":"NFZ: brak danych per produkt"}</span>`}</div></div>`;}
// R6: wartość marki (raport refundacyjny NFZ) – sortowanie listy i KPI karty marki
function brandVals(){if(brandVals.m) return brandVals.m; const m={}; Object.values((window.DATAR1||{}).brands||{}).forEach(L=>L.forEach(b=>{const o=m[b.b]||(m[b.b]={}); Object.entries(b.r||{}).forEach(([y,v])=>{if(v!=null) o[y]=(o[y]||0)+v;});})); return brandVals.m=m;}
function prodTable(PR,name){const BV=brandVals(); PR=[...PR].sort((a,b)=>((BV[b.brand]||{})["2025"]||0)-((BV[a.brand]||{})["2025"]||0)||String(a.brand).localeCompare(String(b.brand),"pl")); return table([{h:"Marka",k:"brand",f:x=>`<a href="#/produkty/${x.id}"><b>${esc(x.brand)}</b></a>`},{h:"Refundacja 2025 (NFZ)",n:1,v:x=>(BV[x.brand]||{})["2025"]??null,f:x=>{const v=(BV[x.brand]||{})["2025"]; return v==null?'<span class="muted">–</span>':pln(v);},t:"NFZ raport refundacyjny 2025 – suma kwot refundacji kodów EAN marki (wszystkie ścieżki)"},{h:"Substancja",k:"inn",v:x=>window.SUBN?SUBN(x.inn):x.inn},{h:"Firma",k:"company",f:x=>coChip(x.company)||ND},{h:"Listy",v:x=>x.lists.join("/")},{h:"Obszar",k:"area"},{h:"GTIN (2019–2026)",n:1,v:x=>x.gtins.length},{h:"Pierwsza obecność",k:"first"},{h:"Ostatnia obecność",k:"last",f:x=>x.current?`<span class="chip pos">${esc(x.last)}</span>`:esc(x.last)}],PR,{name,src:S("Obwieszczenia MZ "+D.meta.announcements[0].announcement_date+" – "+LASTANN+" × URPL (firma wg GTIN)","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",annBy[LASTANN].retrieved)});}
function vProducts(id){
  if(id){const p=PRODS.find(x=>x.id===id); if(p) return productDetail(p);}
  const c=CF(); const PR=cProds(c); const many=PR.length>150; const CARD=many?PR.filter(p=>p.mols.length):PR; const areas=AREAS.filter(a=>CARD.some(p=>p.area===a));
  return `<h1>Produkty</h1><p class="sub">${c?esc(c)+" – ":""}${nf(PR.length)} marek ze wszystkich obwieszczeń MZ (${D.meta.announcements[0].announcement_date} – ${LASTANN}; listy A1, B, C), z czego ${nf(PR.filter(p=>p.current).length)} w obwieszczeniu ${LASTANN}. Firma = podmiot odpowiedzialny wg URPL (dopasowanie po GTIN). Kliknij markę, aby zobaczyć EAN, programy, historię cen i limitów, AOTMiT i rejestrację.</p>
  <div class="card"><h2>Wszystkie marki${c?" – "+esc(c):""}</h2>${prodTable(PR,"produkty"+(c?"_"+slug(c):""))}</div>`+
  (areas.length?`<h2>${many?"Karty – wybrane substancje (obszary terapeutyczne) NFZ":"Karty produktów wg obszaru"}</h2>`+areas.map(a=>`<h2>${esc(a)}</h2><div class="grid g4">${CARD.filter(p=>p.area===a).map(prodCard).join("")}</div>`).join(""):"")+
  `<div class="card"><h2>Zakres</h2><p class="muted">Katalog obejmuje wszystkie marki z pobranych obwieszczeń MZ (refundacja apteczna, programy lekowe, chemioterapia). Produkty nierefundowane (np. estetyka, OTC) – brak publicznych danych o sprzedaży (<span class="alt">poza zakresem źródeł publicznych</span>). Dane NFZ per substancja tylko dla wybranych substancji (obszary terapeutyczne).</p>${S("Obwieszczenia MZ × URPL – Rejestr Produktów Leczniczych","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",annBy[LASTANN].retrieved)}</div>`;
}
function brandKpis(p){
  const BV=(brandVals()[p.brand])||{}; const v25=BV["2025"], v24=BV["2024"]; const R=window.DATAR1||{}, X3=window.DATA3||{}; const PN=window.PROGN||{};
  const cal=(R.cal||[]).filter(r=>r.b===p.brand); const seen=new Set(); const progs=[]; cal.forEach(r=>{if(seen.has(r.p)) return; seen.add(r.p); progs.push(r);});
  const shareIn=(prog,sub)=>{const P=(X3.ps||{})[prog]; if(!P||!sub) return null; const S=String(sub).toUpperCase(); const L=Object.entries(P).map(([k,yy])=>({k,v:(yy["2025"]||[])[1]||0})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v); const tot=L.reduce((a,x)=>a+x.v,0); const i=L.findIndex(x=>x.k===S); return i<0||!tot?null:{sh:L[i].v/tot,r:i+1,n:L.length,v:L[i].v};};
  const pr=progs.map(r=>({p:r.p,v:r.v25,to:r.to,sh:shareIn(r.p,r.s),n:r.n,lt:r.lt})).sort((a,b)=>(b.v||0)-(a.v||0));
  const main=pr[0]; const fut=pr.filter(x=>x.to&&x.to>=TODAY).sort((a,b)=>a.to<b.to?-1:1)[0];
  const n=cal.reduce((a,r)=>a+(r.n||0),0), lt=cal.reduce((a,r)=>a+(r.lt||0),0);
  const yoy=v25&&v24?v25/v24-1:null; const ann=annBy[LASTANN];
  const pnm=k=>PN[k]&&PN[k][0]?PN[k][0]:"nazwa programu: brak na liście MZ 10.2026 (program historyczny)";
  const k=(l,v,d)=>`<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d||""}</div></div>`;
  return `<div class="grid g4 strip bkpi">${k("Refundacja marki 2025",v25==null?ND:V(pln(v25),"NFZ raport refundacyjny 2025 – suma kwot refundacji kodów EAN marki","2026-10",""),"raport refundacyjny NFZ, wszystkie ścieżki")}
   ${k("Dynamika r/r 2025 vs 2024",yoy==null?ND:`<span class="${yoy>=0?"pos":"neg"}">${yoy>=0?"+":""}${nf(100*yoy,1)}%</span>`,v24!=null?"2024: "+pln(v24):"")}
   ${k(main?`Udział w programie ${esc(main.p)}`:"Udział w programie",main&&main.sh?`${nf(100*main.sh.sh,1)}%`:ND,main?(main.sh?`${main.sh.r}. miejsce z ${main.sh.n} substancji · `:"")+esc(pnm(main.p).slice(0,80)):"marka poza programami lekowymi")}
   ${k("Najbliższy koniec decyzji",fut?esc(fut.to):ND,fut?`program ${esc(fut.p)} · obwieszczenie ${esc(LASTANN)}`:"")}</div>
   <div class="grid g2"><div class="card kpi"><div class="l">Cena vs limit finansowania</div><div class="v">${n?(lt?`${nf(lt)}/${nf(n)} op. z limitem < ceny`:"cena = limit"):ND}</div><div class="d">${n?"opakowania w programach lekowych, obwieszczenie "+esc(LASTANN):""}</div></div>
   <div class="card"><h2>Programy lekowe marki</h2>${pr.length?`<div class="list">${pr.map(x=>`<div class="row"><div class="t"><b>${esc(x.p)}</b> – ${esc(pnm(x.p))}<br><span class="muted">${x.v!=null?"substancja w programie 2025: "+pln(x.v)+" · ":""}${x.sh?`udział ${nf(100*x.sh.sh,1)}% (${x.sh.r}./${x.sh.n})`:""}${x.to?" · decyzja do "+esc(x.to):""}</span></div></div>`).join("")}</div>`:`<p class="muted">Marka nie jest refundowana w programach lekowych (obwieszczenie ${esc(LASTANN)}).</p>`}${S("Nazwy programów: MZ – Lista załączników programów lekowych 10.2026; wartości: NFZ app-stat 2025 (program × substancja)",(window.PROGN_SRC||{}).page||"https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",(window.PROGN_SRC||{}).retrieved||ann.retrieved)}</div></div>`;
}
function productDetail(p){
  const cur=D.mz.current.filter(r=>r.brand===p.brand);
  const aot=aotOfProd(p);
  const ev=D.mz.events.filter(e=>e.brand===p.brand);
  const ann=annBy[LASTANN]; const nn=molNote(p);
  let h=`<p><a href="#/produkty">← Wszystkie produkty</a></p><h1>${esc(p.brand)} <span class="muted" style="font-size:18px;font-weight:400">${esc(p.inn||"")}</span></h1><p class="sub">${esc(p.area)} · ${p.company?`<a href="#/firmy/f/${encodeURIComponent(p.company)}">${esc(p.company)}</a>`:"firma: brak danych"}${p.companies.length>1?` <span class="muted">(GTIN także: ${esc(p.companies.slice(1).join(", "))})</span>`:""}</p>`;
  if(nn) h+=`<div class="alert warn">${esc(nn)}</div>`;
  h+=brandKpis(p);
  h+=`<div class="card"><h2>Status refundacyjny (obwieszczenie ${annLink(LASTANN)}) – drill-down po EAN i programie</h2>`+
   (cur.length?table([{h:"EAN/GTIN",k:"gtin"},{h:"Nazwa",k:"name"},{h:"Opakowanie",k:"pack"},{h:"Lista",k:"list"},{h:"Program / wskazanie",v:x=>x.programme||x.indications,f:x=>`<span title="${esc(x.indications||"")}">${esc(PFM(x.programme||x.indications||"").slice(0,200))}</span>`},{h:"Poziom odpłatności",k:"payment_level"},
     {h:"Urzędowa cena zbytu",n:1,v:x=>x.official_price,f:x=>V(nf(x.official_price,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Cena hurtowa brutto",n:1,v:x=>x.wholesale_price,f:x=>x.wholesale_price==null?ND:V(nf(x.wholesale_price,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},
     {h:"Limit finansowania",n:1,v:x=>x.limit_value,f:x=>V(nf(x.limit_value,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Dopłata pacjenta",n:1,v:x=>x.copay,f:x=>x.copay==null?ND:V(nf(x.copay,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},
     {h:"Decyzje (program: od → do)",v:x=>decisions(x).map(d=>`${d.prog||"*"}: ${d.from}→${d.to}`).join("; "),f:x=>decisions(x).map(d=>`${esc(d.prog||"")} ${esc(d.from||"")} → <b>${esc(d.to||"?")}</b>`).join("<br>")}],cur,{name:p.id+"_status",search:false,src:S("Obwieszczenie MZ "+LASTANN+" (data końca decyzji wyliczona: od + okres obowiązywania)",ann.page,ann.retrieved)})
   :`<p>${ND} – produkt nieobecny w obwieszczeniu z ${LASTANN}.</p>`)+`</div>`;
  h+=`<div class="grid g2"><div class="card"><h2>Historia cen i limitów (wszystkie obwieszczenia ${D.meta.announcements[0].announcement_date.slice(0,4)}–${LASTANN.slice(0,4)})</h2><div id="pdh"><p class="muted">Ładowanie historii…</p></div>${S("Obwieszczenia MZ ("+D.meta.announcements.length+" plików xlsx)","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",ann.retrieved)}</div>`;
  if(p.mol&&M[p.mol]){h+=`<div class="card"><h2>NFZ – refundacja i pacjenci (${esc(M[p.mol].names.join("; "))})</h2>${nn?`<p class="muted">${esc(nn)}</p>`:""}<div class="chartbox"><canvas id="pdn"></canvas></div>${S(NFZ_SRC,nfzUrl(p.mol),D.meta.nfz_retrieved)}<p><a href="#/rynek/${p.mol}">Województwa, miesiące i programy →</a></p></div>`;}
  else if(p.ra){h+=`<div class="card"><h2>NFZ – refundacja apteczna ${esc(p.ra)}</h2><div class="chartbox"><canvas id="pdr"></canvas></div>${S(NFZ_RA,(D.pharmacy.find(r=>r.product===p.ra&&r.province==="PL")||{}).source_url,D.meta.nfz_retrieved)}<p><a href="#/rynek/ra:${encodeURIComponent(p.ra)}">Województwa →</a></p></div>`;}
  else h+=`<div class="card"><h2>NFZ</h2><p>${ND}${nn?" – "+esc(nn):""}</p>${p.molGroup?`<p><a href="#/konkurencja/${p.molGroup}">Dane NFZ dla kodów tej substancji →</a></p>`:""}</div>`;
  h+=`</div><div class="grid g2"><div class="card"><h2>Oś czasu decyzji (obwieszczenia MZ – zdarzenia strukturalne)</h2><div class="tablewrap" style="max-height:420px;padding:12px"><div class="timeline">${ev.length?ev.slice().sort((a,b)=>a.announcement_date<b.announcement_date?1:-1).map(e=>`<div class="e ${/Brak|wykreśl/.test(e.event)?"neg":/Pierwsze|Powrót/.test(e.event)?"pos":""}"><b>${annLink(e.announcement_date)}</b> · ${esc(e.event)}<br><span class="muted">${esc(e.name)} · ${esc(e.pack||"")} · ${e.gtin}${e.old!=null||e.new!=null?` · ${esc(e.old??"–")} → ${esc(e.new??"–")}`:""}</span></div>`).join(""):ND}</div></div>${S("Zdarzenia wyliczone przez porównanie kolejnych obwieszczeń MZ","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",ann.retrieved)}</div>
   <div class="card"><h2>AOTMiT</h2>${aot.length?aot.map(a=>`<div style="margin-bottom:12px">${aotLabel[aotStatus(a)]} <b>Zlecenie ${esc(a.order_no)}</b> · wpływ ${esc(a.received||"brak danych")} · <a href="${esc(a.source_url)}" target="_blank">BIP</a><br>${esc(a.indication||a.title)}<br>${rekHtml(a)}${a.rek_verdict?`<br><span class="muted">${esc(a.rek_verdict)}…</span>`:""}${a.srp_url?"<br>"+srpHtml(a):""}${a.srp_verdict?`<br><span class="muted">${esc(a.srp_verdict)}…</span>`:""}</div>`).join(""):`<p>${ND} – brak zleceń MZ 2019–2026 dla produktu (dopasowanie po nazwie produktu lub GTIN).</p>`}${S(AOTSRC+" 2019–2026","https://bip.aotm.gov.pl/zlecenia-mz-2026",AOTRETR())}</div></div>`;
  h+=`<div class="card"><h2>Historia cen, limitów i dopłat – zakresy obwieszczeń z identycznymi wartościami</h2><div id="pdt"><p class="muted">Ładowanie…</p></div></div>`;
  h+=`<div class="card"><h2>Rejestracja (URPL)</h2><div id="pdu"><p class="muted">Ładowanie…</p></div></div>`;
  setTimeout(()=>lazyHist(H=>{const e1=document.getElementById("pdh"),e2=document.getElementById("pdt"),e3=document.getElementById("pdu"); if(!e1) return;
    if(!H){[e1,e2,e3].forEach(e=>e&&(e.innerHTML=`<p>${ND} – nie udało się wczytać pliku ${esc(D.mz.lazy_history)}.</p>`)); return;}
    if(!H.gi){H.gi={}; H.gtins.forEach((g,i)=>H.gi[g]=i);}
    const T=D.mz.txt, gs=new Set(p.gtins.map(g=>H.gi[g]).filter(x=>x!=null));
    const runs=H.runs.filter(r=>gs.has(r[0])).map(r=>({gtin:H.gtins[r[0]],list:r[1],from:H.anns[r[2]],to:H.anns[r[3]],fi:r[2],ti:r[3],official_price:r[4],limit_value:r[5],wholesale_price:r[6],retail_price:r[7],copay:r[8],payment_level:r[9]!=null?T[r[9]]:null,programme:r[10]!=null?T[r[10]]:null}));
    const hs=S("Obwieszczenia MZ – data/data_mz_hist.js (zakresy kolejnych obwieszczeń z identyczną ceną, limitem, dopłatą, odpłatnością i programem)","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",annBy[LASTANN].retrieved);
    if(!runs.length){e1.innerHTML=`<p>${ND}</p>`; e2.innerHTML=`<p>${ND}</p>`;}
    else{const i0=Math.min(...runs.map(r=>r.fi)), i1=Math.max(...runs.map(r=>r.ti)); const dates=H.anns.slice(i0,i1+1); const keys=[...new Set(runs.map(r=>r.gtin+"|"+r.list))].slice(0,8); const ds=[];
      keys.forEach((k,i)=>{const [g,l]=k.split("|"); const rr=runs.filter(r=>r.gtin===g&&r.list===l); const nm=String((D.mz.g[g]||[])[1]||g).replace(p.brand+", ","")+" "+((D.mz.g[g]||[])[2]||"")+" ("+l+")";
        const at=(d,f)=>{const ix=H.anns.indexOf(d); const x=rr.find(r=>r.fi<=ix&&ix<=r.ti); return x?x[f]:null;};
        ds.push({label:"UCZ "+nm,data:dates.map(d=>at(d,"official_price")),borderColor:PAL[i%PAL.length],backgroundColor:PAL[i%PAL.length],stepped:true,pointRadius:1});
        ds.push({label:"Limit "+nm,data:dates.map(d=>at(d,"limit_value")),borderColor:PAL[i%PAL.length],borderDash:[5,4],stepped:true,pointRadius:0});});
      e1.innerHTML=`<div class="chartbox"><canvas id="pdp"></canvas></div>${keys.length<new Set(runs.map(r=>r.gtin+"|"+r.list)).size?'<p class="muted">Wykres: pierwsze 8 pozycji GTIN × lista; wszystkie w tabeli poniżej.</p>':""}`;
      chart("pdp",{type:"line",data:{labels:dates,datasets:ds},options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:keys.length<=3,labels:{boxWidth:10}},tooltip:{callbacks:{label:c=>c.raw==null?null:`${c.dataset.label}: ${nf(c.raw,2)} zł`,footer:c=>"Obwieszczenie MZ "+c[0].label}}},scales:{y:{title:{display:true,text:"zł"}}}}});
      const zl=f=>({n:1,v:x=>x[f],f:x=>x[f]==null?ND:nf(x[f],2)+" zł"});
      e2.innerHTML=table([{h:"EAN/GTIN",k:"gtin"},{h:"Lista",k:"list"},{h:"Od obwieszczenia",k:"from",f:x=>annLink(x.from)},{h:"Do obwieszczenia",k:"to",f:x=>annLink(x.to)},{h:"Urzędowa cena zbytu",...zl("official_price")},{h:"Cena hurtowa brutto",...zl("wholesale_price")},{h:"Cena detaliczna",...zl("retail_price")},{h:"Limit",...zl("limit_value")},{h:"Dopłata",...zl("copay")},{h:"Odpłatność",k:"payment_level"},{h:"Program",v:x=>x.programme,f:x=>x.programme?esc(PFM(x.programme)):"–"}],runs.sort((a,b)=>a.gtin<b.gtin?-1:a.gtin>b.gtin?1:a.fi-b.fi),{name:p.id+"_historia",src:hs});}
    const ur=H.urpl.filter(r=>p.gtins.includes(r.gtin));
    e3.innerHTML=(ur.length?table([{h:"GTIN",k:"gtin"},{h:"Nazwa",k:"name"},{h:"Substancja",k:"inn"},{h:"Moc",k:"strength"},{h:"Postać",k:"form"},{h:"ATC",k:"atc"},{h:"Podmiot odpowiedzialny",k:"mah"},{h:"Procedura",k:"procedure"},{h:"Nr pozwolenia",k:"permit_no"},{h:"Ważność",k:"validity"}],ur,{name:p.id+"_urpl",search:false}):`<p>${ND} – GTIN produktu bez rekordu w RPL.</p>`)+S("URPL – Rejestr Produktów Leczniczych (CSV)",H.urpl_source.source_url,H.urpl_source.retrieved);
  }),0);
  if(p.mol&&M[p.mol]){const m=M[p.mol]; chart("pdn",{data:{labels:YEARS,datasets:[{type:"bar",label:"Refundacja (mln zł)",data:YEARS.map(y=>m.yearly[y]?m.yearly[y][0]/1e6:null),backgroundColor:acc(),yAxisID:"y"},{type:"line",label:"Pacjenci",data:YEARS.map(y=>m.yearly[y]?m.yearly[y][1]:null),borderColor:"#ff9f0a",backgroundColor:"#ff9f0a",yAxisID:"y2"}]},options:{maintainAspectRatio:false,plugins:{tooltip:tipSrc(NFZ_SRC+" · pobrano "+D.meta.nfz_retrieved)},scales:{y:{title:{display:true,text:"mln zł"}},y2:{position:"right",grid:{display:false},title:{display:true,text:"pacjenci"}}}}});}
  if(p.ra){const rr=D.pharmacy.filter(r=>r.product===p.ra&&r.province==="PL").sort((a,b)=>a.year-b.year); chart("pdr",{data:{labels:rr.map(r=>r.year),datasets:[{type:"bar",label:"Refundacja NFZ (zł)",data:rr.map(r=>r.refund),backgroundColor:acc()},{type:"bar",label:"Dopłata pacjentów (zł)",data:rr.map(r=>r.patient_contribution),backgroundColor:"#ff9f0a"},{type:"line",label:"Liczba opakowań",data:rr.map(r=>r.quantity),borderColor:"#30d158",yAxisID:"y2"}]},options:{maintainAspectRatio:false,plugins:{tooltip:tipSrc(NFZ_RA+" · pobrano "+D.meta.nfz_retrieved)},scales:{y:{position:"left",title:{display:true,text:"zł"}},y2:{position:"right",grid:{display:false},title:{display:true,text:"opakowania"}}}}});}
  return h;
}
// ---------- RYNEK / PACJENCI ----------
function molSelect(sel,href){const opts=D.groups.map(g=>`<optgroup label="${esc(g.label)}">${g.mols.map(k=>`<option value="${k}" ${k===sel?"selected":""}>${esc(M[k].label)}</option>`).join("")}</optgroup>`).join("")+`<optgroup label="Refundacja apteczna (lista A1)">${[...new Set(D.pharmacy.map(r=>r.product))].sort().map(r=>`<option value="ra:${r}" ${sel==="ra:"+r?"selected":""}>${r}</option>`).join("")}</optgroup>`;
  return `<select onchange="location.hash='${href}'+this.value+'/'+(document.getElementById('ysel')?document.getElementById('ysel').value:'')">${opts}</select>`;}
function PFM(s){return String(s||"").replace(/B\.(\d+[a-z]?)\.FM\.?/g,"B.$1 (FM)").replace(/(B\.\d+[a-z]?)\.(?=$|[\s;,)])/g,"$1");}
function vMarket(k,y){
  k=k||(window.R1&&window.R1.defMol&&window.R1.defMol())||D.groups[0].mols[0]; y=+y||LASTY;
  if(k.startsWith("ra:")) return marketRA(k.slice(3),y);
  if(k.startsWith("s:")&&window.R1&&R1.marketSub) return R1.marketSub(decodeURIComponent(k.slice(2)),y,CF());
  const m=M[k]; if(!m) return "<p>Nieznana substancja</p>";
  const src=nfzUrl(k); const pv=m.province[y]||{};
  const provRows=Object.keys(PROV).map(c=>({code:c,name:PROV[c],refund:pv[c]?pv[c][0]:null,patients:pv[c]?pv[c][1]:null}));
  const tot=provRows.reduce((s,r)=>s+(r.refund||0),0);
  const yrs=Object.keys(m.yearly).map(Number).sort();
  let h=`<h1>Rynek i pacjenci</h1><p class="sub">Dane NFZ o refundacji w programach lekowych: lata, miesiące, województwa, programy. Wybierz substancję.</p>
  <div class="tbar">${molSelect(k,"#/rynek/")} <select id="ysel" onchange="location.hash='#/rynek/${k}/'+this.value">${yrs.map(x=>`<option ${x===y?"selected":""}>${x}</option>`).join("")}</select> ${molChip(k)} ${m.multi_code?`<span class="chip warn">suma ${m.codes.length} kodów NFZ – pacjenci mogą się powtarzać</span>`:""}</div>
  <div class="grid g2"><div class="card"><h2>${esc(m.label)} – trend roczny</h2><div class="chartbox"><canvas id="mky"></canvas></div>${S(NFZ_SRC+" · "+m.names.join("; "),src,D.meta.nfz_retrieved)}</div>
  <div class="card"><h2>Trend miesięczny</h2><div class="chartbox"><canvas id="mkm"></canvas></div>${S(NFZ_SRC+" (monthly-drug-costs)",src&&src.replace("yearly","monthly"),D.meta.nfz_retrieved)}</div></div>
  <p><a class="btn sm ghost" href="#/placowki/s/${encodeURIComponent(m.names[0].split(" ")[0])}">Placówki stosujące substancję (dane per świadczeniodawca) →</a></p>
  <div class="grid g2"><div class="card"><h2>Województwa ${y}</h2><div class="chartbox tall"><canvas id="mkp"></canvas></div></div>
  <div class="card"><h2>Województwa ${y} – tabela</h2>${table([{h:"Kod",k:"code"},{h:"Województwo",k:"name",f:x=>`<a href="#/przetargi/${encodeURIComponent(x.name)}">${esc(x.name)}</a>`},{h:"Refundacja",n:1,v:x=>x.refund,f:x=>V(x.refund==null?null:nf(x.refund,2)+" zł",NFZ_SRC+" (province="+x.code+")",D.meta.nfz_retrieved,src+"&province="+x.code)},{h:"Udział",n:1,v:x=>x.refund&&tot?x.refund/tot:null,f:x=>x.refund&&tot?nf(100*x.refund/tot,1)+"%":ND},{h:"Pacjenci",n:1,v:x=>x.patients,f:x=>V(nf(x.patients),NFZ_SRC,D.meta.nfz_retrieved)}],provRows,{name:k+"_wojewodztwa_"+y,search:false,src:S(NFZ_SRC+" – parametr province=01…16, rok "+y+". Udział = refundacja województwa / suma 16 województw.",src,D.meta.nfz_retrieved)})}</div></div>
  <div class="card"><h2>Programy lekowe (drill-down) ${y}</h2>${table([{h:"Rok",k:0,v:x=>x[0],f:x=>x[0]},{h:"Kod MZ",v:x=>x[1],f:x=>x[1]?esc(x[1]):'<span class="nd">brak kodu w API</span>'},{h:"Program",v:x=>x[2],f:x=>esc(x[2])},{h:"Refundacja",n:1,v:x=>x[3],f:x=>V(nf(x[3],2)+" zł",NFZ_SRC+" (drug-costs-by-drug-program-and-active-substance)",D.meta.nfz_retrieved)},{h:"Pacjenci",n:1,v:x=>x[4],f:x=>V(nf(x[4]),NFZ_SRC,D.meta.nfz_retrieved)}],m.programme.filter(x=>x[0]===y),{name:k+"_programy_"+y,search:false,src:S(NFZ_SRC+" – drug-costs-by-drug-program-and-active-substance","https://api.nfz.gov.pl/app-stat-api-pl",D.meta.nfz_retrieved)})}</div>`;
  chart("mky",{data:{labels:yrs,datasets:[{type:"bar",label:"Refundacja (mln zł)",data:yrs.map(x=>m.yearly[x][0]/1e6),backgroundColor:acc()},{type:"line",label:"Pacjenci",data:yrs.map(x=>m.yearly[x][1]),borderColor:"#ff9f0a",backgroundColor:"#ff9f0a",yAxisID:"y2"}]},options:{maintainAspectRatio:false,plugins:{tooltip:tipSrc(NFZ_SRC+" · pobrano "+D.meta.nfz_retrieved)},scales:{y:{title:{display:true,text:"mln zł"}},y2:{position:"right",grid:{display:false}}}}});
  chart("mkm",{type:"line",data:{labels:m.monthly.map(x=>x[0]+"-"+String(x[1]).padStart(2,"0")),datasets:[{type:"line",label:"Refundacja (mln zł)",data:m.monthly.map(x=>x[2]/1e6),borderColor:"#0a84ff",pointRadius:0,tension:.2,yAxisID:"y"},{type:"line",label:"Pacjenci",data:m.monthly.map(x=>x[3]),borderColor:"#ff9f0a",pointRadius:0,yAxisID:"y2"}]},options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{tooltip:tipSrc(NFZ_SRC+" · pobrano "+D.meta.nfz_retrieved)},scales:{y2:{position:"right",grid:{display:false}}}}});
  const pr=provRows.filter(r=>r.refund!=null).sort((a,b)=>b.refund-a.refund);
  chart("mkp",{type:"bar",data:{labels:pr.map(r=>r.name),datasets:[{label:"Refundacja (mln zł)",data:pr.map(r=>r.refund/1e6),backgroundColor:"#0a84ff"},{label:"Pacjenci (tys.)",data:pr.map(r=>r.patients/1000),backgroundColor:"#ff9f0a"}]},options:{indexAxis:"y",maintainAspectRatio:false,plugins:{tooltip:tipSrc(NFZ_SRC+" · pobrano "+D.meta.nfz_retrieved)}}});
  return h;
}
function marketRA(prod,y){
  const rr=D.pharmacy.filter(r=>r.product===prod); const yrs=[...new Set(rr.map(r=>r.year))].sort(); if(!yrs.includes(y)) y=yrs[yrs.length-1];
  const rows=Object.keys(PROV).map(c=>{const x=rr.find(r=>r.province===c&&r.year===y)||{}; return {code:c,name:PROV[c],...x};});
  const nat=rr.filter(r=>r.province==="PL").sort((a,b)=>a.year-b.year);
  chart("ray",{type:"bar",data:{labels:nat.map(r=>r.year),datasets:[{label:"Refundacja NFZ",data:nat.map(r=>r.refund),backgroundColor:acc()},{label:"Dopłata pacjentów",data:nat.map(r=>r.patient_contribution),backgroundColor:"#ff9f0a"}]},options:{maintainAspectRatio:false,plugins:{tooltip:tipSrc(NFZ_RA+" · pobrano "+D.meta.nfz_retrieved)},scales:{x:{stacked:true},y:{stacked:true,title:{display:true,text:"zł"}}}}});
  return `<h1>Rynek i pacjenci</h1><p class="sub">Refundacja apteczna (lista A1) – NFZ raportuje opakowania i kwoty, nie liczbę pacjentów.</p><div class="tbar">${molSelect("ra:"+prod,"#/rynek/")} <select id="ysel" onchange="location.hash='#/rynek/ra:${prod}/'+this.value">${yrs.map(x=>`<option ${x===y?"selected":""}>${x}</option>`).join("")}</select></div>
  <div class="grid g2"><div class="card"><h2>${esc(prod)} – Polska</h2><div class="chartbox"><canvas id="ray"></canvas></div>${S(NFZ_RA,(nat[0]||{}).source_url,D.meta.nfz_retrieved)}</div>
  <div class="card"><h2>Województwa ${y}</h2>${table([{h:"Województwo",k:"name"},{h:"Opakowania",n:1,v:x=>x.quantity,f:x=>V(nf(x.quantity),NFZ_RA,D.meta.nfz_retrieved,x.source_url)},{h:"Refundacja",n:1,v:x=>x.refund,f:x=>V(x.refund==null?null:nf(x.refund,2)+" zł",NFZ_RA,D.meta.nfz_retrieved,x.source_url)},{h:"Dopłata pacjentów",n:1,v:x=>x.patient_contribution,f:x=>V(x.patient_contribution==null?null:nf(x.patient_contribution,2)+" zł",NFZ_RA,D.meta.nfz_retrieved,x.source_url)},{h:"Wartość",n:1,v:x=>x.value,f:x=>V(x.value==null?null:nf(x.value,2)+" zł",NFZ_RA,D.meta.nfz_retrieved,x.source_url)}],rows,{name:prod+"_apteka_"+y,search:false,src:S(NFZ_RA+" – yearly-provisions","https://api.nfz.gov.pl/app-stat-api-ra",D.meta.nfz_retrieved)})}</div></div>`;
}
// ---------- KONKURENCJA ----------
function vComp(gid,y){
  const g=D.groups.find(x=>x.id===gid)||D.groups.find(x=>x.id===(window.R1&&window.R1.defGroup&&window.R1.defGroup()))||D.groups[0]; y=+y||LASTY;
  // QA-04: wartości ograniczone do programów lekowych grupy (nie cała substancja we wszystkich programach)
  const GP=({imm:["B.33","B.35","B.36","B.47","B.32","B.55"],ad:["B.124"],cll:["B.79"],ova:["B.50"],pd:["B.90"],mig:["B.133"],hcv:["B.71"],eye:["B.70"]})[g.id]||null;
  const yr=(k,yy)=>{if(!GP) return M[k]&&M[k].yearly[yy]?M[k].yearly[yy]:null; const rr=((M[k]||{}).programme||[]).filter(x=>x[0]===yy&&GP.includes(x[1])); return rr.length?[rr.reduce((s,x)=>s+x[3],0),rr.reduce((s,x)=>s+x[4],0)]:null;};
  const tot=yy=>g.mols.reduce((s,k)=>s+(yr(k,yy)?yr(k,yy)[0]:0),0), totp=yy=>g.mols.reduce((s,k)=>s+(yr(k,yy)?yr(k,yy)[1]:0),0);
  const T=tot(y),T0=tot(y-1),TP=totp(y),TP0=totp(y-1);
  const rows=g.mols.map(k=>{const a=yr(k,y),b=yr(k,y-1); const sh=a&&T?a[0]/T:null, sh0=b&&T0?b[0]/T0:null; return {k,label:M[k].label,co:molCos(k),sel:!!CF()&&molCo(k)===CF(),r:a?a[0]:null,p:a?a[1]:null,r0:b?b[0]:null,sh,sh0,dpp:sh!=null&&sh0!=null?(sh-sh0)*100:null,psh:a&&TP?a[1]/TP:null,g:a&&b&&b[0]?a[0]/b[0]-1:null};});
  const mz=D.mz.current.filter(r=>g.mols.some(k=>mzrx(k).test(r.substance))&&(r.list==="B"||g.id==="eye"?r.list==="B":true));
  const ann=annBy[LASTANN];
  chart("cpy",{type:"bar",data:{labels:YEARS,datasets:g.mols.map((k,i)=>({label:M[k].label,data:YEARS.map(yy=>yr(k,yy)?yr(k,yy)[0]/1e6:null),backgroundColor:CF()&&molCo(k)===CF()?acc():PAL[(i+3)%PAL.length]}))},options:{maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,title:{display:true,text:"mln zł"}}},plugins:{legend:{labels:{boxWidth:10}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${nf(c.raw,2)} mln zł`,footer:()=>NFZ_SRC+" · pobrano "+D.meta.nfz_retrieved}}}}});
  chart("cps",{type:"doughnut",data:{labels:rows.filter(r=>r.r).map(r=>r.label),datasets:[{data:rows.filter(r=>r.r).map(r=>r.r),backgroundColor:rows.filter(r=>r.r).map((r,i)=>r.sel?acc():PAL[(i+3)%PAL.length])}]},options:{maintainAspectRatio:false,plugins:{legend:{position:"right",labels:{boxWidth:10}},tooltip:{callbacks:{label:c=>`${c.label}: ${nf(100*c.raw/T,1)}%`,footer:()=>NFZ_SRC+" · pobrano "+D.meta.nfz_retrieved}}}}});
  return `<h1>Konkurencja i udziały</h1><p class="sub">Udział = udział w wartości refundacji NFZ w programach lekowych w ramach wybranej grupy substancji (nie udział w sprzedaży rynkowej – ta nie jest publicznie dostępna).</p>
  ${window.R1&&window.R1.progTabs?window.R1.progTabs(g.id):""}
  <div class="tbar"><b>${esc(g.label)}</b><span class="grow"></span>Rok: <select onchange="location.hash='#/konkurencja/${g.id}/'+this.value">${YEARS.map(x=>`<option ${x===y?"selected":""}>${x}</option>`).join("")}</select> ${({imm:[["B.33","RZS"],["B.35","ŁZS"],["B.36","ZZSK"],["B.47","łuszczyca"],["B.32","Crohn"],["B.55","WZJG"]],ad:[["B.124","AZS"]],cll:[["B.79","CLL"]],ova:[["B.50","rak jajnika"]],pd:[["B.90","Parkinson"]],mig:[["B.133","migrena"]],hcv:[["B.71","HCV"]],eye:[["B.70","siatkówka"]]}[g.id]||[]).map(([p,l])=>`<a class="btn sm ghost" href="#/placowki/p/${p}" title="Placówki realizujące program ${p}">Placówki ${p} (${l}) →</a>`).join(" ")}</div>
  <div class="grid g2"><div class="card"><h2>Refundacja NFZ wg substancji${GP?" – tylko "+GP.join(", "):""}</h2><div class="chartbox tall"><canvas id="cpy"></canvas></div>${S(NFZ_SRC,"https://api.nfz.gov.pl/app-stat-api-pl",D.meta.nfz_retrieved)}</div>
  <div class="card"><h2>Udział w refundacji grupy ${y}</h2><div class="chartbox tall"><canvas id="cps"></canvas></div><p class="muted">Suma grupy ${y}: ${V(pln(T),NFZ_SRC,D.meta.nfz_retrieved)} (${y-1}: ${pln(T0)}), pacjenci (suma po substancjach): ${nf(TP)}.</p></div></div>
  <div class="card"><h2>Tabela udziałów ${y}</h2>${table([{h:"Substancja",k:"label",f:x=>`<a href="#/rynek/${x.k}/${y}">${esc(x.label)}</a>`},{h:"Firma (lista B 2019–2026)",v:x=>x.co.join(", "),f:x=>molChip(x.k)},{h:"Refundacja "+y,n:1,v:x=>x.r,f:x=>V(pln(x.r),NFZ_SRC,D.meta.nfz_retrieved,nfzUrl(x.k))},{h:"r/r",n:1,v:x=>x.g,f:x=>x.g==null?`<span class="alt" title="brak wartości w roku bazowym">nowa / –</span>`:`<span class="${x.g>=0?"pos":"neg"}">${pct(x.g)}</span>`},{h:"Udział (wartość)",n:1,v:x=>x.sh,f:x=>x.sh==null?ND:nf(100*x.sh,1)+"%"},{h:"Zmiana udziału (pp)",n:1,v:x=>x.dpp,f:x=>x.dpp==null?ND:`<span class="${x.dpp>=0?"pos":"neg"}">${x.dpp>0?"+":""}${nf(x.dpp,1)}</span>`},{h:"Pacjenci "+y,n:1,v:x=>x.p,f:x=>V(nf(x.p),NFZ_SRC,D.meta.nfz_retrieved,nfzUrl(x.k))},{h:"Udział (pacjenci, NFZ app-stat "+y+")",n:1,v:x=>x.psh,f:x=>x.psh==null?ND:nf(100*x.psh,1)+"%"}],rows,{name:"udzialy_"+g.id+"_"+y,search:false,rowClass:x=>x.sel?"sel":"",src:S(NFZ_SRC+" – udziały wyliczone z wartości refundacji poszczególnych substancji"+(GP?" wyłącznie w programach "+GP.join(", ")+" (drug-costs-by-drug-program-and-active-substance); pacjenci sumowani po programach":""),null,D.meta.nfz_retrieved)})}</div>
  <div class="card"><h2>Produkty grupy w obwieszczeniu MZ ${LASTANN}</h2>${table([{h:"Substancja",k:"substance"},{h:"Nazwa",k:"name"},{h:"Firma",v:x=>rc(x),f:x=>coChip(rc(x))||ND},{h:"Opakowanie",k:"pack"},{h:"EAN",k:"gtin"},{h:"Lista",k:"list"},{h:"Program",v:x=>x.programme,f:x=>x.programme?esc(PFM(x.programme)):"–"},{h:"Urzędowa cena zbytu",n:1,v:x=>x.official_price,f:x=>V(nf(x.official_price,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Limit",n:1,v:x=>x.limit_value,f:x=>V(nf(x.limit_value,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Grupa limitowa",k:"limit_group"}],mz,{name:"obwieszczenie_"+g.id,rowClass:x=>CF()&&rc(x)===CF()?"sel":"",src:S("Obwieszczenie MZ "+LASTANN+" – ceny za opakowanie, nieporównywalne bez dawkowania",ann.page,ann.retrieved)})}</div>`;
}
// ---------- REFUNDACJA ----------
function vReimb(brand){
  const ann=annBy[LASTANN]; const c=CF(); const cur=D.mz.current.filter(r=>!c||rc(r)===c); const PR=cProds(c);
  const brands=PR.map(p=>p.brand).sort((a,b)=>a.localeCompare(b,"pl"));
  const ab=D.aotmit.filter(a=>!c||aotCos(a).includes(c));
  annChart("rbm",c); aotChart("rba",c);
  const decRows=cur.flatMap(r=>decisions(r).map(d=>({...d,brand:r.brand,co:rc(r),name:r.name,gtin:r.gtin,pack:r.pack})));
  const evFilter=brand||"";
  return `<h1>Refundacja</h1><p class="sub">Status na podstawie obwieszczenia MZ ${annLink(LASTANN)} (wykaz od 1.10.2026), historia ${D.meta.announcements.length} obwieszczeń ${D.meta.announcements[0].announcement_date} – ${LASTANN} (listy A1, B, C), AOTMiT: ${nf(D.aotmit.length)} zleceń MZ 2019–2026 z rekomendacjami Prezesa i stanowiskami/opiniami Rady Przejrzystości.${c?" Zawężono do: "+esc(c)+".":" Cały rynek – wybierz firmę u góry, aby zawęzić."}</p>
  <div class="grid g2"><div class="card"><h2>Nowe refundacje i wykreślenia wg obwieszczenia${c?" – "+esc(c):""}</h2><div class="chartbox"><canvas id="rbm"></canvas></div>${S("Zdarzenia wyliczone przez porównanie kolejnych obwieszczeń MZ (GTIN × lista)","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",ann.retrieved)}</div>
  <div class="card"><h2>AOTMiT – wyniki wg roku zlecenia${c?" – "+esc(c):""}</h2><div class="chartbox"><canvas id="rba"></canvas></div>${S(AOTSRC+" – wynik wyodrębniony automatycznie z PDF (rekomendacja Prezesa; gdy brak – stanowisko/opinia Rady Przejrzystości)","https://bip.aotm.gov.pl/zlecenia-mz-2026",AOTRETR())}</div></div>
  <div class="card"><h2>Aktualna lista – ${c?esc(c):"pełny wykaz (A1, B, C)"}</h2>${table([{h:"Marka",k:"brand",f:x=>PB[x.brand]?`<a href="#/produkty/${PB[x.brand].id}">${esc(x.brand)}</a>`:esc(x.brand)},{h:"Firma",v:x=>rc(x),f:x=>coChip(rc(x))||ND},{h:"Substancja",k:"substance"},{h:"EAN",k:"gtin"},{h:"Nazwa",k:"name"},{h:"Opakowanie",k:"pack"},{h:"Lista",k:"list"},{h:"Program B.xx / wskazanie",v:x=>x.programme||x.indications,f:x=>`<span title="${esc(x.indications||"")}">${esc(PFM(x.programme||x.indications||"").slice(0,160))}</span>`},{h:"Data decyzji (od)",k:"decision_from"},{h:"Odpłatność",k:"payment_level"},{h:"Urzędowa cena zbytu",n:1,v:x=>x.official_price,f:x=>V(nf(x.official_price,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Limit",n:1,v:x=>x.limit_value,f:x=>V(nf(x.limit_value,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Dopłata",n:1,v:x=>x.copay,f:x=>x.copay==null?ND:V(nf(x.copay,2)+" zł","Obwieszczenie MZ "+LASTANN,ann.retrieved,ann.page)},{h:"Grupa limitowa",k:"limit_group"}],cur,{name:"lista_"+LASTANN,csvExtra:[{h:"Cena hurtowa brutto",v:x=>x.wholesale_price??""},{h:"Cena detaliczna",v:x=>x.retail_price??""},{h:"Okres decyzji",v:x=>x.decision_period??""},{h:"Wskazania (pełny tekst)",v:x=>x.indications??""},{h:"Off-label",v:x=>x.offlabel??""}],src:S("Obwieszczenie MZ "+LASTANN+" (xlsx)",ann.url,ann.retrieved)})}</div>
  <div><div class="card"><h2>Decyzje refundacyjne – daty końca (per program)</h2>${table([{h:"Marka",k:"brand"},{h:"Firma",k:"co"},{h:"EAN",k:"gtin"},{h:"Opak.",k:"pack"},{h:"Program",v:x=>x.prog,f:x=>x.prog?esc(PFM(x.prog)):"–"},{h:"Od",k:"from"},{h:"Okres",k:"period"},{h:"Do (wyliczone)",k:"to",f:x=>x.to?`<b class="${x.to<=addM(TODAY,12)?"warn":""}">${x.to}</b>`:`<span class="alt" title="Brak daty wejścia lub okresu w obwieszczeniu">${x.period?esc(String(x.period)):"nie wyliczono – brak okresu"}</span>`}],decRows,{name:"decyzje_refundacyjne",src:S("Obwieszczenie MZ "+LASTANN+": kolumny „Data wejścia w życie decyzji” i „Okres obowiązywania decyzji”; data końca = od + okres − 1 dzień",ann.page,ann.retrieved)})}</div>
  </div>
  <div class="card"><h2>Pipeline AOTMiT${c?" – "+esc(c):" – wszystkie zlecenia MZ 2019–2026"}</h2>${table([{h:"Zlecenie",k:"order_no",f:x=>`<a href="${esc(x.source_url)}" target="_blank">${esc(x.order_no)}</a>`},{h:"Wpływ",k:"received",empty:"nie podano w BIP"},{h:"Produkt",v:aotName,f:x=>`<span title="${esc(x.title)}">${esc(aotName(x).slice(0,80))}</span>`},{h:"Substancja",k:"substance",empty:"–"},{h:"Firma",k:"company",f:x=>x.company?esc(x.company):'<span class="muted">nieprzypisana</span>'},{h:"Wskazanie / zakres",k:"indication",f:x=>`<span title="${esc(x.indication||"")}">${esc((x.indication||"").slice(0,140))}</span>`},{h:"Kategoria",k:"category",empty:"–"},{h:"Status",v:x=>aotStatus(x),f:x=>aotLabel[aotStatus(x)]+(window.R1?window.R1.aotExtra(x):"")},{h:"Rekomendacja Prezesa",v:x=>[x.rek_no,x.rek_date,x.rek_outcome].filter(Boolean).join(" "),f:x=>rekHtml(x)||"–"},{h:"Stanowisko/opinia RP",v:x=>[x.srp_type,x.srp_no,x.srp_date,x.srp_outcome].filter(Boolean).join(" "),f:x=>srpHtml(x)||"–"}],ab,{name:"aotmit_zlecenia",csvExtra:[{h:"Tytuł",v:x=>x.title},{h:"GTIN",v:x=>x.gtins||""},{h:"Podstawa prawna",v:x=>x.legal_basis||""},{h:"Podstawa przypisania firmy",v:x=>x.company_basis||""},{h:"PDF rekomendacji",v:x=>x.rek_url||""},{h:"Werdykt Prezesa (fragment)",v:x=>x.rek_verdict||""},{h:"PDF RP",v:x=>x.srp_url||""},{h:"Werdykt RP (fragment)",v:x=>x.srp_verdict||""}],src:S(AOTSRC+" (lista zleceń 2019–2026 + PDF rekomendacji Prezesa i stanowisk/opinii Rady Przejrzystości)","https://bip.aotm.gov.pl/zlecenia-mz-2026",AOTRETR())})}</div>
  <div class="card"><h2>Oś czasu zmian – zdarzenia strukturalne (wszystkie obwieszczenia) + wszystkie zmiany z ${LASTANN}</h2><p class="muted">Zmiany dopłat, limitów i cen hurtowych/detalicznych ze starszych obwieszczeń – w historii produktu (ładowana na żądanie) i w bazie SQLite (mz_events).</p><div class="tbar">Marka: <select onchange="location.hash='#/refundacja/'+this.value">${c?`<option value="">Wybrana firma: ${esc(c)}</option>`:""}<option value="*" ${brand==="*"||(!c&&!brand)?"selected":""}>Wszystkie</option>${brands.map(b=>`<option ${b===brand?"selected":""}>${b}</option>`).join("")}</select></div>
  ${table([{h:"Obwieszczenie",k:"announcement_date",f:x=>annLink(x.announcement_date)},{h:"Marka",k:"brand"},{h:"Firma",v:x=>rc(x)},{h:"Substancja",k:"substance"},{h:"EAN",k:"gtin"},{h:"Nazwa",k:"name"},{h:"Opak.",k:"pack"},{h:"Lista",k:"list"},{h:"Zdarzenie",k:"event"},{h:"Było",k:"old",empty:"–"},{h:"Jest",k:"new",empty:"–"}],D.mz.events.filter(e=>evFilter==="*"?true:evFilter?e.brand===evFilter:(!c||rc(e)===c)),{name:"zmiany_obwieszczen",rowClass:x=>c&&rc(x)===c?"sel":"",src:S("Zdarzenia wyliczone przez porównanie kolejnych obwieszczeń MZ (data = obwieszczenie, w którym zmiana wystąpiła po raz pierwszy)","https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych",ann.retrieved)})}</div>`;
}
// ---------- PRZETARGI ----------
function vTenders(woj){
  const subs=TEDS.slice().sort(); const c=CF(); const cs=tedSubs(c);
  const st=window.__tf||(window.__tf={s:"__cf",t:"",v:woj||"",y:""}); if(woj!==undefined) st.v=woj; if(!c&&st.s==="__cf") st.s="";
  const f=D.tenders.filter(t=>(st.s==="__cf"?cs.has(t.s):st.s?t.s===st.s:true)&&(st.t==="open"?t.t.startsWith("cn")&&t.dl&&t.dl>=TODAY:st.t==="cn"?t.t.startsWith("cn"):st.t==="can"?t.t.startsWith("can"):true)&&(!st.v||t.v===st.v)&&(!st.y||t.d.startsWith(st.y)));
  const byB={},byW={}; const CW={}; D.tenders.forEach(t=>{if(t.v&&t.c) CW[t.c.toLowerCase()]=t.v;});
  f.forEach(t=>{const b=byB[t.b]||(byB[t.b]={b:t.b,c:t.c,v:t.v||CW[(t.c||"").toLowerCase()]||"–",n:0,can:0,val:0,s:new Set()}); b.n++; b.s.add(t.s); if(t.t.startsWith("can")){b.can++; if(t.lv) b.val+=t.lv;}
    if(t.t.startsWith("can")&&t.w) t.w.split("; ").forEach(w=>{const k=w.trim().toLowerCase().replace(/^\d+\.\s*/,"").slice(0,60); const x=byW[k]||(byW[k]={w:w.replace(/^\d+\.\s*/,""),n:0,val:0,s:new Set()}); x.n++; x.s.add(t.s); if(t.lv&&!t.w.includes("; ")) x.val+=t.lv; else if(t.lv) {x.sh=(x.sh||0)+t.lv; x.nsh=(x.nsh||0)+1;} else x.nv=(x.nv||0)+1;});});
  const set=(k,v)=>`window.__tf.${k}=this.value;location.hash='#/przetargi/'+encodeURIComponent(window.__tf.v);dispatchEvent(new HashChangeEvent('hashchange'))`;
  const tsrc=S("TED API v3 (ogłoszenia z Polski od 2023-01-01; dopasowanie po nazwie substancji w tytule/opisie części). Zwycięzcy części – tylko z ogłoszeń w formacie eForms (od ok. lutego 2024); 372 starsze ogłoszenia o udzieleniu zamówienia (2023 – styczeń 2024, format sprzed eForms) nie mają w API podziału na części ani nazw wykonawców i nie są pokazywane",D.meta.ted_url,D.meta.ted_retrieved);
  const vs=[...new Set(D.tenders.map(t=>t.v).filter(Boolean))].sort();
  const open=f.filter(t=>t.t.startsWith("cn")&&t.dl&&t.dl>=TODAY).length;
  return `<h1>Przetargi szpitalne</h1><p class="sub">Ogłoszenia i wyniki z TED (Dz.Urz. UE) dla wybranych substancji (obszary terapeutyczne), od 2023-01-01${c?` (domyślnie zawężone do substancji produktów: ${esc(c)})`:""}. Wartości = „tender-value” z TED (kwota oferty, podstawa VAT nieokreślona w API). Przetargi poniżej progów UE (BZP) – brak danych.</p>
  <div class="tbar">Substancja: <select onchange="${set("s")}">${c?`<option value="__cf" ${st.s==="__cf"?"selected":""}>Substancje produktów: ${esc(c)}</option>`:""}<option value="" ${st.s===""?"selected":""}>Wszystkie</option>${subs.map(s=>`<option ${s===st.s?"selected":""}>${s}</option>`).join("")}</select>
  Typ: <select onchange="${set("t")}"><option value="">wszystkie</option><option value="open" ${st.t==="open"?"selected":""}>otwarte (termin ≥ dziś)</option><option value="cn" ${st.t==="cn"?"selected":""}>ogłoszenia</option><option value="can" ${st.t==="can"?"selected":""}>wyniki (udzielone)</option></select>
  Województwo: <select onchange="window.__tf.v=this.value;location.hash='#/przetargi/'+encodeURIComponent(this.value)"><option value="">wszystkie</option>${vs.map(v=>`<option ${v===st.v?"selected":""}>${v}</option>`).join("")}</select>
  Rok: <select onchange="${set("y")}"><option value="">wszystkie</option>${["2023","2024","2025","2026"].map(y=>`<option ${y===st.y?"selected":""}>${y}</option>`).join("")}</select></div>
  <div class="grid g4"><div class="card kpi"><div class="l">Części przetargów</div><div class="v">${V(nf(f.length),"TED API v3",D.meta.ted_retrieved)}</div></div><div class="card kpi"><div class="l">Otwarte (termin ≥ ${TODAY})</div><div class="v">${V(nf(open),"TED API v3",D.meta.ted_retrieved)}</div></div><div class="card kpi"><div class="l">Wyniki (udzielone)</div><div class="v">${V(nf(f.filter(t=>t.t.startsWith("can")).length),"TED API v3",D.meta.ted_retrieved)}</div></div><div class="card kpi"><div class="l">Zamawiający (szpitale)</div><div class="v">${V(nf(Object.keys(byB).length),"TED API v3",D.meta.ted_retrieved)}</div></div></div>
  <div class="card"><h2>Części przetargów</h2>${table([{h:"Data",k:"d"},{h:"Typ",v:x=>x.t,f:x=>x.t.startsWith("can")?'<span class="chip pos">wynik</span>':x.t.startsWith("cn")?(x.dl&&x.dl>=TODAY?'<span class="chip warn">otwarty</span>':'<span class="chip">ogłoszenie</span>'):`<span class="chip">${esc(x.t)}</span>`},{h:"Substancja",k:"s"},{h:"Zamawiający",k:"b"},{h:"Miasto",k:"c"},{h:"Województwo",v:x=>x.v||CW[(x.c||"").toLowerCase()]||"",f:x=>x.v?esc(x.v):CW[(x.c||"").toLowerCase()]?`${esc(CW[(x.c||"").toLowerCase()])} <span class="muted" title="TED nie podaje regionu NUTS; przypisano po mieście zamawiającego (inne ogłoszenia z tego miasta)">(wg miasta)</span>`:'<span class="muted">TED: brak NUTS</span>'},{h:"Część",k:"lt",f:x=>`<span title="${esc(x.ld||"")}">${esc((x.lt||"").slice(0,120))}</span>`},{h:"Termin ofert",k:"dl",empty:"–"},{h:"Wartość oferty (TED)",n:1,v:x=>x.lv,f:x=>x.lv==null?(x.t.startsWith("can")?(x.tv?`<span class="muted" title="TED nie podaje kwoty dla tej części – pokazano wartość całego ogłoszenia (wszystkie części)">całe ogł.: ${V(nf(x.tv,2)+" zł","TED API v3 – total-value ogłoszenia "+x.p,D.meta.ted_retrieved,D.meta.ted_notice_url+x.p)}</span>`:'<span class="muted">TED: kwota nieujawniona w ogłoszeniu</span>'):'<span class="muted">ogłoszenie – kwota znana po wyniku</span>'):V(nf(x.lv,2)+" zł","TED API v3 – tender-value dla części "+x.l,D.meta.ted_retrieved,D.meta.ted_notice_url+x.p)},{h:"Wykonawca",k:"w",empty:"–"},{h:"Ogłoszenie",k:"p",f:x=>`<a href="${D.meta.ted_notice_url+x.p}" target="_blank">${x.p}</a>`}],f,{name:"przetargi_ted",limit:800,src:tsrc})}</div>
  <div class="grid g2"><div class="card"><h2>Wg zamawiającego (szpital)</h2>${table([{h:"Zamawiający",k:"b"},{h:"Miasto",k:"c"},{h:"Woj.",k:"v"},{h:"Części",n:1,k:"n"},{h:"Wyniki",n:1,k:"can"},{h:"Suma ofert w wynikach",n:1,v:x=>x.val||null,f:x=>x.val?V(nf(x.val,2)+" zł","TED API v3 – suma tender-value",D.meta.ted_retrieved):x.can?'<span class="muted">TED: kwota nieujawniona</span>':'<span class="muted">brak wyników (tylko ogłoszenia)</span>'},{h:"Substancje",v:x=>[...x.s].join(", ")}],Object.values(byB),{name:"przetargi_wg_szpitala",src:tsrc})}</div>
  <div class="card"><h2>Wg wykonawcy (wyniki)</h2>${table([{h:"Wykonawca",k:"w"},{h:"Części wygrane",n:1,k:"n"},{h:"Suma ofert (części z 1 wykonawcą)",n:1,v:x=>x.val||x.sh||null,f:x=>x.val?V(nf(x.val,2)+" zł","TED API v3 – suma tender-value",D.meta.ted_retrieved)+(x.sh?`<div class="muted" style="font-size:11px">+ ${nf(x.sh/1e3,0)} tys. zł w ${x.nsh} częściach wspólnych</div>`:""):x.sh?`<span class="muted" title="części z kilkoma wykonawcami – kwota całej części, nie udział wykonawcy">części wspólne: ${V(nf(x.sh,2)+" zł","TED API v3 – tender-value części z wieloma wykonawcami",D.meta.ted_retrieved)} (${x.nsh})</span>`:`<span class="muted">TED: kwota nieujawniona (${x.nv||x.n} cz.)</span>`},{h:"Substancje",v:x=>[...x.s].join(", ")}],Object.values(byW),{name:"przetargi_wg_wykonawcy",src:tsrc})}</div></div>`;
}
// ---------- ALERTY ----------
function vAlerts(){const c=CF(); const A=buildAlerts(c); return `<h1>Alerty i wnioski${c?" – "+esc(c):" – cały rynek"}</h1><p class="sub">Generowane automatycznie wyłącznie z danych (AOTMiT, obwieszczenia MZ, NFZ, TED). Każdy alert ma źródło. Brak interpretacji niepopartej danymi.</p>
 <div class="grid g2"><div>${A.filter((a,i)=>i%2===0).map(alertHtml).join("")}</div><div>${A.filter((a,i)=>i%2===1).map(alertHtml).join("")}</div></div>`;}
// ---------- ŹRÓDŁA I LUKI ----------
// QA-10: licencje / warunki źródeł
const LIC=[["dane.gov.pl (NFZ, MZ, GUS)","Informacja publiczna udostępniana do ponownego wykorzystania na zasadach ustawy z 11.08.2021 o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego oraz regulaminu portalu dane.gov.pl; obowiązek wskazania źródła i daty wytworzenia/pozyskania, bez modyfikacji sensu."],
 ["NFZ (app-stat, raporty refundacyjne, Zarządzenia/umowy)","Informacja publiczna NFZ – ponowne wykorzystanie z podaniem źródła i daty pobrania; NFZ nie publikuje komórek z liczbą pacjentów <5."],
 ["MZ (obwieszczenia refundacyjne, gov.pl)","Akty urzędowe – nie są przedmiotem prawa autorskiego (art. 4 pr. aut.); treści gov.pl na warunkach serwisu (podanie źródła)."],
 ["AOTMiT BIP","Informacja publiczna (BIP) – dokumenty urzędowe; podawane źródło i data."],
 ["URPL (Rejestr Produktów Leczniczych)","Rejestr publiczny – dane podmiotów odpowiedzialnych; podawane źródło i data pobrania."],
 ["GUS BDL","Dane statystyki publicznej – ponowne wykorzystanie z podaniem źródła (GUS, BDL)."],
 ["TED (Dziennik Urzędowy UE)","Ponowne wykorzystanie dozwolone na podstawie decyzji Komisji 2011/833/UE (z podaniem źródła); © Unia Europejska."],
 ["EMA","Treści EMA – ponowne wykorzystanie z podaniem źródła zgodnie z informacją prawną EMA (© European Medicines Agency)."],
 ["ClinicalTrials.gov (NLM)","Dane w domenie publicznej wg Terms and Conditions ClinicalTrials.gov; wymagane wskazanie źródła i daty pobrania; dane kontaktowe usunięte."],
 ["Prasa / serwisy branżowe","Wyłącznie tytuł, krótki lead i link do oryginału (prawo cytatu / prawo do informacji); pełne treści nie są kopiowane."]];
function licOf(x){const t=((x.name||"")+" "+(x.url||"")).toLowerCase(); const m=[[/ted\.europa|\bted\b/,6],[/clinicaltrials/,8],[/ema\.europa|\bema\b/,7],[/dane\.gov|zb\.|zbiór/,0],[/gus|bdl|stat\.gov/,5],[/aotm/,3],[/urpl|rejestry\.ezdrowie|rpl/,4],[/nfz|app-stat/,1],[/gov\.pl|mz\b|obwieszcz|ministerstw/,2],[/prasa|rynekzdrowia|pulsmedycyny|medexpress|termedia|news|pap\.pl|mgr\.farm/,9]].find(([r])=>r.test(t)); return m?LIC[m[1]][1].split(";")[0]:"Informacja publiczna – podawane źródło i data pobrania.";}
// R6h: Źródła – nazwy zrozumiałe dla użytkownika zamiast nazw plików/tabel wewnętrznych
const plainSrc=t=>String(t==null?"":t).replace(/\s*\((?:plik )?data\/[\w.\/-]+\.js\)/g,"").replace(/plik ext\/out\/[\w.-]+\.js, ładowany przez [\w.]+\.js/g,"osobny plik danych ładowany")
  .replace(/w bazie SQLite \(tabela mz_events\) i /g,"").replace(/\b[\w\/-]+\.(?:py|db|sqlite)\b/g,"baza projektu").replace(/\bsource_url\b/g,"adres źródła");
const plainRows=L=>L.map(x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,k==="url"?v:plainSrc(v)])));
function vSources(){
  return `<h1>Źródła i luki danych</h1><p class="sub">Każdy rekord ma adres źródła i datę pobrania. Poniżej źródła, zakres i znane luki.</p>
  <div class="card"><h2>Źródła</h2>${table([{h:"Źródło",k:"name"},{h:"Zakres",k:"scope"},{h:"URL",k:"url",f:x=>`<a href="${esc(x.url)}" target="_blank">${esc(x.url)}</a>`},{h:"Pobrano",k:"retrieved"},{h:"Licencja / warunki ponownego wykorzystania",v:x=>licOf(x),f:x=>esc(licOf(x))}],plainRows(D.sources.concat((window.DATA2||{}).sources||[])),{name:"zrodla",search:false})}</div>
  <div class="card"><h2>Warunki ponownego wykorzystania i zasady prezentacji</h2><ul style="margin:0;padding-left:18px;line-height:1.55">${LIC.map(([k,t])=>`<li><b>${esc(k)}</b>: ${esc(t)}</li>`).join("")}</ul>
   <h3>Zasady stosowane w aplikacji</h3><ul style="margin:0;padding-left:18px;line-height:1.55">
   <li>Liczby pacjentów 1–4 są ukrywane („&lt;5”), także w wartościach pochodnych (%, sumy) – z ukryciem komplementarnym, gdy jedna komórka pozwoliłaby odtworzyć drugą.</li>
   <li>Nazwy placówek i ośrodków badań pochodzą z publicznych rejestrów (NFZ, dane.gov.pl, ClinicalTrials.gov). Nazwy praktyk zawierające imię i nazwisko lekarza są skracane do nazwy podmiotu na etapie eksportu – we wszystkich publicznych plikach danych (kolejki NFZ, placówki, ośrodki badań, sponsorzy i ośrodki badań klinicznych, zwycięzcy przetargów); gdy nazwa składa się tylko z imienia i nazwiska, pokazujemy „(osoba fizyczna – dane usunięte)”. Dotyczy to także spółek cywilnych (s.c.) – ich wspólnikami są osoby fizyczne, więc imiona, nazwiska i inicjały wspólników są usuwane, a zostaje część ogólna/marka, np. „PRYWATNA PRAKTYKA LEKARSKA S.C.”; gdy nic poza nazwiskami nie zostaje: „(spółka cywilna – dane osobowe usunięte)”. Zachowujemy nazwy spółek wpisanych do KRS (sp. z o.o., S.A., sp. j., sp. k., sp. p. itp.) oraz patronów szpitali i instytutów. Lista imion: PESEL, dane.gov.pl zbiór 1501 (stan na 22.01.2025); dane kontaktowe (e-mail, telefon, osoby kontaktowe) z rejestru badań są usuwane przed publikacją.</li>
   <li>Liczby pacjentów od 1 do 4 (NFZ app-stat: demografia, województwa, programy, substancje; NFZ chemioterapia; kalendarz refundacji) są usuwane z publicznych plików danych już na etapie eksportu (wartość null + lista komórek „_lt5”) i wyświetlane jako „&lt;5”. Wartości refundacji i sumy pozostają zgodne z publikacją NFZ; komórki pozwalające odtworzyć ukrytą liczbę są dodatkowo ukrywane w widoku.</li>
   <li>Daty zleceń/rekomendacji AOTMiT: gdy data w BIP jest niespójna (np. data rekomendacji wcześniejsza niż data zlecenia – zlecenie 80/2022: rek. 2021-12-01), aplikacja oznacza ją „data skorygowana” i do obliczeń czasu procedury używa daty stanowiska Rady Przejrzystości / publikacji; wartość źródłowa pozostaje w bazie.</li>
   <li>Artykuły prasowe: pokazywany jest wyłącznie tytuł, krótki lead i link do źródła – bez kopiowania treści.</li>
   <li>Wartości „szacunek” są wyliczone z danych publicznych według opisanej przy nich metody (współczynnik i rok podane w etykiecie).</li></ul></div>
  <div class="card"><h2>Luki i źródła zablokowane</h2>${table([{h:"Obszar",k:"area"},{h:"Luka",k:"gap"},{h:"Skutek w aplikacji",k:"impact"}],plainRows(D.gaps.concat((window.DATA2||{}).gaps||[])),{name:"luki",search:false})}</div>
  <div class="card"><h2>Obwieszczenia MZ w bazie (${D.meta.announcements.length})</h2>${table([{h:"Data obwieszczenia",k:"announcement_date"},{h:"Strona gov.pl",k:"page",f:x=>`<a href="${esc(x.page)}" target="_blank">${esc(x.page.replace("https://www.gov.pl/web/zdrowie/","").slice(0,110))}</a>`},{h:"Plik xlsx",k:"url",f:x=>`<a href="${esc(x.url)}" target="_blank">załącznik</a>`},{h:"Pobrano",k:"retrieved"}],D.meta.announcements.slice().reverse(),{name:"obwieszczenia",search:false})}</div>`;
}
// ---------- start ----------
const th=localStorage.getItem("theme"); if(th) document.documentElement.dataset.theme=th;
const toggleTheme=()=>{const dark=document.documentElement.dataset.theme?document.documentElement.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.dataset.theme=dark?"light":"dark"; localStorage.setItem("theme",document.documentElement.dataset.theme); route();};
$("#themeBtn").onclick=toggleTheme; if($("#themeBtn2")) $("#themeBtn2").onclick=toggleTheme;
matchMedia("(prefers-color-scheme: dark)").addEventListener&&matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(!document.documentElement.dataset.theme) route();});
$("#printBtn").onclick=()=>window.print();
window.APP={vAlertsBase:()=>vAlerts().replace(/^<h1>[\s\S]*?<\/h1>/,""),vComp,vMarket,D,nf,pln,pct,esc,ND,V,S,table,chart,PAL,get ACC(){return acc();},PRODS,PB,CF,css,LASTANN,annBy,route,decisions,addM,TODAY,rc,cProds,molCo,molCos,M,aotStatus,aotCos,aotG,aotName,aotLabel,rekHtml,srpHtml,annLink,tedSubs,TEDS,YEARS,LASTY,yr,groupOf,mzrx,coChip,curGtins,buildAlerts,alertHtml,vTenders,nfzUrl,NFZ_SRC};
$("#buildinfo").textContent=`v3 · dane zbudowane ${D.meta.built} · obwieszczenie MZ ${LASTANN}`;
window.addEventListener("hashchange",route); route();
})();
