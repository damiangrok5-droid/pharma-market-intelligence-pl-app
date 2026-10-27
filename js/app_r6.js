/* Runda 6 – UX P1: huby nawigacji (stare trasy działają), pasek kontekstu (firma · terytorium · okres),
   globalne wyszukiwanie (Ctrl/Cmd+K), przeniesienie filtrów nad treść, etykiety pól, objaśnienia żargonu,
   Title Case nazw placówek i normalizacja substancji. Tylko warstwa prezentacji – liczby bez zmian. */
(function(){
const A=()=>window.APP;
// ---------- Title Case (nazwy placówek WIELKIMI LITERAMI) ----------
const KEEP=new Set(["SP","ZOZ","SPZOZ","SPSK","SPSK1","SPSK2","USK","UCK","WSS","CSK","WIM","MSWiA","MSWIA","NZOZ","UM","UJ","CM","PAN","PIB","IMID","NIO","II","III","IV","V","VI","VII","IX","X","XI","SA","S.A.","SP.","ZO.O.","NFZ","CZD","IPCZD","ICZMP","WCO","DCO","SCO","KCO","MCO","PCK","PSK","SK","WSZ","WSSZ","SPWSZ","ZZOZ","SPZZOZ","SPSZOZ","WCM","WSM","GCM","ZSM","SSzW","SZPZLO","CMKP","MSW","WAM","ŚCO","LUX","MED"]);
const SMALL=new Set(["i","w","we","z","ze","na","im.","im","dr","dr.","prof.","św.","oraz","do","od","pod","nad","przy","sp.","o.o.","z.o.o.","dla","al.","ul.","nr"]);
function TC(s){if(s==null) return s; s=String(s); if(/[a-ząćęłńóśźż]/.test(s)) return s; // już mieszane
  return s.toLowerCase().split(/(\s+|-|\(|\)|\/|"|\.(?=[a-ząćęłńóśźż]))/).map((w,i)=>{if(!w||/^\s+$|^[-()\/".]$/.test(w)) return w; const U=w.toUpperCase();
    if(KEEP.has(U.replace(/[,.;]$/,""))) return U; if(i>0&&SMALL.has(w)) return w==="sp."?"Sp.":w==="z.o.o."||w==="o.o."?w:w;
    if(/^\d/.test(w)) return w; return w.charAt(0).toUpperCase()+w.slice(1);}).join("").replace(/\bSp\. Z O\.o\./gi,"sp. z o.o.").replace(/ Z O\.o\./g," z o.o.");}
// ---------- normalizacja substancji: Adalimumabum / ADALIMUMABUM / adalimumab → adalimumab ----------
const SUBX={"niwolumab + relatlimab":"nivolumab + relatlimab"};
function SUBN(s){if(!s) return ""; let x=String(s).toLowerCase().trim().replace(/\s*-\s*p\s*-.*$/,"").replace(/\s+\d.*$/,""); if(SUBX[x]) return SUBX[x];
  return x.split(/\s*\+\s*/).map(w=>w.replace(/um$/,"")).join(" + ");}
window.TC=TC; window.SUBN=SUBN;
// ---------- huby ----------
const HUBS=[["kokpit",["kokpit","przeglad","raport"]],["alerty",["alerty","dzialania"]],["news",["news"]],["fokus",["fokus"]],["placowki",["placowki"]],["przetargi",["przetargi"]],
  ["konkurencja",["konkurencja","ruchy","firmy"]],["rynek",["rynek","potencjal","pacjenci","demografia","sciezka"]],["dostep",["dostep","refundacja"]],["produkty",["produkty","rejestr"]],["zrodla",["zrodla"]]];
const HUBOF={}; HUBS.forEach(([h,ks])=>ks.forEach(k=>HUBOF[k]=h));
const HUBL={kokpit:"Kokpit",alerty:"Alerty i działania",news:"News",fokus:"Gdzie się skupić",placowki:"Placówki",przetargi:"Przetargi",konkurencja:"Konkurencja",rynek:"Rynek i pacjenci",dostep:"Dostęp i refundacja",produkty:"Produkty i rejestracje",zrodla:"Źródła i luki"};
const SUBL={kokpit:"Kokpit",przeglad:"Przegląd rynku",raport:"Raport miesięczny",alerty:"Alerty",dzialania:"Lista działań",konkurencja:"Udziały w programach",ruchy:"Ruchy konkurencji",firmy:"Firmy",
  rynek:"Rynek (substancje)",potencjal:"Potencjał",pacjenci:"Pacjenci",demografia:"Demografia",sciezka:"Ścieżka pacjenta",dostep:"Dostęp do rynku",refundacja:"Refundacja (MZ)",produkty:"Produkty",rejestr:"Rejestracje (URPL/EMA)"};
