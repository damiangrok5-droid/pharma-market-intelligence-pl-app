/* R7: etykieta zakresu przy KAŻDEJ liczbie / wykresie / tabeli (KPI, karta, ryzyko, podsumowanie).
   Mapa stosowalności filtrów globalnych (Firma, Obszar/program, Terytorium, Okres) na element pochodzi z automatycznego
   audytu (reviews/round7/scope_audit.py → js/scope_map.js): element „stosuje filtr”, gdy zmiana filtra zmienia jego treść.
   Gdy filtr jest aktywny, a element go nie stosuje – bursztynowa etykieta ⚠ z wyjaśnieniem (najedź / dotknij).
   Tylko warstwa prezentacji – liczby bez zmian. */
(function(){
const R1=()=>window.R1, esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const MON=/(stycze[nń]|lut[yego]+|marz[ec]+|kwie[cit]+[enia]*|maj[a]?|czerw[ciea]+|lip[ciea]+|sierp[nieia]+|wrze[sś]+[nieia]+|pa[zź]dziernik[a]?|listopad[a]?|grud[nieia]+)/gi;
function vkey(){const h=decodeURIComponent(location.hash.replace(/^#\/?/,"")).split("?")[0]; const s=h.split("/"); const v=s[0]||"kokpit";
  if(s[1]==="f") return v+"/f"; if(s[1]&&/^(produkty|rynek)$/.test(v)) return v+"/x"; return v;}
function ttxt(n){if(!n) return ""; const c=n.cloneNode(true); c.querySelectorAll(".jg,.r7sc,button,a.btn,select,input,.chip.sel").forEach(x=>x.remove()); return c.textContent.replace(/\s+/g," ").trim();}
function titleEl(u){if(u.matches(".takeaway")) return null; if(u.matches(".kpi")) return u.querySelector(":scope > .l")||u.querySelector(".l");
  if(u.matches(".rcard")) return u.querySelector(".rt"); const s=u.matches("details")?u.querySelector(":scope > summary"):null;
  return [...u.querySelectorAll("h1,h2,h3")].find(h=>!h.closest(".kpi")||h.closest(".kpi")===u)||s||u.querySelector(":scope > .l, :scope > .t, :scope > b");}
function nk(t){let s=String(t||""); try{const c=R1()&&R1().CF(); if(c) s=s.split(c).join("{F}");}catch(e){}
  try{(window.PF&&PF.AREAS||[]).forEach(a=>{s=s.split(a[1]).join("{O}");});}catch(e){}
  s=s.replace(/^(największe wskazanie)\s*:.*$/i,"$1"); /* tytuł z nazwą wskazania – klucz stały */
  return s.replace(/B\.\d+/g,"B").replace(MON,"M").replace(/[0-9][0-9\s.,%:\/–\-]*/g,"#").replace(/\s+/g," ").trim().toLowerCase().slice(0,44);}
const SKIP=/^(jak liczon|metodolog|pomoc|objaśnien|filtr „obszar” – mapowanie)/i;
function units(){const app=document.getElementById("app"); if(!app) return []; const v=vkey(); const out=[], occ={};
  app.querySelectorAll(".card, .takeaway").forEach(u=>{
    if(u.matches(".r6tabs, .pfsheet, .jgpop")||u.closest(".ctxbar,#gsearch,.sheet")) return;
    const par=u.parentElement&&u.parentElement.closest(".card"); if(par&&!u.matches(".kpi")) return;
    const te=titleEl(u); const t=u.matches(".takeaway")?"podsumowanie":ttxt(te);
    if(SKIP.test(t)) return;
    const txt=ttxt(u); if(!u.matches(".kpi")&&!/\d/.test(txt)&&!u.querySelector("svg,table,.list,.row,li")) return; /* KPI zawsze – także „brak danych” po filtrze */
    const kind=u.matches(".takeaway")?"sum":u.matches(".kpi")?"kpi":u.matches(".rcard")?"rcard":"card";
    let k=kind==="rcard"?"rcard":kind+":"+nk(t); occ[k]=(occ[k]||0)+1; out.push({el:u,te,kind,key:v+"|"+k+"#"+occ[k],title:t});});
  return out;}
// skrócona nazwa źródła z istniejącego dopisku „Źródło: …” w elemencie
const SRCN=[[/zb\.\s*4897|4897/i,"NFZ zb. 4897"],[/raport refundac|refundacyjn/i,"NFZ raport refundacyjny"],[/app-stat|statystyk[ai] NFZ|JGP|ezdrowie/i,"NFZ statystyki"],[/15035|8475|26565/,"NFZ zb. pacjenci/substancja"],
  [/obwieszcz/i,"MZ obwieszczenie"],[/\bTED\b/,"TED"],[/AOTMiT|Rada Przejrzysto/i,"AOTMiT"],[/URPL|Rejestr Produkt/i,"URPL"],[/\bEMA\b/,"EMA"],[/\bGUS\b/,"GUS"],[/clinicaltrials|ClinicalTrials/i,"ClinicalTrials.gov"],[/umow|UMW/i,"NFZ umowy"]];
function srcOf(u){const s=[...u.querySelectorAll(".src")].map(x=>x.textContent).join(" ")||u.getAttribute("title")||""; if(!s) return ""; for(const [re,n] of SRCN) if(re.test(s)) return n; return "";}
const WHY={co:"Ten element nie zależy od wybranej firmy – pokazuje cały rynek.",pg:"Ten element nie zmienia się po wyborze obszaru/programu.",ow:"Ten element nie dzieli się na województwa – pokazuje całą Polskę.",per:"Ten element ma własny okres (podany w tytule lub źródle), nie okres udziałów z paska."};
function entry(key){const M=window.R7MAP||{}; return M[key]||M[key.replace(/#\d+$/,"#1")]||null;}
function chipFor(u,m){const r1=R1(); if(!r1) return null; const cf=r1.CF(), pf=!!(window.PF&&PF.on()), ow=r1.owList(), per=r1.P4.cur, perOn=per!=="R2026";
  const W=[], P=[]; const why=k=>((m&&m.why&&m.why[k])||WHY[k]);
  if(!m){P.push("zakres niezweryfikowany automatycznie"); return {P,W,src:srcOf(u)};}
  // obszar / program
  if(pf){ if(m.pg) P.push(PF.label()); else W.push(["pg",m.pgc==="nosplit"?(cf&&m.co?"Total "+cf+" – źródło nie dzieli na programy":"Total – źródło nie dzieli na programy"):m.pgc==="market"?"Cały rynek – nie zależy od filtra Obszar":"bez filtra Obszar",why("pg")]); }
  // firma
  if(cf){ if(m.co) P.push(m.pg||!pf?cf+(pf?"":(m.pg?" · wszystkie obszary":"")):"Total "+cf+" (wszystkie obszary)"); else W.push(["co","Cały rynek – nie tylko "+cf,why("co")]); }
  else P.push(pf&&m.pg?"wszystkie firmy":m.pg?"cały rynek · wszystkie obszary":"cały rynek");
  if(cf&&m.co&&!pf&&m.pg&&P[P.length-1]===cf) P[P.length-1]=cf+" · wszystkie obszary";
  // terytorium
  if(ow.length){ if(m.ow) P.push(ow.map(r1.owName).join(", ")); else W.push(["ow","Cała Polska – bez filtra Terytorium",why("ow")]); }
  // okres udziałów
  if(m.per) P.push(r1.L4(per)); else if(perOn) W.push(["per","Okres własny – bez filtra Okres",why("per")]);
  return {P,W,src:srcOf(u)};}
function html(c){return `<span class="r7z">Zakres: ${esc(c.P.join(" · "))}${c.src?` <span class="r7s">· ${esc(c.src)}</span>`:""}</span>`+
  c.W.map(([k,t,w])=>`<button type="button" class="r7w" data-k="${k}" title="${esc(w)}" aria-label="${esc("Uwaga: "+t+". "+w)}">⚠ ${esc(t)}</button>`).join("");}
function pop(b){const o=document.querySelector(".jgpop"); if(o) o.remove(); const p=document.createElement("div"); p.className="jgpop card r7pop"; p.setAttribute("role","note"); p.textContent=b.title; document.body.appendChild(p);
  const r=b.getBoundingClientRect(); p.style.left=Math.max(8,Math.min(innerWidth-296,r.left))+"px"; p.style.top=(r.bottom+6+scrollY)+"px"; setTimeout(()=>document.addEventListener("click",()=>p.remove(),{once:true}));}
let busy=false;
function apply(){if(busy) return; busy=true; let n=0;
  try{ units().forEach(u=>{const m=entry(u.key); const c=chipFor(u.el,m); if(!c) return; const h=html(c);
      let s=u.kind==="sum"?(u.el.nextElementSibling&&u.el.nextElementSibling.matches(".r7sc")?u.el.nextElementSibling:null):u.el.querySelector(":scope > .r7sc")||(u.te&&u.te.parentElement&&u.te.parentElement.querySelector(":scope > .r7sc"));
      if(!s){s=document.createElement("div"); s.className="r7sc"; s.setAttribute("role","note");
        if(u.kind==="sum"){u.el.after(s);} else if(u.te){let a=u.te; while(a.parentElement&&a.parentElement!==u.el&&a.parentElement!==document.body) a=a.parentElement; a.after(s);} else u.el.prepend(s);}
      s.dataset.key=u.key; s.classList.toggle("r7warn",c.W.length>0); s.classList.toggle("r7unk",!m);
      if(s.__h!==h){s.innerHTML=h; s.__h=h; s.querySelectorAll(".r7w").forEach(b=>b.onclick=e=>{e.stopPropagation(); e.preventDefault(); pop(b);});}
      u.el.dataset.r7=u.key; n++;});
  }catch(e){console.warn("r7",e);} setTimeout(()=>busy=false,30); return n;}
// takeaway: etykieta trafia za akapit – trzymaj ją przy nim (units() szuka nadal po .takeaway)
const _u=units; 
{const W1=window.R1; if(W1&&W1.after&&!W1.after.r7){const o=W1.after; W1.after=function(v,a){o(v,a); try{apply(); [300,900,1800].forEach(t=>setTimeout(apply,t));}catch(e){console.warn("r7",e);}}; W1.after.r7=1;}}
(function(){let tm=null; function obs(){const app=document.getElementById("app"); if(!app||app.r7o) return; app.r7o=1; new MutationObserver(ms=>{if(busy) return; if(ms.every(m=>m.target.closest&&m.target.closest(".r7sc"))) return; clearTimeout(tm); tm=setTimeout(apply,140);}).observe(app,{childList:true,subtree:true});}
  if(document.readyState!=="loading") obs(); else document.addEventListener("DOMContentLoaded",obs);})();
window.R7={units:_u,apply,vkey,nk,chipFor,entry};
})();
