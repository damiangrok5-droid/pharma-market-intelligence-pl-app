/* R6h: globalny filtr Obszar terapeutyczny → programy lekowe B.xx (multi) – wspólny stan dla wszystkich widoków.
   Stan: localStorage "pmi_pf" + URL ?ta=<obszar>&prog=B.47,B.33 (URL ma pierwszeństwo). Brak wyboru = wszystkie programy.
   Mapowanie obszar → programy: reviews/round6/obszar_mapping.md (programy MZ z wykazu, linie z kodami ICD-10). */
(function(){
const AREAS=[["reumatologia","Reumatologia",["B.33","B.35","B.36","B.82"]],["dermatologia","Dermatologia",["B.47","B.124","B.161"]],
 ["gastroenterologia","Gastroenterologia",["B.32","B.55"]],["hematologia","Hematologia",["B.12","B.54","B.65","B.79","B.114"]],
 ["onkologia","Onkologia",["B.6","B.9","B.50","B.56","B.59"]],["neurologia","Neurologia",["B.29","B.90","B.133"]],
 ["okulistyka","Okulistyka",["B.70","B.105"]],["pulmonologia","Pulmonologia",["B.31","B.44"]],
 ["choroby-rzadkie","Choroby rzadkie",["B.15","B.102","B.112"]],["hepatologia","Hepatologia",["B.71"]]];
const AM=Object.fromEntries(AREAS.map(a=>[a[0],a])); const P2A={}; AREAS.forEach(([k,,L])=>L.forEach(p=>P2A[p]=k));
const R=()=>window.DATAR1||{}; const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const pnum=p=>parseInt(String(p).slice(2))||0;
const allProgs=()=>{const s=new Set(); Object.values(R().ind||{}).forEach(o=>(o.pp||[]).forEach(p=>s.add(p))); return [...s].sort((a,b)=>pnum(a)-pnum(b));};
const pname=p=>{const n=(window.PROGN&&PROGN[p]&&PROGN[p][0])||""; return String(n).replace(/^Leczenie (chorych |pacjentów )?(na |z |ze )?/i,"").replace(/\s*\(ICD.*$/,"").trim()||p;};
let S={ta:"",prog:[]};
try{const j=JSON.parse(localStorage.getItem("pmi_pf")||"null"); if(j&&typeof j==="object") S={ta:AM[j.ta]?j.ta:"",prog:Array.isArray(j.prog)?j.prog.filter(x=>/^B\.\d+$/.test(x)):[]};}catch(e){}
try{const u=new URLSearchParams(location.search); if(u.has("ta")||u.has("prog")){S={ta:AM[u.get("ta")]?u.get("ta"):"",prog:(u.get("prog")||"").split(",").filter(x=>/^B\.\d+$/.test(x))};}}catch(e){}
let bypass=false;
const eff=()=>{if(bypass) return null; if(S.prog.length) return S.prog; if(S.ta) return AM[S.ta][2]; return null;};
const on=()=>!!eff();
const progOk=p=>{const e=eff(); return !e||e.includes(p);};
const indOk=i=>{const e=eff(); if(!e) return true; const pp=((R().ind||{})[i]||{}).pp||[]; return pp.some(p=>e.includes(p));};
let subC=null; const subSet=()=>{const e=eff(); if(!e) return null; const k=e.join(","); if(subC&&subC.k===k) return subC.v; const v=new Set(); Object.entries(R().ind||{}).forEach(([i,o])=>{if((o.pp||[]).some(p=>e.includes(p))) ((R().indted||{})[i]||[]).forEach(s=>v.add(String(s).toLowerCase()));}); subC={k,v}; return v;};
const subOk=s=>{const v=subSet(); return !v||v.has(String(s||"").toLowerCase());};
const key=()=>(eff()||[]).join(",");
const label=()=>{if(S.prog.length){const ta=S.ta&&AM[S.ta]?AM[S.ta][1]+": ":""; return ta+(S.prog.length<=3?S.prog.join(", "):S.prog.slice(0,2).join(", ")+" +"+(S.prog.length-2));} if(S.ta) return AM[S.ta][1]; return "";};
const longLabel=()=>{const e=eff(); if(!e) return "wszystkie programy"; return (S.ta&&!S.prog.length?AM[S.ta][1]+" – ":"")+e.map(p=>p+" "+pname(p)).join("; ");};
function save(){try{localStorage.setItem("pmi_pf",JSON.stringify(S));}catch(e){}
  try{const u=new URL(location.href); u.searchParams.delete("ta"); u.searchParams.delete("prog"); if(S.ta) u.searchParams.set("ta",S.ta); if(S.prog.length) u.searchParams.set("prog",S.prog.join(",")); history.replaceState(history.state,"",u.pathname+u.search+u.hash);}catch(e){}
  subC=null; try{if(window.R1&&R1.facRows) R1.facRows.cache=null;}catch(e){} window.dispatchEvent(new HashChangeEvent("hashchange"));}
function set(ta,prog){S={ta:AM[ta]?ta:"",prog:(prog||[]).filter(x=>/^B\.\d+$/.test(x))}; save();}
function clear(){set("",[]);}
function setBypass(b){bypass=!!b; subC=null; try{if(window.R1&&R1.facRows) R1.facRows.cache=null;}catch(e){} window.dispatchEvent(new HashChangeEvent("hashchange"));}
// arkusz wyboru (desktop: panel; telefon: arkusz od dołu)
function sheet(){let d=document.getElementById("pfsheet"); if(d) d.remove();
  const AP=allProgs(); const c=window.R1&&R1.CF&&R1.CF(); let mine=new Set();
  try{if(c&&window.DATAR1){const was=bypass; bypass=true; mine=new Set(R1.myProgs(c)); bypass=was;}}catch(e){}
  const grp=[...AREAS.map(a=>[a[0],a[1],a[2].filter(p=>AP.includes(p))]),["inne","Inne",AP.filter(p=>!P2A[p])]].filter(g=>g[2].length);
  let ta=S.ta, sel=new Set(S.prog);
  d=document.createElement("div"); d.id="pfsheet"; d.className="pfsheet"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label","Obszar terapeutyczny i programy lekowe");
  const draw=()=>{const q=(d.querySelector("#pfq")||{}).value||"";
    const N=z=>String(z).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l"); const qq=N(q);
    d.innerHTML=`<div class="pfbox"><div class="pfh"><b>Obszar i programy lekowe</b><button class="chip x" id="pfclose" aria-label="Zamknij">✕</button></div>
     <p class="muted" style="margin:4px 0 8px;font-size:12px">1) obszar terapeutyczny → 2) programy B.xx (wiele) → 3) wskazanie wybierasz w widoku (np. Potencjał, Placówki). Brak wyboru = wszystkie programy.${c?` ★ = program, w którym ${esc(c)} ma produkt.`:""}</p>
     <div class="pfareas" role="group" aria-label="Obszar terapeutyczny"><button class="chip ${!ta?"sel":""}" data-ta="">Wszystkie obszary</button>${AREAS.map(a=>`<button class="chip ${ta===a[0]?"sel":""}" data-ta="${a[0]}" aria-pressed="${ta===a[0]}">${esc(a[1])}</button>`).join("")}</div>
     <input type="search" id="pfq" placeholder="Szukaj programu (np. B.47, łuszczyca)…" aria-label="Szukaj programu" value="${esc(q)}">
     <div class="pflist">${grp.filter(g=>!ta||g[0]===ta).map(g=>{const L=g[2].filter(p=>!qq||N(p+" "+pname(p)).includes(qq)); return L.length?`<div class="pfg"><div class="muted pfgl">${esc(g[1])}</div>${L.map(p=>`<label class="pfrow"><input type="checkbox" value="${p}" ${sel.has(p)?"checked":""}> <b>${p}</b> ${esc(pname(p))}${mine.has(p)?" ★":""}</label>`).join("")}</div>`:"";}).join("")||'<p class="muted">Brak programów dla tego wyszukiwania.</p>'}</div>
     <div class="pff"><button class="btn sm ghost" id="pfclr">Wyczyść</button><span class="grow"></span><span class="muted" id="pfcnt">${sel.size?sel.size+" progr.":ta?"cały obszar":"wszystkie"}</span><button class="btn sm" id="pfok">Zastosuj</button></div></div>`;
    const qi=d.querySelector("#pfq"); qi.oninput=()=>{const p=qi.selectionStart; draw(); const n=d.querySelector("#pfq"); n.focus(); try{n.setSelectionRange(p,p)}catch(e){}};
    d.querySelectorAll("[data-ta]").forEach(b=>b.onclick=()=>{ta=b.dataset.ta; if(ta) sel=new Set([...sel].filter(p=>AM[ta][2].includes(p))); draw();});
    d.querySelectorAll(".pfrow input").forEach(x=>x.onchange=()=>{x.checked?sel.add(x.value):sel.delete(x.value); const k=d.querySelector("#pfcnt"); if(k) k.textContent=sel.size?sel.size+" progr.":ta?"cały obszar":"wszystkie";});
    d.querySelector("#pfclose").onclick=()=>d.remove(); d.querySelector("#pfclr").onclick=()=>{d.remove(); clear();};
    d.querySelector("#pfok").onclick=()=>{d.remove(); set(ta,[...sel]);};};
  draw(); d.addEventListener("click",e=>{if(e.target===d) d.remove();}); document.addEventListener("keydown",function k(e){if(e.key==="Escape"){d.remove(); document.removeEventListener("keydown",k);}});
  document.body.appendChild(d); setTimeout(()=>{const b=d.querySelector(".pfareas .sel")||d.querySelector("[data-ta]"); if(b) b.focus();},30);}
window.PF={AREAS,P2A,pname,allProgs,on,eff,progOk,indOk,subOk,key,label,longLabel,set,clear,sheet,setBypass,get bypass(){return bypass},get state(){return {...S}}};
})();
// R6h: mapowanie obszar → programy w widoku Źródła
(function(){function add(){if(!/^#\/zrodla/.test(location.hash)) return; const m=document.querySelector("#app"); if(!m||document.getElementById("pfmap")) return; const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const d=document.createElement("section"); d.className="card"; d.id="pfmap"; d.innerHTML=`<h2>Filtr „Obszar” – mapowanie obszar → programy lekowe</h2><p class="muted">Programy B.xx wg obwieszczenia MZ (załącznik B); wskazania = grupy ICD-10 z NFZ zb. 4897 przypisane do programu; przetargi = substancje refundowane w programie. Kanały RSS/JSON są statyczne i niefiltrowane.</p><div class="tw"><table><thead><tr><th>Obszar</th><th>Programy</th></tr></thead><tbody>${PF.AREAS.map(([k,l,pp])=>`<tr><td>${esc(l)}</td><td>${pp.map(p=>esc(p+" "+PF.pname(p))).join("<br>")}</td></tr>`).join("")}</tbody></table></div>`; m.appendChild(d);}
 window.addEventListener("hashchange",()=>setTimeout(add,700)); window.addEventListener("load",()=>setTimeout(add,1200));})();