const R1=window.R1;
if(R1){R1.SECT=[["Decyzje",["kokpit","alerty","news"]],["Klienci",["fokus","placowki","przetargi"]],["Rynek",["konkurencja","rynek","dostep","produkty"]],["Informacje",["zrodla"]]];
  R1.TABS=[["kokpit","Kokpit"],["fokus","Fokus"],["placowki","Placówki"],["przetargi","Przetargi"]];
  R1.ICONS=Object.assign({},R1.ICONS||{},{placowki:["sysTeal",'<path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6M12 7v4M10 9h4"/>'],przetargi:["sysOrange",'<path d="M14 3l7 7-4 4-7-7z"/><path d="M10 7l-7 7 3 3 7-7M3 21h10"/>'],
    alerty:["sysRed",'<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>']});}
function wrapNav(){const V3=window.V3; if(!V3||!V3.nav||V3.nav.r6) return; const o=V3.nav;
  V3.nav=function(cur,VIEWS){const L=Object.fromEntries(VIEWS); const hub=HUBOF[cur]||cur; const VV=VIEWS.map(([k,l])=>[k,HUBL[k]||l]);
    o(hub,VV); const t=document.getElementById("navttl"); if(t) t.textContent=(SUBL[cur]&&cur!==hub?HUBL[hub]+" · "+SUBL[cur]:HUBL[cur]||L[cur]||"");};
  V3.nav.r6=1;}
