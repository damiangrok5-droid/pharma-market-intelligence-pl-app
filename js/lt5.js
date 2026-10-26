// R2-05: komórki z liczbą pacjentów 1–4 są usuwane z publicznych plików danych (null + ścieżka w _lt5).
// Tu zamieniamy je na znacznik LT5V: arytmetycznie 0, wyświetlany jako „<5” (nf/n5/sup5 go rozpoznają).
(function(){
  const o=new Number(0); o.lt5=true; o.toString=()=>"<5"; o.toJSON=()=>null; window.LT5V=o;
  window.isLT5=v=>!!(v&&v.lt5);
  window.applyLT5=function(name){const D=window[name]; if(!D||!D._lt5||D._lt5done) return;
    D._lt5.forEach(p=>{let x=D; for(let i=0;i<p.length-1&&x;i++) x=x[p[i]]; const k=p[p.length-1]; if(x&&x[k]===null) x[k]=o;}); D._lt5done=1;};
  ["DATA","DATA2","DATA3","DATAR1","NFZ_CHEMO","JGP"].forEach(n=>window.applyLT5(n));
})();
