/* ======================= LANDING ======================= */
(function landing(){
  const box=$("#slides"), dots=$("#dots");
  SLIDES.forEach((s,i)=>{ const d=document.createElement("div"); d.className="slide"+(i%2?" alt":""); d.style.backgroundImage=`url("${s[0]}")`; box.appendChild(d); dots.appendChild(document.createElement("b")); const im=new Image(); im.src=s[0]; });
  let k=0; const els=box.children, ds=dots.children;
  function show(n){ [...els].forEach((e,i)=>{ if(i===n){ e.classList.remove("on"); void e.offsetWidth; e.classList.add("on"); } else e.classList.remove("on"); }); [...ds].forEach((e,i)=>e.classList.toggle("on",i===n)); const c=$("#cap"); c.style.opacity=0; setTimeout(()=>{c.textContent=SLIDES[n][1]; c.style.opacity=1;},400); }
  show(0); landing.t=setInterval(()=>{ if($("#landing").classList.contains("hidden")) return; k=(k+1)%SLIDES.length; show(k); },5200);
  $("#route").innerHTML = STOPS.map((s,i)=>`<div class="rc"><div class="ph" style="background-image:url('${IMG[s.id]}')"><span class="n">${i+1}</span></div><div class="tx"><b>${s.name}</b><span>${SHORT[s.id]||""}</span></div></div>`).join("");
  $("#credits").textContent = "Fotos: Wikimedia Commons (licencias CC BY / CC BY-SA), autores: Rafesmar, Weldon Kennedy, Ввласенко, Fernando, Querubin Saldaña, Bernard Gagnon, J. L. Filpo Cabana y otros. Algunas fotos de las paradas son vistas generales de la ciudad.";
})();