wrapNav();
// ---------- globalne wyszukiwanie ----------
let IDX=null;
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l").replace(/[^a-z0-9.+ ]+/g," ").replace(/\s+/g," ").trim();
function build(){const a=A(); if(!a) return []; const I=[]; const add=(t,label,sub,go,extra,d)=>I.push({t,label,sub,go,d:d||"",l:norm(label),k:norm(label+" "+(sub||"")+" "+(extra||"")+" "+t)});
  const acr=n=>{const w=String(n||"").replace(/[„”"().,]/g," ").split(/\s+/).filter(x=>x.length>2&&!SMALL.has(x.toLowerCase())&&!/^\d/.test(x)); const a=w.map(x=>x[0]).join(""); return a.length>=2&&a.length<=6?a:"";};
  const PN=window.PROGN||{}; const P3=(window.DATA3&&DATA3.progs)||{};
  (window.DATA2&&DATA2.fac||[]).forEach(f=>add("Placówka",TC(f.name)+" – "+TC(f.city||""),"kod NFZ "+(f.code||""),"#/placowki/f/"+encodeURIComponent(f.k),f.code+" "+f.city+" "+acr(f.name)+" "+acr(String(f.name).split(/ W | IM\. /)[0])));
  const F4=window.FAC4897; if(F4&&F4.nm){const have=new Set((DATA2.fac||[]).map(f=>f.k)); Object.entries(F4.nm).forEach(([k,v])=>{if(have.has(k)) return; const city=(v[1]||"").split(",").pop().replace(/\d{2}-\d{3}/,"").trim(); add("Placówka",TC(v[0])+(city?" – "+TC(city):""),"NFZ zb. 4897","#/placowki/f/"+encodeURIComponent(k),k);});}
  const seenB=new Set(); (a.PRODS||[]).filter(p=>p.current!==false).forEach(p=>{const key=p.brand.toLowerCase(); if(seenB.has(key)) return; seenB.add(key); add("Marka",p.brand,(p.inn||"")+" · "+(p.company||""),"#/produkty/"+p.id,SUBN(p.inn));});
  (a.PRODS||[]).filter(p=>p.current===false).forEach(p=>{const key=p.brand.toLowerCase(); if(seenB.has(key)) return; seenB.add(key); add("Marka",p.brand,(p.inn||"")+" · "+(p.company||"")+" · historyczna","#/produkty/"+p.id,SUBN(p.inn));});
  const seenS=new Set(); Object.entries(a.D.molecules||{}).forEach(([k,m])=>{seenS.add(SUBN(k)); add("Substancja",m.label||k,(m.names||[])[0]||"","#/rynek/"+encodeURIComponent(k),k+" "+SUBN(k)+" "+(m.names||[]).join(" "));});
  const inns={}; (a.PRODS||[]).forEach(p=>{if(p.inn){const n=SUBN(p.inn); if(!inns[n]) inns[n]=p;}}); Object.entries(inns).forEach(([n,p])=>{if(seenS.has(n)) return; seenS.add(n); add("Substancja",n.charAt(0).toUpperCase()+n.slice(1),p.inn+" · marki: "+p.brand,"#/produkty/"+p.id,p.inn);});
  const progs=new Set([...Object.keys(P3),...Object.keys(PN).filter(k=>k[0]!=="_")]); [...progs].sort((x,y)=>parseFloat(x.slice(2))-parseFloat(y.slice(2))).forEach(p=>{const nm=(PN[p]&&PN[p][0])||(P3[p]&&P3[p].name&&TC(P3[p].name))||"nazwa nieznana"; add("Program",p+" "+nm,"program lekowy","#/konkurencja/p:"+p,p.replace(".","")+" "+(P3[p]&&P3[p].mz_full||"")); if(window.PF) add("Filtr programu",p+" "+nm,"ustaw globalny filtr: tylko ten program (Placówki, Fokus, Działania, Przetargi…)","pf:|"+p,p.replace(".",""));});
  if(window.PF) PF.AREAS.forEach(([k,l,pp])=>add("Obszar",l,"ustaw globalny filtr obszaru: "+pp.join(", "),"pf:"+k+"|",pp.join(" ")));
  const cos=new Set(); ((window.DATA3&&DATA3.cnat)||[]).forEach(r=>{if(r.company&&!/^brak|nieprzyp/.test(r.company)) cos.add(r.company);}); [...cos].sort().forEach(c=>add("Firma",c,"karta firmy","#/firmy/f/"+encodeURIComponent(c)));
  const tsubs={}; (a.D.tenders||[]).forEach(t=>{tsubs[t.s]=(tsubs[t.s]||0)+1;}); Object.entries(tsubs).forEach(([s,n])=>add("Przetargi",s,n+" ogłoszeń TED","tf:"+s,SUBN(s)));
  const tb={}; (a.D.tenders||[]).forEach(t=>{if(t.b&&!tb[t.b]) tb[t.b]=t;}); Object.values(tb).forEach(t=>add("Przetarg – zamawiający",TC(t.b),(t.c||"")+" · "+t.s,"tf:"+t.s,t.c));
  (a.D.aotmit||[]).forEach(o=>add("AOTMiT",o.order_no+" – "+(o.title||"").slice(0,110),[o.company,o.product,o.rek_outcome].filter(Boolean).join(" · ")||"zlecenie MZ",o.source_url||"#/dostep",[o.company,o.product,o.substance,o.rek_no].join(" "),o.rek_date||String(o.year||"")));
  const E=window.EXT_LITE; if(E&&E.news_recent) E.news_recent.forEach(n=>add("News",n.title,n.date+" · "+n.source,"#/news/q="+encodeURIComponent(n.title.split(/\s+/).slice(0,6).join(" ")),(n.company_tags||[]).join(" ")+" "+(n.brands||[]).join(" ")+" "+(n.substances||[]).map(SUBN).join(" "),n.date));
  return I;}
const TW={Obszar:6,"Filtr programu":4,Placówka:5,Marka:6,Substancja:7,Program:6,Firma:5,"Przetargi":3,"Przetarg – zamawiający":2,AOTMiT:2,News:1};
function search(q){if(!IDX) IDX=build(); const n=norm(q); if(!n) return []; const toks=n.split(" ");
  const R=[]; for(const it of IDX){let sc=0, ok=true; for(const t of toks){let i=it.k.indexOf(t); if(i<0&&t.length>6&&/um$/.test(t)) i=it.k.indexOf(t.slice(0,-2)); if(i<0){ok=false; break;} sc+=(i===0?3:it.k[i-1]===" "?2:1);} if(!ok) continue; const tt=norm(it.t); if(toks.some(t=>t.length>3&&tt.startsWith(t))) sc+=3; if(it.l.startsWith(n)||it.l.startsWith(n.replace(/um$/,""))) sc+=4; if(it.l===n) sc+=4; R.push([sc+TW[it.t]*.5+(it.d?(parseInt(it.d)-2015)*.08+(+(it.d.slice(5,7))||0)*.006:-it.k.length/400),it]);}
  R.sort((a,b)=>b[0]-a[0]); const out=[], per={}; for(const [,it] of R){per[it.t]=(per[it.t]||0)+1; if(per[it.t]>6) continue; out.push(it); if(out.length>=24) break;} return out;}
function go(it){close(); if(it.go.startsWith("pf:")){const [ta,p]=it.go.slice(3).split("|"); PF.set(ta||"",p?[p]:[]); if(!/^#\/(placowki|fokus|dzialania|przetargi|potencjal|kokpit)/.test(location.hash)) location.hash="#/placowki"; return;}
  if(it.go.startsWith("tf:")){window.__tf={s:it.go.slice(3),t:"",v:"",y:""}; if(location.hash==="#/przetargi") A().route(); else location.hash="#/przetargi"; return;}
  if(/^https?:/.test(it.go)){window.open(it.go,"_blank","noopener"); return;} if(location.hash===it.go) A().route(); else location.hash=it.go;}
function close(){const o=document.getElementById("gsearch"); if(o) o.remove(); document.body.classList.remove("gs-open");}
function open(){if(document.getElementById("gsearch")) return; const esc=A().esc; const o=document.createElement("div"); o.id="gsearch"; o.setAttribute("role","dialog"); o.setAttribute("aria-modal","true"); o.setAttribute("aria-label","Szukaj w aplikacji");
  o.innerHTML=`<div class="gs-box"><div class="gs-in"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2"/></svg><input id="gsq" type="search" autocomplete="off" aria-label="Szukaj placówki, marki, substancji, programu B.xx, firmy, przetargu, AOTMiT, newsa" placeholder="Szukaj: placówka, marka, substancja, B.xx, firma, przetarg, AOTMiT, news…"><button class="btn ghost sm" id="gsx" aria-label="Zamknij">Esc</button></div><div class="gs-res" id="gsr" role="listbox"></div><div class="gs-f muted">↑↓ wybór · Enter otwórz · Esc zamknij · skrót Ctrl/⌘+K</div></div>`;
  document.body.appendChild(o); document.body.classList.add("gs-open"); const q=o.querySelector("#gsq"), r=o.querySelector("#gsr"); let L=[], sel=0;
  const draw=()=>{L=search(q.value); sel=Math.min(sel,Math.max(0,L.length-1)); if(!q.value.trim()){r.innerHTML=`<div class="gs-hint muted">Przykłady: <i>UCK Gdańsk</i>, <i>Rinvoq</i>, <i>adalimumab</i>, <i>B.47</i>, <i>Janssen</i>, <i>przetarg adalimumab</i></div>`; return;}
    r.innerHTML=L.length?L.map((it,i)=>`<a class="gs-row${i===sel?" on":""}" role="option" aria-selected="${i===sel}" data-i="${i}" href="${/^https?:/.test(it.go)?esc(it.go):it.go.startsWith("tf:")?"#/przetargi":it.go.startsWith("pf:")?"#/placowki":esc(it.go)}"><span class="gs-t">${esc(it.t)}</span><span class="gs-l">${esc(it.label)}</span><span class="gs-s muted">${esc(it.sub||"")}</span></a>`).join(""):`<div class="gs-hint muted">Brak wyników dla „${esc(q.value)}”.</div>`;
    r.querySelectorAll(".gs-row").forEach(a=>a.onclick=e=>{e.preventDefault(); go(L[+a.dataset.i]);}); const on=r.querySelector(".on"); if(on) on.scrollIntoView({block:"nearest"});};
  q.oninput=()=>{sel=0; draw();}; q.onkeydown=e=>{if(e.key==="ArrowDown"){sel=Math.min(L.length-1,sel+1); draw(); e.preventDefault();} else if(e.key==="ArrowUp"){sel=Math.max(0,sel-1); draw(); e.preventDefault();} else if(e.key==="Enter"){if(L[sel]) go(L[sel]); e.preventDefault();} else if(e.key==="Escape") close();};
  o.onclick=e=>{if(e.target===o) close();}; o.querySelector("#gsx").onclick=close; draw(); setTimeout(()=>q.focus(),0);}
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&(e.key==="k"||e.key==="K")){e.preventDefault(); document.getElementById("gsearch")?close():open();}
  else if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||"")){e.preventDefault(); open();} else if(e.key==="Escape") close();});
