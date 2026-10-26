/* Pharma Market Intelligence PL – moduł v2: widoki „Pacjenci i rozpoznania” oraz „Placówki” (window.DATA2 z data/data_v2.js). Brak szacunków: tylko wartości ze źródeł i ich jawne sumy/ilorazy. */
(function(){
"use strict";
const X=window.DATA2; if(!X){window.V2={pac:()=>"<p>Brak pliku data/data_v2.js</p>",fac:()=>"<p>Brak pliku data/data_v2.js</p>"};return;}
const A=()=>window.APP;
const SR=f=>X.src[f]||{title:f,url:f,retrieved:""};
const srcTxt=f=>{const s=SR(f);return `dane.gov.pl ${s.ds?"zb. "+s.ds+" – ":""}${s.title}${s.res?" · "+s.res:""}${s.date?" · dane z "+s.date:""}`;};
const Sf=f=>{const s=SR(f);return A().S(srcTxt(f),s.url,s.retrieved);};
const Vf=(t,f)=>{const s=SR(f);return A().V(t,srcTxt(f),s.retrieved,s.url);};
const LT5='<span class="chip" title="NFZ nie publikuje wartości poniżej 5 – komórka wyłączona z sum">&lt;5</span>';
const OWN=X.ow_names; const owName=o=>OWN[o]||o;
// R6: zapas na poziomie placówki – NFZ zb. 4897 (ICD-10 × EAN × świadczeniodawca), najnowsze 12 m. (data/fac4897.js)
const F4=window.FAC4897||null; const F4L=F4?"NFZ zb. 4897, 12 m. "+F4.label:"NFZ zb. 4897";
const F4S=()=>F4?A().S(F4L+" (publ. "+F4.date+"); komórki <5 ukryte przez NFZ i pominięte w sumach; suma po EAN liczy pacjenta z kilkoma lekami wielokrotnie",F4.url,F4.date):"";
const f4=f=>F4&&F4.f[f.k]||[];
if(F4&&X.fac){const have=new Set(X.fac.map(f=>f.k)); Object.keys(F4.nm).forEach(k=>{if(!have.has(k)){const [ow,code]=k.split("|"); const [name,addr]=F4.nm[k]; X.fac.push({k,ow,code,name,addr,city:null,nip:null,regon:null,progs:{},plan:[],agr:[],sub:[],icd:[],ean:[],ted:[],src_addr:F4.url,f4only:1});}});}
const MLAB={pacjenci_3zn:"Pacjenci z rozpoznaniem (ICD-10 3 zn., zb. 2556)",pacjenci_5zn:"Pacjenci z rozpoznaniem (ICD-10 5 zn., zb. 2557)",nowi_3zn:"Pacjenci z rozpoznaniem po raz pierwszy (zb. 2561 – proxy zachorowalności)",chorobowosc_3zn:"Pacjenci żyjący z rozpoznaniem w danym roku lub wcześniej (zb. 2577 – proxy chorobowości)"};
const API="NFZ app-stat-api-pl – drug-costs-by-drug-program (liczba unikalnych pacjentów w programie)";
// para program/ICD dla wskaźnika „penetracji” (tylko jednoznaczne pary)
const PEN={"ŁUSZCZYCA":["B.47","L40","pacjenci_3zn","L40 obejmuje wszystkie postacie łuszczycy (także L40.5 ŁZS), B.47 – tylko łuszczyca plackowata umiarkowana/ciężka."],"ChLC":["B.32","K50","pacjenci_3zn",""],"WZJG":["B.55","K51","pacjenci_3zn",""],"ZZSK":["B.36","M45","pacjenci_3zn","B.82 (nr-axSpA) nie wliczony – nie ma odpowiednika M45."],"AZS":["B.124","L20","pacjenci_3zn","B.124 obejmuje wyłącznie ciężkie AZS."],"CLL":["B.79","C91.1","pacjenci_5zn","Do 2022 r. część pacjentów CLL leczona w osobnych programach B.92/B.103 – patrz seria."],"AML":["B.114","C92.0","pacjenci_5zn",""],"PARKINSON":["B.90","G20","pacjenci_3zn","B.90 – tylko zaawansowana choroba z fluktuacjami (terapie infuzyjne)."],"MIGRENA":["B.133","G43","pacjenci_3zn","B.133 – migrena przewlekła; G43 obejmuje wszystkie postaci migreny."],"JAJNIK":["B.50","C56","pacjenci_3zn","B.50 obejmuje też raka jajowodu i otrzewnej (C57/C48), których nie ma w mianowniku."],"HS":["B.161","L73.2","pacjenci_5zn","B.161 brak w API NFZ – licznik z zb. 29407 (2025, pacjenci sprawozdani)."]};
const NOPEN={"RZS":"B.33 obejmuje RZS oraz MIZS (M08) – licznik nie odpowiada mianownikowi M05/M06; NFZ nie publikuje podziału B.33 wg ICD.","ŁZS":"Kody L40.5 i M07 mogą dotyczyć tego samego pacjenta – mianownik (unikalni pacjenci) nieznany; sumowanie zabronione.","UVEITIS":"B.105 dotyczy nieinfekcyjnego ZBN, kody H20/H30 obejmują także postacie infekcyjne i mogą się nakładać.","GCA":"Brak programu lekowego NFZ dla GCA (M31.5) – brak licznika.","HCV":"Kod B18.2 (i cały zakres B15–B19) nie występuje w zbiorach ICD-10 NFZ 2556/2557/2561/2577 – brak mianownika.","SIATKÓWKA":"B.70 obejmuje AMD (H35.3), DME i RVO – mianownik H36.0/H34 nie odpowiada licznikowi."};
const DSIND={41396:"HS",29068:"MIGRENA",39199:"MIGRENA",34249:"SIATKÓWKA",26565:"SIATKÓWKA",3853:"AML",4513:"AML",4509:"AML",4583:"CLL",4462:"ŁUSZCZYCA",3042:"PARKINSON",4690:"PARKINSON",3773:"CLL",4739:"CLL",4859:"CLL",8480:"CLL",4809:"WZJG",14655:"JAJNIK",8475:"AZS",14156:"HCV",3059:"HCV"};
function progPat(p,y){const r=X.prog[p]&&X.prog[p].year[y]; if(r) return {v:r[0],src:API,url:r[2],date:r[3]}; if(+y===2025){const q=X.p29.find(z=>z.prog===p); if(q) return {v:+q.reported,src:srcTxt(q.src)+" – pacjenci sprawozdani",url:SR(q.src).url,date:SR(q.src).retrieved};} return null;}
function natv(icd,m,y){const r=X.nat[icd]&&X.nat[icd][m]&&X.nat[icd][m][y]; return r?{v:r[1],raw:r[0],f:r[2]}:null;}
const mOf=c=>c.includes(".")?"pacjenci_5zn":"pacjenci_3zn";
function indSel(cur){return `<select onchange="location.hash='#/pacjenci/'+encodeURIComponent(this.value)">`+X.ind.map(i=>`<option value="${i.ind}" ${i.ind===cur?"selected":""}>${A().esc(i.name)} (${i.icd.join(", ")})</option>`).join("")+"</select>";}
// =============== PACJENCI ===============
function pac(ind,y){
  const {nf,esc,ND,V,S,table,chart,PAL,ACC}=A();
  ind=ind||"_all";
  let h=`<h1>Pacjenci i rozpoznania</h1><p class="sub">Liczby pacjentów z rozpoznaniem ICD-10 (dane rozliczeniowe NFZ, nie epidemiologia), pacjenci w programach lekowych, struktura wieku/płci i województwa. Liczb pacjentów z różnych kodów, lat i programów nie należy sumować (ten sam pacjent może występować wielokrotnie).</p>
  <div class="tbar"><select onchange="location.hash='#/pacjenci/'+encodeURIComponent(this.value)"><option value="_all">Wszystkie wskazania – zestawienie</option>${X.ind.map(i=>`<option value="${i.ind}" ${i.ind===ind?"selected":""}>${esc(i.name)} (${i.icd.join(", ")})</option>`).join("")}</select></div>`;
  if(ind==="_all") return h+pacAll();
  const I=X.ind.find(i=>i.ind===ind); if(!I) return h+"<p>Nieznane wskazanie</p>";
  const years=[];for(let yy=2015;yy<=2025;yy++)years.push(yy);
  const codes=I.icd; const sub5=Object.keys(X.nat).filter(c=>codes.some(k=>!k.includes(".")&&c.startsWith(k+"."))).sort();
  // KPI
  const kp=codes.map(c=>{const yr=[2025,2024,2023,2022,2021,2020].find(y=>natv(c,mOf(c),y))||2025; const r=natv(c,mOf(c),yr); return `<div class="card kpi"><div class="l">Pacjenci z rozpoznaniem ${c} – ${yr}</div><div class="v">${r?Vf(nf(r.v),r.f):'<span class="alt">kod poza zbiorami NFZ</span>'}</div><div class="d">${(()=>{const p=natv(c,mOf(c),2015);return p&&r?`2015: ${nf(p.v)}`:"";})()}</div><div class="src">${r?esc(MLAB[mOf(c)]):"Kod nie występuje w zbiorach ICD-10 NFZ"}</div></div>`;}).join("")+
   I.programmes.map(p=>{const r=progPat(p,2025);return `<div class="card kpi"><div class="l">Pacjenci w programie ${p} – 2025</div><div class="v">${r?V(nf(r.v),r.src,r.date,r.url):ND}</div><div class="d">${(()=>{const q=progPat(p,2024);return q?"2024: "+nf(q.v):"";})()}</div><div class="src">${r?esc(r.src):"Program nie występuje w API NFZ"}</div></div>`;}).join("");
  h+=`<div class="grid g4">${kp}${I.programmes.length?"":`<div class="card kpi"><div class="l">Program lekowy</div><div class="v">${ND}</div><div class="src">Brak programu lekowego NFZ dla tego wskazania.</div></div>`}</div>`;
  // trend chart
  const ds=[];codes.forEach((c,i)=>{if(X.nat[c]) ds.push({type:"line",label:c+" – pacjenci z rozpoznaniem",data:years.map(yy=>{const r=natv(c,mOf(c),yy);return r?r.v:null;}),borderColor:PAL[i],backgroundColor:PAL[i],yAxisID:"y"});});
  I.programmes.forEach((p,i)=>ds.push({type:"bar",label:p+" – pacjenci w programie",data:years.map(yy=>{const r=progPat(p,yy);return r?r.v:null;}),backgroundColor:i?"#ff9f0a":ACC,yAxisID:"y2"}));
  chart("pc1",{data:{labels:years,datasets:ds},options:{maintainAspectRatio:false,scales:{y:{beginAtZero:true,title:{display:true,text:"pacjenci z rozpoznaniem"}},y2:{beginAtZero:true,position:"right",grid:{drawOnChartArea:false},title:{display:true,text:"pacjenci w programie"}}}}});
  h+=`<div class="grid g2"><div class="card"><h2>${esc(I.name)} – pacjenci z rozpoznaniem vs w programie (2015–2025)</h2><div class="chartbox tall"><canvas id="pc1"></canvas></div>${codes.filter(c=>X.nat[c]).map(c=>Sf(X.nat[c][mOf(c)][2025][2])).join("")}${I.programmes.length?S(API,"https://api.nfz.gov.pl/app-stat-api-pl",(X.prog[I.programmes[0]]&&Object.values(X.prog[I.programmes[0]].year)[0]||[])[3]):""}${codes.some(c=>!X.nat[c])?`<p class="nd">Kod ${codes.filter(c=>!X.nat[c]).join(", ")}: brak danych w zbiorach ICD-10 NFZ.</p>`:""}</div>`;
  // penetration
  const pe=PEN[ind];
  if(pe){const [p,c,m,note]=pe; const rows=years.map(yy=>{const a=progPat(p,yy),b=natv(c,m,yy);return {y:yy,a,b,r:a&&b&&b.v?a.v/b.v:null};}).filter(r=>r.a||r.b);
    h+=`<div class="card"><h2>Wskaźnik: pacjenci w ${p} / pacjenci z rozpoznaniem ${c}</h2><p class="muted">Iloraz dwóch liczb NFZ (licznik: unikalni pacjenci w programie; mianownik: unikalni pacjenci z rozpoznaniem głównym ${c} w dowolnym świadczeniu). Wskaźnik orientacyjny – nie jest to odsetek chorych w populacji. ${esc(note)}</p>${table([{h:"Rok",k:"y"},{h:"Pacjenci w "+p,n:1,v:x=>x.a&&x.a.v,f:x=>x.a?V(nf(x.a.v),x.a.src,x.a.date,x.a.url):ND},{h:"Pacjenci z "+c,n:1,v:x=>x.b&&x.b.v,f:x=>x.b?Vf(nf(x.b.v),x.b.f):ND},{h:"Wskaźnik",n:1,v:x=>x.r,f:x=>x.r==null?ND:nf(100*x.r,1)+"%"}],rows,{name:"penetracja_"+ind,search:false})}</div></div>`;}
  else h+=`<div class="card"><h2>Wskaźnik leczenia w programie</h2><p><span class="alt">nie wyliczono</span> – ${esc(NOPEN[ind]||"brak jednoznacznej pary program/ICD")}</p></div></div>`;
  // national table incl. 5-char subcodes and all measures
  const nr=[];[...codes,...sub5].forEach(c=>{if(!X.nat[c])return;Object.keys(X.nat[c]).forEach(m=>{const o={c,m};years.forEach(yy=>{const r=X.nat[c][m][yy];o[yy]=r?r[1]:null;o["f"+yy]=r?r[2]:null;o["r"+yy]=r?r[0]:null;});nr.push(o);});});
  h+=`<div class="card"><h2>Seria krajowa – wszystkie miary i podkody (2015–2025)</h2>${table([{h:"Kod",k:"c"},{h:"Miara",k:"m",f:x=>esc(MLAB[x.m]||x.m)},...years.map(yy=>({h:String(yy),n:1,v:x=>x[yy],f:x=>x[yy]==null?(x["r"+yy]&&String(x["r"+yy]).includes("<")?LT5:'<span class="alt" title="brak wiersza w zbiorze dla tego roku">–</span>'):Vf(nf(x[yy]),x["f"+yy])}))],nr,{name:"icd_seria_"+ind,src:`<div class="src">Źródło: dane.gov.pl – NFZ, zbiory <a href="https://dane.gov.pl/pl/dataset/2556" target="_blank">2556</a>, <a href="https://dane.gov.pl/pl/dataset/2557" target="_blank">2557</a>, <a href="https://dane.gov.pl/pl/dataset/2561" target="_blank">2561</a>, <a href="https://dane.gov.pl/pl/dataset/2577" target="_blank">2577</a> (plik roczny; najedź na liczbę, aby zobaczyć plik i datę pobrania). Dane rozliczeniowe – pacjent z rozpoznaniem głównym w świadczeniu sprawozdanym do NFZ.</div>`})}</div>`;
  // age / sex 2022 (3544)
  const c3=[...new Set(codes.map(c=>c.slice(0,3)))].filter(c=>X.agesex[c]);
  h+=`<div class="grid g2"><div class="card"><h2>Wiek i płeć – 2022 (rozpoznanie 3-zn.)</h2>`;
  if(c3.length){c3.forEach((c,i)=>{const a=X.agesex[c];chart("pas"+i,{type:"bar",data:{labels:X.bands,datasets:[{label:"Kobiety",data:a.K,backgroundColor:"#ff375f"},{label:"Mężczyźni",data:a.M,backgroundColor:"#0a84ff"}]},options:{maintainAspectRatio:false,plugins:{title:{display:true,text:c}}}});
    h+=`<div class="chartbox"><canvas id="pas${i}"></canvas></div><p class="muted">${c}: suma pacjentów z wierszy jednorocznych przedziałów wieku; pominięto ${nf(a.lt5)} komórek „&lt;5”${a.badage?` oraz ${nf(a.badage)} pacjentów z nieprawidłowym wiekiem w pliku źródłowym`:""}. Suma K+M: ${nf(a.K.concat(a.M).reduce((s,v)=>s+v,0))}.</p>`;});
    h+=Sf(X.agesex[c3[0]].src)+`<p class="muted">Zbiór 3544 obejmuje wyłącznie rozpoznania nieonkologiczne i tylko rok 2022.</p>`;}
  else h+=`<p>${ND} – zbiór 3544 (wiek×płeć) obejmuje tylko rozpoznania nieonkologiczne; ${codes.join(", ")} brak.</p>`;
  h+=`</div><div class="card"><h2>Programy lekowe – płeć i wiek pacjentów</h2>`;
  I.programmes.forEach((p,i)=>{const P=X.prog[p]; if(!P||!Object.keys(P.gender).length){h+=`<p><b>${p}</b>: ${ND} (program nie występuje w API NFZ app-stat-api-pl).</p>`;return;}
    const ly=Math.max(...Object.keys(P.age).map(Number)); const ag=P.age[ly]||{}; const ge=P.gender[ly]||{};
    const AG=["1 - 6","7 - 17","18 - 40","41 - 60","61 - 80","81 i więcej"];
    chart("ppa"+i,{type:"bar",data:{labels:AG,datasets:[{label:p+" – pacjenci "+ly,data:AG.map(g=>ag[g]?ag[g][0]:null),backgroundColor:ACC}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:p+" – wiek ("+ly+")"}}}});
    h+=`<div class="chartbox"><canvas id="ppa${i}"></canvas></div><p class="muted">${p} ${ly} – płeć: ${Object.entries(ge).map(([g,v])=>`${esc(g)} ${V(nf(v[0]),API,v[3],v[2])}`).join(" · ")}. Grupy wieku i płci raportowane osobno przez API – nie sumować z innymi latami.</p>`;});
  if(!I.programmes.length) h+=`<p>${ND} – brak programu lekowego.</p>`;
  h+=`${I.programmes.length?S(API+" – parametry gender / age-group","https://api.nfz.gov.pl/app-stat-api-pl",""):""}</div></div>`;
  // provinces
  const yr=+y||2025; const ow=(X.icdow[ind]||{})[yr]||{}; const P0=I.programmes[0]; const pv=P0&&X.prog[P0]?X.prog[P0].prov[yr]||{}:{};
  const pvKey=o=>pv[o]?o:null; // parametr province API = kod OW NFZ 01–16 (spójność sprawdzona: 07 mazowieckie największe, 04/08 najmniejsze)
  const rowsOW=Object.keys(OWN).map(o=>{const a=ow[o];const k=pvKey(o);return {o,n:owName(o),icd:a?a[0]:null,lt5:a?a[1]:null,np:a?a[2]:null,f:a?a[3]:null,pp:k?pv[k][0]:null,pu:k?pv[k][2]:null,pd:k?pv[k][3]:null};});
  h+=`<div class="card"><h2>Województwa – ${yr}</h2><div class="tbar">Rok: <select onchange="location.hash='#/pacjenci/${encodeURIComponent(ind)}/'+this.value">${[2025,2024].map(z=>`<option ${z===yr?"selected":""}>${z}</option>`).join("")}</select></div>
  ${table([{h:"OW",k:"o"},{h:"Województwo",k:"n",f:x=>`<a href="#/placowki/w/${x.o}">${esc(x.n)}</a>`},{h:"Pacjenci z rozpoznaniem – suma po placówkach (zb. 4895)",n:1,v:x=>x.icd,f:x=>x.icd==null?ND:Vf(nf(x.icd),x.f)},{h:"Placówki",n:1,v:x=>x.np},{h:"Komórki <5 pominięte",n:1,v:x=>x.lt5},{h:P0?"Pacjenci w "+P0+" (API, wg województwa)":"Program",n:1,v:x=>x.pp,f:x=>x.pp==null?ND:V(nf(x.pp),API,x.pd,x.pu)}],rowsOW,{name:"wojewodztwa_"+ind+"_"+yr,search:false,src:`<div class="src">Suma po placówkach z zb. <a href="https://dane.gov.pl/pl/dataset/4895" target="_blank">4895</a> (rozpoznania ${codes.join(", ")}) – ten sam pacjent leczony w kilku placówkach lub z kilkoma kodami liczony wielokrotnie; komórki &lt;5 pominięte. Kolumna programu: ${esc(API)} z parametrem province.</div>`})}</div>`;
  // source tables
  const tabs=X.tabs.filter(t=>DSIND[t.ds]===ind||t.ds===29407||t.ds===36804);
  h+=`<div class="card"><h2>Tabele źródłowe NFZ (dane.gov.pl) dla wskazania</h2>${tabExplorer(tabs,"tx_"+ind)}</div>`;
  return h;
}
function tabExplorer(tabs,id){
  const {esc}=A(); if(!tabs.length) return `<p>${A().ND}</p>`;
  window.__tabs=window.__tabs||{}; window.__tabs[id]=tabs;
  setTimeout(()=>showTab(id,0));
  return `<div class="tbar"><select onchange="window.__showTab('${id}',+this.value)">${tabs.map((t,i)=>`<option value="${i}">${t.ds} · ${esc(t.title.slice(0,70))} · arkusz „${esc(t.sheet)}”</option>`).join("")}</select></div><div id="${id}"></div>`;
}
function showTab(id,i){const {esc}=A();const t=window.__tabs[id][i];const el=document.getElementById(id);if(!el)return;const s=SR(t.src);
  el.innerHTML=`<div class="tablewrap" style="max-height:460px"><table>${t.rows.map((r,j)=>`<tr>${r.map(c=>j===0?`<th>${esc(c)}</th>`:`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></div>`+A().S(`dane.gov.pl zb. ${t.ds} – ${t.title} · ${t.file} · arkusz ${t.sheet}${t.rows.length>=600?" (pokazano pierwsze 600 wierszy)":""}`,s.url||`https://dane.gov.pl/pl/dataset/${t.ds}`,s.retrieved);}
window.__showTab=showTab;
function pacAll(){
  const {nf,esc,ND,V,table}=A();
  const rows=X.ind.map(I=>{const c=I.icd[0];const n=natv(c,mOf(c),2025),n0=natv(c,mOf(c),2015);const p=I.programmes[0];const pp=p?progPat(p,2025):null;const pe=PEN[I.ind];let r=null;if(pe){const a=progPat(pe[0],2025),b=natv(pe[1],pe[2],2025);r=a&&b?a.v/b.v:null;}
    return {I,c,n,n0,p,pp,r,why:pe?"":NOPEN[I.ind]};});
  return `<div class="card"><h2>Zestawienie wskazań – 2025</h2>${table([{h:"Wskazanie",v:x=>x.I.name,f:x=>`<a href="#/pacjenci/${encodeURIComponent(x.I.ind)}">${esc(x.I.name)}</a>`},{h:"ICD-10",v:x=>x.I.icd.join(", ")},{h:"Programy lekowe",v:x=>x.I.programmes.join(", ")||null,empty:"–"},{h:"Pacjenci z rozpoznaniem (1. kod) 2015",n:1,v:x=>x.n0&&x.n0.v,f:x=>x.n0?Vf(nf(x.n0.v),x.n0.f):ND},{h:"2025",n:1,v:x=>x.n&&x.n.v,f:x=>x.n?Vf(nf(x.n.v),x.n.f):ND},{h:"Program",k:"p",empty:"brak programu"},{h:"Pacjenci w programie 2025",n:1,v:x=>x.pp&&x.pp.v,f:x=>x.pp?V(nf(x.pp.v),x.pp.src,x.pp.date,x.pp.url):ND},{h:"Program / rozpoznanie",n:1,v:x=>x.r,f:x=>x.r!=null?nf(100*x.r,1)+"%":`<span class="nd" title="${esc(x.why||"")}">nie wyliczono</span>`}],rows,{name:"wskazania_2025",search:false,src:`<div class="src">Rozpoznania: dane.gov.pl NFZ zb. 2556 (3 zn.) / 2557 (5 zn.), plik 2025. Programy: ${esc(API)}; B.161: zb. 29407. Wskaźnik tylko dla jednoznacznych par program/ICD – uzasadnienie braków w widoku wskazania.</div>`})}</div>
  <div class="card"><h2>Wszystkie tabele źródłowe NFZ (dane.gov.pl)</h2>${tabExplorer(X.tabs,"tx_all")}</div>`;
}
// =============== PLACÓWKI ===============
const snorm=s=>String(s||"").toUpperCase().slice(0,7);
const CF=()=>localStorage.getItem("cf")||"";
// firma substancji w programie: tylko gdy NFZ×MZ przypisuje substancję jednemu podmiotowi (DATA3.ps, ostatni rok z danymi)
const subCo=(p,s)=>{const P=window.DATA3&&window.DATA3.ps[p]; if(!P) return null; const k=Object.keys(P).find(x=>snorm(x)===snorm(s)); if(!k) return null; const yy=Object.keys(P[k]).sort().reverse().find(y=>P[k][y]&&P[k][y][2]); return yy?P[k][yy][2]:null;};
const isCS=(p,s)=>{const c=CF(); return !!c&&subCo(p,s)===c;};
const UMWP="B.32, B.33, B.35, B.36, B.47, B.50, B.55, B.70, B.71, B.79, B.82, B.90, B.105, B.114, B.124, B.133, B.161";
function facAgg(f){
  if(f._a&&f._a.cf===CF()) return f._a;
  const a={};
  const lastY=Object.keys(f.progs).sort().pop(); a.progsLast=lastY?f.progs[lastY]:[]; a.lastY=lastY;
  a.allProgs=[...new Set([].concat(...Object.values(f.progs),f.sub.map(s=>s[1])))].sort();
  const py=y=>f.plan.filter(p=>p[0]===y).reduce((s,p)=>s+p[3],0);
  a.plan25=f.plan.some(p=>p[0]==="2025")?py("2025"):null; a.plan26=f.plan.some(p=>p[0]==="2026")?py("2026"):null;
  const s24=f.sub.filter(s=>s[0]==="15035"&&s[3]==="2024"&&s[5]!=null);
  a.sub24=s24.length?s24.reduce((s,x)=>s+x[5],0):null; const c=CF(); const ab=c?s24.filter(x=>isCS(x[1],x[2])).reduce((s,x)=>s+x[5],0):null;
  a.msh24=c&&a.sub24?ab/a.sub24:null; a.ab24=c&&s24.length?ab:null;
  const I=c&&window.R1&&window.R1.actInds?window.R1.actInds(c):null; a.inScope=!I||f.ean.some(e=>I.has(e[1]))||f4(f).some(e=>I.has(e[0]))||(window.R1&&window.R1.myProgs?[...window.R1.myProgs(c)].some(p=>a.allProgs.includes(p)):false);
  // QA-06: wskazania placówki z zb. 4897 (2025) w zakresie firmy – pacjenci per wskazanie (komórki <5 pominięte)
  a.inds={}; f.ean.filter(e=>e[0]==="2025"&&(!I||I.has(e[1]))).forEach(e=>{a.inds[e[1]]=(a.inds[e[1]]||0)+(e[5]||0);});
  const e25=f.ean.filter(e=>e[0]==="2025"&&e[5]!=null&&(!I||I.has(e[1]))); a.abE25=c&&e25.length?e25.filter(e=>e[4]===c).reduce((s,e)=>s+e[5],0):null; a.allE25=e25.length?e25.reduce((s,e)=>s+e[5],0):null;
  // udział firmy: najpierw poziom marki/EAN (zb. 4897, 2025), substancja (15035, 2024) tylko jako zapas
  a.unE25=e25.length?e25.filter(e=>!e[4]).reduce((s,e)=>s+e[5],0):null; a.lt5E25=f.ean.filter(e=>e[0]==="2025").reduce((s,e)=>s+(e[6]||0),0);
  const r4=f4(f).filter(e=>!I||I.has(e[0])); const r4n=r4.filter(e=>e[4]!=null); a.r4n=r4.length;
  a.allR4=r4n.length?r4n.reduce((s,e)=>s+e[4],0):null; a.abR4=c&&r4n.length?r4n.filter(e=>e[3]===c).reduce((s,e)=>s+e[4],0):null; a.lt5R4=r4.reduce((s,e)=>s+(e[5]||0),0);
  if(!Object.keys(a.inds).length&&r4.length){a.inds={}; r4.forEach(e=>{a.inds[e[0]]=(a.inds[e[0]]||0)+(e[4]||0);}); a.indsFb=1;}
  if(c&&a.allE25){a.msh=a.abE25/a.allE25; a.mshSrc="4897"; a.mshTxt=nfx(a.abE25)+" z "+nfx(a.allE25)+" pacjentów (EAN, 2025)";}
  else if(c&&a.sub24){a.msh=a.msh24; a.mshSrc="15035"; a.mshTxt=nfx(a.ab24)+" z "+nfx(a.sub24)+" pacjento-substancji (2024, poziom substancji – zapas)";}
  else if(c&&a.allR4){a.msh=a.abR4/a.allR4; a.mshSrc="4897R"; a.mshTxt=nfx(a.abR4)+" z "+nfx(a.allR4)+" pacjentów (EAN, "+F4L+")";}
  else {a.msh=null; a.mshSrc=null; a.mshTxt="brak danych";}
  a.subs=new Set([...f.sub.map(s=>snorm(s[2])),...f.ean.map(e=>snorm(e[3])),...f4(f).map(e=>snorm(e[2]))]);
  a.city=f.city||(f.addr||"").split(",").pop().trim();
  a.cf=CF(); return f._a=a;
}
const nfx=v=>v==null?"brak danych":Number(v).toLocaleString("pl-PL");
const ST=window.__ff={q:"",ow:"",p:"",s:"",i:""};
function fac(mode,arg){
  const {nf,pln,esc,ND,V,S,table}=A();
  if(mode==="f") return facCard(arg);
  if(mode==="w"){ST.ow=arg||"";} if(mode==="p"){ST.p=arg||"";} if(mode==="s"){ST.s=arg||"";}
  if(mode==="i"){ST.i=arg||"";} if(mode==="clear"){ST.ow=ST.p=ST.s=ST.i="";}
  const F=X.fac; F.forEach(facAgg);
  const progs=[...new Set([].concat(...F.map(f=>f._a.allProgs)))].sort((a,b)=>parseInt(a.slice(2))-parseInt(b.slice(2)));
  const subs=[...new Set([].concat(...F.map(f=>f.sub.map(s=>s[2]))))].sort();
  const indsAll=[...new Set([].concat(...F.filter(f=>f._a.inScope!==false).map(f=>Object.keys(f._a.inds))))].sort(); const iN=i=>window.R1&&window.R1.indName?window.R1.indName(i):i;
  const owT=(!ST.ow&&window.R1&&window.R1.owList)?window.R1.owList():(ST.ow?String(ST.ow).split(","):[]); const cS=CF(); const rows=F.filter(f=>f._a.inScope!==false&&(!owT.length||owT.includes(f.ow))&&(!ST.p||f._a.allProgs.includes(ST.p))&&(!window.PF||!PF.on()||f._a.allProgs.some(PF.progOk))&&(!ST.s||f._a.subs.has(snorm(ST.s)))&&(!ST.i||ST.i in f._a.inds)).sort((a,b)=>(b._a.sub24||0)-(a._a.sub24||0)||(b._a.allE25||0)-(a._a.allE25||0)||(b._a.allR4||0)-(a._a.allR4||0)||(b._a.plan25||0)-(a._a.plan25||0));
  const sel=(k,opts,lab)=>`<label class="flab"><span>${({ow:"Województwo",p:"Program",s:"Substancja",i:"Wskazanie"})[k]}</span><select aria-label="${({ow:"Województwo",p:"Program",s:"Substancja",i:"Wskazanie"})[k]}" onchange="window.__ff.${k}=this.value;if(location.hash!=='#/placowki')location.hash='#/placowki';else window.dispatchEvent(new HashChangeEvent('hashchange'))"><option value="">${lab}</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${ST[k]===v?"selected":""}>${esc(l)}</option>`).join("")}</select></label>`;
  const umwNote=X.umw?"":`<p class="nd">Umowy NFZ (app-umw-api) nie zostały jeszcze zaimportowane do tego builda.</p>`;
  return `<h1>Placówki</h1><p class="sub">${cS&&window.R1?`Zakres: wskazania i programy lekowe, w których ${esc(cS)} ma produkty (${esc([...window.R1.actInds(cS)].map(i=>window.R1.indName(i)).join(", ")||"brak danych")}; programy ${esc([...window.R1.myProgs(cS)].join(", ")||"brak danych")}) – placówki z pacjentami tych wskazań w NFZ zb. 4897 lub z umową na te programy.`:"Wszystkie placówki z danymi pacjentów NFZ per EAN (zb. 4897, wszystkie wskazania) lub z umową NFZ na programy lekowe objęte importem umów."} Umowy NFZ (app-umw-api) zaimportowano dla programów ${esc(UMWP)}; dla pozostałych programów placówki wynikają wyłącznie z zb. 4897. Kliknij nazwę, aby otworzyć kartę.</p>${umwNote}
  <div class="tbar">${sel("ow",Object.entries(OWN).sort((a,b)=>String(a[1]).localeCompare(String(b[1]),"pl")).map(([k,v])=>[k,v]),"Wszystkie województwa")} <label class="flab"><span>Program lekowy</span><button class="chip ctxc pfbtn" id="pfplac" aria-label="Wybierz program lekowy (wiele)" onclick="PF.sheet()">${window.PF&&PF.on()?A().esc(PF.label()):"Wszystkie programy"} ▾</button></label> ${sel("s",subs.map(s=>[s,s]),"Wszystkie substancje")} ${sel("i",indsAll.map(i=>[i,iN(i)]),"Wszystkie wskazania")} <a class="btn sm ghost" href="#/placowki/clear">Wyczyść filtry</a></div>
  <div class="grid g4"><div class="card kpi"><div class="l">Placówki (filtr)</div><div class="v">${nf(rows.length)}</div><div class="d">z ${nf(F.length)} w bazie</div></div>
  <div class="card kpi"><div class="l">Z danymi pacjentów per substancja (15035/8475/26565)</div><div class="v">${nf(rows.filter(f=>f.sub.length).length)}</div></div>
  <div class="card kpi"><div class="l">Z danymi pacjentów ICD×EAN (4897)</div><div class="v">${nf(rows.filter(f=>f.ean.length).length)}</div></div>
  <div class="card kpi"><div class="l">Powiązane z przetargami TED</div><div class="v">${nf(rows.filter(f=>f.ted.length).length)}</div><div class="d">dopasowanie automatyczne (nazwa+miasto)</div></div></div>
  <div class="card"><h2>Ranking placówek</h2>${table([
   {h:"Placówka",v:x=>TCN(x.name),f:x=>`<a href="#/placowki/f/${encodeURIComponent(x.k)}">${esc(TCN(x.name))}</a>`},{h:"Miasto",v:x=>TCN(x._a.city)},{h:"Woj.",v:x=>owName(x.ow)},{h:"Kod NFZ",k:"code"},
   {h:"Wskazania (zb. 4897, 2025)",v:x=>Object.keys(x._a.inds).sort((p,q)=>x._a.inds[q]-x._a.inds[p]).map(i=>iN(i)+(x._a.inds[i]?" ("+nf(x._a.inds[i])+")":" (<5)")).join(", ")+(x._a.indsFb?" †":"")||null,empty:"–",t:"Wskazania w zakresie wybranej firmy, w których placówka miała pacjentów (NFZ zb. 4897, 2025, suma po EAN; „<5” = tylko komórki ukryte przez NFZ; † = brak w latach 2024/2025, wartości z "+F4L+")."},
   {h:"Pacjenci – EAN ("+F4L+")",n:1,v:x=>x._a.allR4,f:x=>x._a.allR4==null?(x._a.r4n?LT5:`<span class="alt" title="Placówka nie występuje w zb. 4897 dla tych wskazań">brak w zb. 4897</span>`):nf(x._a.allR4),t:"Najnowsze 12 miesięcy NFZ zb. 4897 (ICD-10 × EAN × świadczeniodawca), suma po EAN w zakresie wskazań; komórki <5 pominięte."},
   {h:"Programy (umowa "+(rows[0]&&rows[0]._a.lastY||"")+")",v:x=>x._a.progsLast.join(", ")||null,empty:"–"},
   {h:"Plan programów 2025 (UMW)",n:1,v:x=>x._a.plan25,f:x=>x._a.plan25==null?`<span class="alt" title="Brak dopasowanej umowy na programy lekowe w NFZ app-umw-api (placówka może rozliczać chemioterapię lub inny zakres)">brak pozycji w UMW</span>`:V(pln(x._a.plan25),"NFZ app-umw-api – suma wartości pozycji umów pozycji programów lekowych",X.built,X.umw_url)},
   {h:"Pacjenci – suma substancji (15035, 2024)",n:1,v:x=>x._a.sub24,f:x=>x._a.sub24==null?`<span class="alt" title="NFZ ukrywa komórki &lt;5; brak wiersza = placówka nie leczyła tymi substancjami lub poniżej progu">brak w zb. 15035 (0 lub &lt;5)</span>`:Vf(nf(x._a.sub24),"ds15035_programy_lekowe_0609_2024_2025.xml")},
   ...(CF()?[{h:"Pacjenci marek "+CF()+" – EAN (4897, 2025)",n:1,v:x=>x._a.abE25,f:x=>x._a.abE25==null?`<span class="alt" title="NFZ ukrywa komórki &lt;5">brak w zb. 4897 (0 lub &lt;5)</span>`:nf(x._a.abE25)},
   {h:"Udział "+CF()+" (min.)",n:1,v:x=>x._a.msh,f:x=>x._a.msh==null?`<span class="alt">n/d (brak liczb pacjentów)</span>`:`<span title="${esc(x._a.mshTxt)}">${nf(100*x._a.msh,1)}%</span> <span class="muted" style="font-size:11px">${x._a.mshSrc==="4897"?"EAN 2025":x._a.mshSrc==="4897R"?"EAN 12 m.":"subst. 2024"}</span>`,t:"Najpierw poziom marki (EAN, zb. 4897, 2025); gdy brak – substancje jednego podmiotu (zb. 15035, 2024); gdy brak – EAN z "+F4L+". Udział minimalny: komórki <5 i EAN bez podmiotu pominięte."}]:[]),
   {h:"TED",n:1,v:x=>x.ted.length||null,empty:"–"}],rows,{name:"placowki_ranking",limit:500,src:`<div class="src">Źródła: NFZ app-umw-api (umowy, plany), dane.gov.pl NFZ zb. <a href="https://dane.gov.pl/pl/dataset/15035" target="_blank">15035</a>, <a href="https://dane.gov.pl/pl/dataset/8475" target="_blank">8475</a>, <a href="https://dane.gov.pl/pl/dataset/26565" target="_blank">26565</a>, <a href="https://dane.gov.pl/pl/dataset/4895" target="_blank">4895</a>, <a href="https://dane.gov.pl/pl/dataset/4897" target="_blank">4897</a>, TED API v3. Sumy po substancjach/EAN liczą pacjenta wielokrotnie, jeśli otrzymał kilka leków; komórki &lt;5 pominięte. Udział wybranej firmy = pacjenci substancji przypisanych tej firmie (jeden podmiot w wykazie MZ) / suma pacjentów wszystkich substancji; kolumny widoczne po wybraniu firmy.</div>`})}</div>`;
}
const TCN=x=>window.TC?window.TC(x):String(x||"");
function facCard(k){
  const {nf,pln,esc,ND,V,S,table,chart,PAL,ACC}=A(); const D=A().D; const c=CF();
  const f=X.fac.find(x=>x.k===k)||X.fac.find(x=>x.code===k)||X.fac.find(x=>x.k.split("|")[1]===k); if(!f) return `<p>Nie znaleziono placówki ${esc(k)}. <a href="#/placowki">← Placówki</a></p>`;
  const a=facAgg(f);
  if(f.f4only&&!f.city) f.city=(f.addr||"").replace(/^.*\d{2}-\d{3}\s*/,"").split(",")[0].trim()||null;
  let h=`<p class="noprint"><a href="#/placowki">← Placówki</a> · <a href="#/dzialania">← Lista działań</a></p><h1>${esc(TCN(f.name))} – ${esc(TCN(a.city||f.city||""))}</h1><p class="sub">${esc(f.addr||a.city||"")} · woj. ${esc(owName(f.ow))} (OW ${f.ow}) · kod świadczeniodawcy NFZ <b>${esc(f.code)}</b>${f.nip?" · NIP "+esc(f.nip):""}${f.regon?" · REGON "+esc(f.regon):""}</p>${f.src_addr?Sf(f.src_addr):""}`;
  if(window.R1&&window.R1.brief) h+=window.R1.brief(f)+f4card(f,c)+`<details class="raw"><summary>Dane szczegółowe placówki (umowy, substancje, EAN, ICD, przetargi)</summary>`;
  h+=`<div class="grid g4"><div class="card kpi"><div class="l">Programy wg umów NFZ</div><div class="v">${a.allProgs.length?esc(a.allProgs.join(", ")):ND}</div></div>
  <div class="card kpi"><div class="l">Plan programów lekowych 2025</div><div class="v">${a.plan25==null?ND:V(pln(a.plan25),"NFZ app-umw-api – plan umów",X.built,X.umw_url)}</div><div class="d">${a.plan26!=null?"2026: "+pln(a.plan26):""}</div></div>
  <div class="card kpi"><div class="l">${c?"Udział "+esc(c)+" (minimalny)":"Pacjenci EAN 2025"}</div><div class="v">${c?(a.msh==null?ND:nf(100*a.msh,1)+"%"):(a.allE25==null?ND:nf(a.allE25))}</div><div class="d">${c?esc(a.mshTxt):"zb. 4897 – wybierz firmę, aby zobaczyć udział"}${c&&a.mshSrc==="4897"&&a.allE25?` · nieprzypisane ${nf(100*(a.unE25||0)/a.allE25,1)}%, komórek &lt;5: ${nf(a.lt5E25)}`:""}</div></div>
  <div class="card kpi"><div class="l">Przetargi TED (powiązane)</div><div class="v">${nf(f.ted.length?D.tenders.filter(t=>f.ted.includes(t.b)).length:0)}</div><div class="d">części przetargów</div></div></div>`;
  // programmes & plan
  const pr=[];const sm=a=>a.length?a.reduce((s,x)=>s+x[3],0):null;Object.keys(f.progs).sort().reverse().forEach(y=>f.progs[y].sort().forEach(p=>{const pl=f.plan.filter(x=>x[0]===y&&x[1]===p);pr.push({y,p,proc:sm(pl.filter(x=>x[2]==="procedury")),drug:sm(pl.filter(x=>x[2]==="leki")),ids:[...new Set(pl.map(x=>x[4]))]});}));
  const aurl=id=>`https://api.nfz.gov.pl/app-umw-api/agreements/${id}?format=json&api-version=1.2`;
  h+=`<div class="grid g2"><div class="card"><h2>Programy lekowe w umowach NFZ</h2>${X.umw?table([{h:"Rok",k:"y"},{h:"Program",k:"p"},{h:"Plan – procedury (zł)",n:1,v:x=>x.proc,f:x=>x.proc==null?ND:V(nf(x.proc,2),"NFZ app-umw-api – wartość pozycji umowy (pole price)",X.built,x.ids[0]&&aurl(x.ids[0]))},{h:"Plan – leki (zł)",n:1,v:x=>x.drug,f:x=>x.drug==null?ND:V(nf(x.drug,2),"NFZ app-umw-api – wartość pozycji umowy (pole price)",X.built,x.ids[0]&&aurl(x.ids[0]))},{h:"Umowa",v:x=>x.ids.join(" "),f:x=>x.ids.map(i=>`<a href="${aurl(i)}" target="_blank">API</a>`).join(" ")||ND}],pr,{name:"programy_"+f.code,search:false,src:S("NFZ app-umw-api v1.2 – plany umów (suma wartości pozycji 03.0000.xxx procedury / 03.0001.xxx leki; plan, nie wykonanie)",X.umw_url,X.built)}):`<p>${ND} – umowy NFZ nie zaimportowane.</p>`}</div>`;
  h+=`<div class="card"><h2>Wszystkie umowy NFZ placówki (rodzaje świadczeń)</h2>${f.agr.length?table([{h:"Rok",k:0},{h:"Rodzaj świadczeń",k:1},{h:"Wartość umowy (zł)",n:1,v:x=>x[2],f:x=>V(nf(x[2],2),"NFZ app-umw-api – amount (wartość całej umowy)",X.built,aurl(x[4]))},{h:"Nr umowy",k:3}],f.agr,{name:"umowy_"+f.code,src:S("NFZ app-umw-api v1.2 – agreements (amount = wartość całej umowy w danym rodzaju świadczeń)",X.umw_url,X.built)}):`<p>${ND}</p>`}</div></div>`;
  // substance patients
  const subP=[...new Set(f.sub.map(s=>s[0]+"|"+s[1]+"|"+s[3]))];
  h+=`<div class="card"><h2>Pacjenci per program i substancja (dane NFZ per świadczeniodawca)</h2>`;
  if(f.sub.length){
    const grp=subP.map(g=>{const [src,p,per]=g.split("|");const rr=f.sub.filter(s=>s[0]===src&&s[1]===p&&s[3]===per);const tot=rr.reduce((s,x)=>s+(x[5]||0),0);const ab=rr.filter(x=>isCS(p,x[2])).reduce((s,x)=>s+(x[5]||0),0);return {src,p,per,tot,ab,lt5:rr.filter(x=>x[5]==null).length,rr};});
    const last=grp.filter(g=>g.per==="2024");
    if(last.length){chart("fsub",{type:"bar",data:{labels:last.map(g=>g.p),datasets:[...new Set([].concat(...last.map(g=>g.rr.map(r=>r[2]))))].map((s,i)=>({label:s,data:last.map(g=>{const r=g.rr.find(r=>r[2]===s);return r?r[5]:null;}),backgroundColor:last.some(g=>isCS(g.p,s))?ACC:PAL[(i+1)%PAL.length]}))},options:{maintainAspectRatio:false,indexAxis:"y",scales:{x:{stacked:true},y:{stacked:true}},plugins:{legend:{position:"bottom",labels:{boxWidth:10,font:{size:10}}}}}});
      h+=`<div class="chartbox tall"><canvas id="fsub"></canvas></div><p class="muted">2024 – pacjenci wg substancji ${c?"("+esc(c)+": kolor akcentu)":""}. Pacjent leczony kolejno dwiema substancjami występuje dwukrotnie.</p>`;}
    h+=table([{h:"Zbiór",k:"src",f:x=>`<a href="https://dane.gov.pl/pl/dataset/${x.src}" target="_blank">${x.src}</a>`},{h:"Program",k:"p"},{h:"Okres",k:"per"},{h:"Suma pacjento-substancji",n:1,v:x=>x.tot},...(c?[{h:esc(c)+" (substancje jednego podmiotu)",n:1,v:x=>x.ab},{h:"Udział "+esc(c),n:1,v:x=>x.tot?x.ab/x.tot:null,f:x=>x.tot?nf(100*x.ab/x.tot,1)+"%":ND}]:[]),{h:"Komórki <5",n:1,v:x=>x.lt5}],grp,{name:"msh_"+f.code,search:false});
    h+=table([{h:"Zbiór",k:0},{h:"Program",k:1},{h:"Substancja",k:2,f:x=>`<span class="${isCS(x[1],x[2])?"chip sel":""}">${esc(x[2])}</span>`},{h:"Okres",k:3},{h:"Pacjenci",n:1,v:x=>x[5],f:x=>x[5]==null?LT5:nf(x[5])}],f.sub,{name:"substancje_"+f.code,src:`<div class="src">Źródło: dane.gov.pl – NFZ zb. <a href="https://dane.gov.pl/pl/dataset/15035" target="_blank">15035</a> (B.32/33/35/36/47/55/82/124; 2024 i I–IV 2025), <a href="https://dane.gov.pl/pl/dataset/8475" target="_blank">8475</a> (B.124; 2022–2024), <a href="https://dane.gov.pl/pl/dataset/26565" target="_blank">26565</a> (B.70; 2024). Dane per substancja (bez nazwy handlowej); firma przypisana tylko dla substancji jednego podmiotu w programie.</div>`});}
  const noSub=a.allProgs.filter(p=>!f.sub.some(s=>s[1]===p));
  if(noSub.length||!f.sub.length) h+=`<p><span class="nd">brak danych</span> – NFZ nie publikuje liczby pacjentów per substancja dla tej placówki w programach: <b>${esc((f.sub.length?noSub:a.allProgs).join(", ")||"–")}</b>. Dane per świadczeniodawca × substancja są publiczne tylko dla B.32, B.33, B.35, B.36, B.47, B.55, B.82, B.124 (zb. 15035: 2024, I–IV 2025), B.124 (zb. 8475: 2022–2024) i B.70 (zb. 26565: 2024). Nie przybliżano.${f4(f).length?` Zastępczo: pacjenci per marka i substancja z ${esc(F4L)} – karta „Pacjenci wg wskazania i firmy” na górze.`:""}</p>`;
  h+=`</div>`;
  // EAN brands
  if(f.ean.length){const inds=[...new Set(f.ean.map(e=>e[0]+"|"+e[1]))].sort();
    const ms=inds.map(g=>{const [y,ind]=g.split("|");const rr=f.ean.filter(e=>e[0]===y&&e[1]===ind);const tot=rr.reduce((s,e)=>s+(e[5]||0),0),ab=rr.filter(e=>c&&e[4]===c).reduce((s,e)=>s+(e[5]||0),0);return {y,ind,tot,ab,lt5:rr.reduce((s,e)=>s+e[6],0),br:[...new Set(rr.filter(e=>c?e[4]===c:true).map(e=>e[2]))].join(", ")};});
    h+=`<div class="grid g2"><div class="card"><h2>${c?"Marki "+esc(c)+" wg wskazania":"Wskazania"} – pacjenci z rozpoznaniem i lekiem (EAN)</h2>${table([{h:"Rok",k:"y"},{h:"Wskazanie",k:"ind"},{h:"Suma pacjentów (wszystkie EAN)",n:1,v:x=>x.tot}].concat(c?[{h:"Marki "+esc(c),n:1,v:x=>x.ab},{h:"Udział "+esc(c),n:1,v:x=>x.tot?x.ab/x.tot:null,f:x=>x.tot?nf(100*x.ab/x.tot,1)+"%":ND}]:[]).concat([{h:"Marki",k:"br",empty:"–"},{h:"Komórki <5",n:1,v:x=>x.lt5}]),ms,{name:"ean_msh_"+f.code,search:false,src:`<div class="src">Źródło: dane.gov.pl – NFZ zb. <a href="https://dane.gov.pl/pl/dataset/4897" target="_blank">4897</a> (pacjenci z rozpoznaniem ICD-10, u których zastosowano lek o danym EAN; 2024 i 2025). Suma po wierszach EAN – pacjent z kilkoma opakowaniami/lekami liczony wielokrotnie. Marka wg słownika EAN z obwieszczeń MZ. Firma marki wg URPL (EAN→podmiot odpowiedzialny).</div>`})}</div>
    <div class="card"><h2>Wszystkie leki (EAN → marka)</h2>${table([{h:"Rok",k:0},{h:"Wskazanie",k:1},{h:"Marka",k:2,f:x=>`<span class="${c&&x[4]===c?"chip sel":""}">${esc(x[2])}</span>`},{h:"Substancja",k:3},{h:"Firma",k:4,empty:"–"},{h:"Pacjenci (suma)",n:1,v:x=>x[5]},{h:"<5",n:1,v:x=>x[6]}],f.ean,{name:"ean_"+f.code})}</div></div>`;}
  else h+=`<div class="card"><h2>Marki (EAN)</h2><p>${f4(f).length?`Brak w zb. 4897 za lata kalendarzowe 2024/2025 – dane z ${esc(F4L)} w karcie „Pacjenci wg wskazania i firmy” na górze.`:ND+" – placówka nie występuje w zb. 4897 dla monitorowanych rozpoznań."}</p></div>`;
  // ICD
  h+=`<div class="grid g2"><div class="card"><h2>Pacjenci z rozpoznaniem (zb. 4895)</h2>${f.icd.length?table([{h:"Rok",k:0},{h:"Wskazanie",k:1,f:x=>`<a href="#/pacjenci/${encodeURIComponent(x[1])}">${esc(x[1])}</a>`},{h:"Pacjenci (suma kodów)",n:1,v:x=>x[2]},{h:"Komórki <5",n:1,v:x=>x[3]}],f.icd,{name:"icd_"+f.code,search:false,src:`<div class="src">Źródło: dane.gov.pl – NFZ zb. <a href="https://dane.gov.pl/pl/dataset/4895" target="_blank">4895</a>. Suma po kodach ICD wskazania (np. M05+M06) – pacjent może być liczony wielokrotnie.</div>`}):(()=>{const r=f4(f); if(!r.length) return `<p>${ND}</p>`; const m={}; r.forEach(e=>{const x=m[e[0]]||(m[e[0]]={i:e[0],n:0,l:0}); x.n+=e[4]||0; x.l+=e[5]||0;}); return `<p class="muted">Brak w zb. 4895 – zastępczo ${esc(F4L)} (pacjenci z rozpoznaniem i lekiem programowym, suma po EAN).</p>`+table([{h:"Wskazanie",k:"i"},{h:"Pacjenci (suma EAN)",n:1,v:x=>x.n||null,f:x=>x.n?nf(x.n):LT5},{h:"Komórki <5",n:1,v:x=>x.l}],Object.values(m).sort((a,b)=>b.n-a.n),{name:"icd4897_"+f.code,search:false,src:F4S()});})()}</div>`;
  const T=f.ted.length?D.tenders.filter(t=>f.ted.includes(t.b)):[];
  h+=`<div class="card"><h2>Przetargi TED</h2>${T.length?table([{h:"Data",k:"d"},{h:"Typ",k:"t"},{h:"Substancja",k:"s"},{h:"Część",k:"lt",f:x=>esc((x.lt||"").slice(0,90))},{h:"Wartość (TED)",n:1,v:x=>x.lv,f:x=>x.lv==null?"–":V(nf(x.lv,2)+" zł","TED API v3",D.meta.ted_retrieved,D.meta.ted_notice_url+x.p)},{h:"Wykonawca",k:"w",empty:"–"},{h:"Ogłoszenie",k:"p",f:x=>`<a href="${D.meta.ted_notice_url+x.p}" target="_blank">${x.p}</a>`}],T,{name:"ted_"+f.code,src:`<div class="src">TED API v3; powiązanie z placówką automatyczne (nazwa zamawiającego „${esc(f.ted.join("; "))}” + miasto) – do weryfikacji.</div>`}):`<p>${ND} – brak dopasowanych ogłoszeń TED.</p>`}
  <p class="muted">Kolejki oczekujących (NFZ Terminy leczenia) i badania kliniczne – sekcja „Badania kliniczne i kolejki NFZ” na dole karty.</p></div></div>`;
  if(window.R1&&window.R1.brief) h+=`</details>`;
  // R6: badania kliniczne (CTIS) i kolejki NFZ – zwinięte na dole karty
  if(window.EXTF) h+=`<details class="raw" id="facextd"><summary>Badania kliniczne (CTIS, ClinicalTrials.gov) i kolejki NFZ</summary>${window.EXTF.slot(f.k)}</details>`;
  return h;
}
function f4card(f,c){const {nf,esc,table,chart,PAL,ACC,ND}=A(); const r=f4(f); const iN=i=>window.R1&&window.R1.indName?window.R1.indName(i):i;
  if(!r.length) return `<div class="card" id="f4card"><h2>Pacjenci wg wskazania i firmy</h2><p>${ND} – placówka nie występuje w ${esc(F4L)} (brak pacjentów wybranych wskazań z lekiem programowym albo wszystkie komórki &lt;5).</p>${F4S()}</div>`;
  const sm=a=>a.reduce((s,e)=>s+(e[4]||0),0); const inds=[...new Set(r.map(e=>e[0]))]; const tI={}; inds.forEach(i=>tI[i]=sm(r.filter(e=>e[0]===i))); inds.sort((a,b)=>tI[b]-tI[a]); const top=inds.slice(0,12);
  let ds; const OTH="#9AA0A6";
  if(c) ds=[{label:c,data:top.map(i=>sm(r.filter(e=>e[0]===i&&e[3]===c))),backgroundColor:ACC},{label:"Inne firmy / nieprzypisane",data:top.map(i=>sm(r.filter(e=>e[0]===i&&e[3]!==c))),backgroundColor:OTH}];
  else {const co={}; r.forEach(e=>{const k=e[3]||"nieprzypisane"; co[k]=(co[k]||0)+(e[4]||0);}); const tc=Object.keys(co).filter(k=>k!=="nieprzypisane").sort((a,b)=>co[b]-co[a]).slice(0,5);
    ds=tc.map((k,j)=>({label:k,data:top.map(i=>sm(r.filter(e=>e[0]===i&&e[3]===k))),backgroundColor:PAL[j%PAL.length]})).concat([{label:"Pozostałe / nieprzypisane",data:top.map(i=>sm(r.filter(e=>e[0]===i&&!tc.includes(e[3])))),backgroundColor:OTH}]);}
  const id="f4"+String(f.k).replace(/[^0-9a-z]/gi,""); const all=sm(r), my=c?sm(r.filter(e=>e[3]===c)):0;
  chart(id,{type:"bar",data:{labels:top.map(iN),datasets:ds},options:{maintainAspectRatio:false,indexAxis:"y",scales:{x:{stacked:true,title:{display:true,text:"pacjenci (suma po EAN)"}},y:{stacked:true}},plugins:{legend:{position:"bottom",labels:{boxWidth:10,font:{size:12}}}}}});
  const tt=c?(all?`${esc(c)}: ${nf(100*my/all,1)}% pacjentów (suma EAN) w placówce – ${nf(my)} z ${nf(all)}`:`${esc(c)}: brak pacjentów powyżej progu 5`):`Największe wskazanie: ${esc(iN(inds[0]))} – ${tI[inds[0]]?nf(tI[inds[0]]):"<5"} pacjentów`;
  return `<div class="card" id="f4card"><h2>${tt}</h2><p class="muted">Pacjenci wg wskazania i firmy · <b>${esc(F4L)}</b></p><div class="chartbox" style="height:${Math.max(220,top.length*30+90)}px"><canvas id="${id}"></canvas></div>
  <details><summary>Tabela: wskazanie × marka (${nf(r.length)} wierszy)</summary>${table([{h:"Wskazanie",v:x=>iN(x[0])},{h:"Marka",k:1,f:x=>`<span class="${c&&x[3]===c?"chip sel":""}">${esc(x[1])}</span>`},{h:"Substancja",k:2},{h:"Firma",k:3,empty:"–"},{h:"Pacjenci (suma EAN)",n:1,v:x=>x[4],f:x=>x[4]==null?LT5:nf(x[4])},{h:"Komórki <5",n:1,v:x=>x[5]}],r,{name:"placowka_4897_12m_"+f.code,limit:60})}</details>${F4S()}</div>`;}
window.V2={pac,fac,PEN,NOPEN,progPat,natv,mOf,facAgg,F4L,f4};
})();