window.addEventListener("hashchange",close);
// R6: wyszukiwanie „na żywo” dla pól, których zmiana przerysowuje widok (debounce + przywrócenie fokusu i kursora)
window.R6SQ=(el,fn)=>{clearTimeout(el.__t); el.__t=setTimeout(()=>{const id=el.id, p=el.selectionStart; fn(el.value); if(!id) return;
  const r=()=>{const n=document.getElementById(id); if(n&&document.activeElement!==n){n.focus(); try{n.setSelectionRange(p,p)}catch(e){}}}; setTimeout(r,60); setTimeout(r,250);},350);};
// ---------- pasek kontekstu ----------
// Mapa stosowalności filtrów globalnych: widok -> {ow: terytorium, per: okres udziałów} => powód, gdy filtr nie zmienia danych widoku (kontrolka wyłączona z notą).
const CTXNA={
  przeglad:{ow:"refundacja NFZ wg EAN i obwieszczenia MZ są ogólnopolskie",per:"widok pokazuje lata kalendarzowe refundacji, nie okres udziałów pacjentów",pg:"przegląd rynku pokazuje cały rynek refundacyjny (wszystkie grupy leków)"},
  news:{ow:"aktualności nie mają przypisania do województwa",per:"okres wiadomości wybierasz polem „Okres” w filtrach aktualności",pg:"aktualności mają własny filtr „Obszar terapeutyczny” w widoku"},
  przetargi:{per:"przetargi filtrujesz polem „Rok” (data publikacji)"},
  konkurencja:{ow:"udziały w programach liczone dla całej Polski (zb. 4897 ogólnopolski)"},
  firmy:{ow:"refundacja wg firm (NFZ wg EAN) jest ogólnopolska",per:"widok pokazuje lata kalendarzowe refundacji",pg:"ranking firm liczony dla całego rynku refundacji"},
  rynek:{ow:"refundacja i pacjenci rynku – dane ogólnopolskie",per:"widok pokazuje lata kalendarzowe (wybór roku w widoku)",pg:"rynek i pacjenci – wybierz grupę w widoku"},
  refundacja:{ow:"obwieszczenia MZ obowiązują w całej Polsce",per:"oś czasu obwieszczeń ma własne daty",pg:"oś czasu obwieszczeń MZ – filtruj wyszukiwarką w widoku"},
  produkty:{ow:"katalog produktów i obwieszczenia MZ są ogólnopolskie",per:"widok pokazuje lata kalendarzowe refundacji",pg:"katalog produktów – filtruj wyszukiwarką w widoku"},
  rejestr:{ow:"Rejestr Produktów Leczniczych jest ogólnopolski",per:"rejestr nie ma okresu udziałów",pg:"Rejestr Produktów Leczniczych – filtruj wyszukiwarką w widoku"},
  zrodla:{ow:"opis źródeł danych",per:"opis źródeł danych",pg:"opis źródeł danych"},
  pacjenci:{ow:"statystyki NFZ wg ICD-10 w tym widoku są ogólnopolskie"},
  demografia:{ow:"struktura wieku i płci NFZ – dane ogólnopolskie"},
  sciezka:{ow:"ścieżka pacjenta NFZ – dane ogólnopolskie"},
  dostep:{ow:"decyzje refundacyjne i kryteria programów obowiązują w całej Polsce"}
};
function ctx(v){const host=document.querySelector("#navbar .actions"); if(!host||!R1) return; const esc=A().esc;
  if(!document.getElementById("gsbtn")){const b=document.createElement("button"); b.id="gsbtn"; b.className="btn ghost icon gsbtn"; b.setAttribute("aria-label","Szukaj (Ctrl+K)"); b.title="Szukaj (Ctrl/⌘+K)";
    b.innerHTML=`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2"/></svg><span class="gsk">Szukaj <kbd>Ctrl K</kbd></span>`; b.onclick=open; host.insertBefore(b,host.firstChild);}
  const app=document.getElementById("app"); if(!app) return; let bar=document.getElementById("ctxbar");
  if(!bar){bar=document.createElement("div"); bar.id="ctxbar"; bar.className="ctxbar"; bar.setAttribute("role","region"); bar.setAttribute("aria-label","Filtry globalne"); app.parentNode.insertBefore(bar,app);}
  const c=R1.CF(), L=R1.owList(); const P=R1.P4; const na=(CTXNA[v.split("/")[0]]||{}); const dis=k=>na[k]?` disabled aria-disabled="true" title="${esc("Nie dotyczy tego widoku: "+na[k])}"`:"";
  bar.innerHTML=`<span class="flab">Firma</span><button class="chip ctxc" id="ctxco" aria-label="Zmień firmę">${esc(c||"Cały rynek")} ▾</button>${c?`<button class="chip x" aria-label="Wyczyść firmę" onclick="R1.setCF('')">✕</button>`:""}
   <span class="flab">Terytorium</span><button class="chip ctxc" id="ctxow" aria-label="Zmień terytorium"${dis("ow")}>${L.length?esc(L.map(R1.owName).join(", ")):"cała Polska"} ▾</button>${L.length?`<button class="chip x" aria-label="Wyczyść terytorium" onclick="R1.setOW('')">✕</button>`:""}
   <label class="flab" for="ctxper">Okres</label><select id="ctxper" aria-label="Okres udziałów" onchange="R1.setPer(this.value)"${dis("per")}>${["R2026","2025"].map(k=>`<option value="${k}" ${k===P.cur?"selected":""}>${esc(R1.L4(k))}</option>`).join("")}</select>
   ${window.PF?`<span class="flab">Obszar</span><button class="chip ctxc${PF.on()?" sel":""}" id="ctxpg" aria-label="Obszar i programy lekowe"${dis("pg")}>${PF.on()?esc("Obszar: "+PF.label()):"wszystkie programy"} ▾</button>${PF.on()?`<button class="chip x" aria-label="Wyczyść obszar i programy" onclick="PF.clear()">✕</button>`:""}`:""}`;
  if(window.PF&&PF.on()&&!na.pg) bar.insertAdjacentHTML("beforeend",`<span class="ctxpf muted" role="status">Filtr Obszar: ${esc(PF.longLabel())}${PF.bypass?" (karta placówki: wszystkie programy)":""}. Co obejmuje każda liczba – etykieta „Zakres” pod tytułem elementu; ⚠ = element bez tego filtra (np. total firmy, którego źródło nie dzieli na programy).</span>`);
  const nn=Object.keys(na).filter(k=>na[k]); if(nn.length) bar.insertAdjacentHTML("beforeend",`<span class="ctxna muted" role="note">${nn.map(k=>`<b>${k==="ow"?"Terytorium":k==="per"?"Okres":k==="pg"?"Obszar/program":"Firma"}</b> nie dotyczy: ${esc(na[k])}`).join(" · ")}</span>`);
  const pill=()=>{const p=document.getElementById("cfpill"); if(p) setTimeout(()=>p.click(),0);};
  bar.querySelector("#ctxco").onclick=e=>{e.stopPropagation(); pill();}; {const g=bar.querySelector("#ctxpg"); if(g) g.onclick=e=>{e.stopPropagation(); PF.sheet();};} bar.querySelector("#ctxow").onclick=e=>{e.stopPropagation(); pill(); setTimeout(()=>{const x=document.querySelector("#cfdrop .owchips"); if(x) x.scrollIntoView({block:"nearest"});},60);};}
// ---------- podzakładki hubu ----------
function subtabs(v){const app=document.getElementById("app"); const h=HUBOF[v]; const ks=(HUBS.find(x=>x[0]===h)||[,[]])[1]; if(!app||ks.length<2) return;
  const n=document.createElement("nav"); n.className="subtabs"; n.setAttribute("aria-label",HUBL[h]); n.innerHTML=ks.map(k=>`<a href="#/${k}" class="${k===v?"on":""}" ${k===v?'aria-current="page"':""}>${SUBL[k]||k}</a>`).join(""); app.insertBefore(n,app.firstChild);}
// ---------- filtry nad treścią ----------
function moveFilters(v){const app=document.getElementById("app"); if(!app) return;
  if(v==="news"){const feed=[...app.querySelectorAll(".card,details")].find(cd=>cd.querySelector("input[type=search],select")&&!cd.closest(".strip")); const strip=app.querySelector(".strip"); const tk=app.querySelector(".takeaway");
    const anchor=(tk&&tk.previousElementSibling===strip?tk:strip)||app.querySelector("h1"); if(feed&&anchor&&feed.previousElementSibling!==anchor){const sub=app.querySelector("p.sub"); (sub&&sub.compareDocumentPosition(anchor)&Node.DOCUMENT_POSITION_PRECEDING?sub:anchor).after(feed); feed.classList.add("r6moved");}}
  if(v==="przetargi"){const tb=[...app.querySelectorAll(":scope > .tbar")].find(x=>x.querySelector("select")); const h1=app.querySelector("h1"); if(tb&&h1){let a=h1; const s=h1.nextElementSibling; if(s&&s.matches("p.sub,.cfnote,.alert")) a=s; if(a.nextElementSibling!==tb) a.after(tb);} const hs=app.querySelectorAll("h1"); [...hs].slice(1).forEach(x=>{const h2=document.createElement("h2"); h2.innerHTML=x.innerHTML; h2.className=x.className; x.replaceWith(h2);});}
  if(v==="konkurencja"){const tabs=[...app.querySelectorAll(".tabs")].find(t=>/#\/konkurencja\//.test(t.innerHTML)); const anchor=app.querySelector(":scope > .r3strip")||app.querySelector(":scope > p.sub")||app.querySelector("h1");
    if(tabs&&anchor){const note=tabs.nextElementSibling&&tabs.nextElementSibling.matches("p.muted")?tabs.nextElementSibling:null; const box=document.createElement("div"); box.className="card r6tabs"; box.innerHTML='<div class="flab">Program lekowy</div>'; anchor.after(box); box.appendChild(tabs); if(note) box.appendChild(note);
      const h1c=app.querySelector(":scope > .card.head1"); if(h1c) box.after(h1c);}}
}
// ---------- etykiety pól ----------
function labels(){const app=document.getElementById("app"); if(!app) return; app.querySelectorAll(".segc").forEach(g=>{if(!g.getAttribute("role")){g.setAttribute("role","group"); const pv=g.previousElementSibling; const t=pv&&/Wskazanie:\s*$/.test(pv.textContent)?"Wskazanie":(pv&&pv.matches("h2,h3")?pv.textContent.trim().slice(0,60):"Wybór widoku"); g.setAttribute("aria-label",t);} g.querySelectorAll("a,button").forEach(a=>{if(a.classList.contains("sel")||a.classList.contains("on")) a.setAttribute("aria-current","true"); else a.removeAttribute("aria-current");});}); app.querySelectorAll("select,input").forEach(el=>{if(el.getAttribute("aria-label")||el.id&&app.querySelector(`label[for="${el.id}"]`)||el.closest("label")) return; if(el.type==="hidden") return;
  let t=""; const pv=el.previousSibling; if(pv&&pv.nodeType===3&&pv.textContent.trim()) t=pv.textContent.trim().replace(/[:：]\s*$/,""); if(!t&&el.placeholder) t=el.placeholder; if(!t&&el.tagName==="SELECT"&&el.options[0]) t="Filtr: "+el.options[0].text; if(!t&&el.type==="checkbox") t=(el.parentElement&&el.parentElement.textContent.trim())||"opcja"; if(t) el.setAttribute("aria-label",t);});}
// ---------- żargon ----------
const JG=[[/\bEAN\b/,"EAN – kod kreskowy opakowania; tu: pacjenci policzeni po kodach EAN leków (NFZ zb. 4897)"],[/zb\. 4897/,"Zbiór 4897 NFZ (dane.gov.pl): liczba pacjentów wg świadczeniodawcy × substancji × program, 12 miesięcy; wartości <5 ukryte"],[/&lt;5|<5/,"Liczby 1–4 są ukrywane przez NFZ (ochrona danych) – pokazujemy „<5”"],[/\bp\.p\.|\bpp\b/,"punkty procentowe – różnica udziałów, nie zmiana procentowa"],[/\br\/r\b/,"rok do roku"],[/\bLOE\b/,"Loss of exclusivity – utrata wyłączności (patent/ochrona danych)"],[/\bTED\b/,"Tenders Electronic Daily – dziennik zamówień UE (przetargi szpitali)"],[/\bICD-10\b/,"Międzynarodowa klasyfikacja chorób, kod rozpoznania"],[/Rada Przejrzystości/,"Organ doradczy AOTMiT wydający stanowiska w sprawie refundacji"],[/\bobwieszczenie\b/i,"Obwieszczenie MZ – lista leków refundowanych z cenami i limitami, co 2 miesiące"],[/\bUMW\b/,"Umowa z NFZ na realizację programu lekowego"]];
function jargon(){const app=document.getElementById("app"); if(!app) return; const used=new Set(); app.querySelectorAll("th, .kpi .l, h2").forEach(el=>{if(el.querySelector(".jg")) return; const h=el.innerHTML;
  for(const [re,t] of JG){if(used.has(t)) continue; if(re.test(el.textContent)){const s=document.createElement("button"); s.type="button"; s.className="jg"; s.textContent="i"; s.title=t; s.setAttribute("aria-label","Objaśnienie: "+t); s.onclick=e=>{e.stopPropagation(); e.preventDefault(); const o=document.querySelector(".jgpop"); if(o) o.remove(); const p=document.createElement("div"); p.className="jgpop card"; p.textContent=t; document.body.appendChild(p); const r=s.getBoundingClientRect(); p.style.left=Math.max(8,Math.min(innerWidth-288,r.left-130))+"px"; p.style.top=(r.bottom+6+scrollY)+"px"; setTimeout(()=>document.addEventListener("click",()=>p.remove(),{once:true}));}; el.appendChild(s); used.add(t); break;}}});}
// ---------- tytuł karty: zwijanie długich nazw WIELKIMI ----------
const UPRUN=/[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻ.\-"„”]+(?:[ ,]+[A-ZĄĆĘŁŃÓŚŹŻ0-9"„][A-ZĄĆĘŁŃÓŚŹŻ0-9.\-\/"”]*)+/g;
function titles(){const app=document.getElementById("app"); if(!app) return; const w=document.createTreeWalker(app,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&/SCRIPT|STYLE|TEXTAREA|CODE/.test(n.parentElement.tagName)?2:1}); const L=[]; while(w.nextNode()) L.push(w.currentNode);
  L.forEach(n=>{const t=n.textContent; if(t.length<9||!/[A-ZĄĆĘŁŃÓŚŹŻ]{5}/.test(t)) return; const r=t.replace(UPRUN,m=>{const words=m.split(/[ ,]+/); if(!words.some(x=>/^[A-ZĄĆĘŁŃÓŚŹŻ]{5,}/.test(x))||m.replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g,"").length<9) return m; return TC(m);}); const r2=r.replace(/(^|[\s·(])([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻ\-]{3,})(?=$|[\s·),])/g,(m,p,wd)=>CITY().has(wd)?p+TC(wd):m); if(r2!==t) n.textContent=r2;});}
let _CITY=null; function CITY(){if(_CITY) return _CITY; _CITY=new Set(); try{((window.DATA2||{}).fac||[]).forEach(f=>f.city&&_CITY.add(String(f.city).toUpperCase()));}catch(e){} return _CITY;}
function pin(){if(innerWidth>600) return; document.querySelectorAll("#app table tbody").forEach(tb=>{const r=tb.querySelector(":scope > tr.sel"); if(r&&tb.rows[0]!==r){tb.insertBefore(r,tb.rows[0]); r.classList.add("pin"); r.title="Wybrana firma – przypięta na górze (pozycja w rankingu w kolumnie #)";}});}
// ---------- podpięcie ----------
if(R1&&R1.after&&!R1.after.r6){const o=R1.after; R1.after=function(v,a){o(v,a); try{wrapNav(); subtabs(v); ctx(v); moveFilters(v); pin(); labels(); titles(); jargon(); setTimeout(labels,700); [400,1500].forEach(t=>setTimeout(()=>{try{pin();labels();titles();}catch(e){}},t));}catch(e){console.warn("r6",e);} IDX=IDX||null;}; R1.after.r6=1;}
// re-apply Title Case / pin / labels after in-view re-renders (chips, filters) – debounced, idempotent
(function(){let tm=null,busy=false; function go(){if(busy) return; busy=true; try{pin(); labels(); titles();}catch(e){} setTimeout(()=>busy=false,50);}
  function obs(){const app=document.getElementById("app"); if(!app||app.r6o) return; app.r6o=1; setTimeout(go,150); new MutationObserver(()=>{if(busy) return; clearTimeout(tm); tm=setTimeout(go,120);}).observe(app,{childList:true,subtree:true});}
  if(document.readyState!=="loading") obs(); else document.addEventListener("DOMContentLoaded",obs);})();
window.R6={open,close,search,build:()=>IDX=build(),HUBS,HUBOF,TC,SUBN,titles,labels};
})();
