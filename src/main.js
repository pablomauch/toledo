/* ======================= ESTADO ======================= */
const $ = s => document.querySelector(s);
let idx=0, mode="walk", visited={}, pos=null, heading=null, compassOn=false, view="guide";
let autoVoice=true, rate=1.0;
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const prefs=store.get("toledo_prefs")||{};
if(prefs.rate) rate=prefs.rate; if(prefs.auto===false) autoVoice=false;
const today=new Date().toDateString();
let told = (store.get("toledo_told")||{}); if(told.day!==today) told={day:today};
function markTold(k){ told[k]=1; store.set("toledo_told",told); }
const strip = s => (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();

/* ======================= VOZ ======================= */
const synth=window.speechSynthesis;
let voice=null, voices=[], queue=[], cur="", speaking=false, paused=false, nowLabel="", gen=0, resumeAfter=null, lastSpeechEnd=Date.now();
const REG={"es-MX":["🇲🇽","México"],"es-US":["🇺🇸","EE. UU. (latino)"],"es-419":["🌎","Latinoamérica"],"es-AR":["🇦🇷","Argentina"],"es-CL":["🇨🇱","Chile"],"es-CO":["🇨🇴","Colombia"],"es-PE":["🇵🇪","Perú"],"es-VE":["🇻🇪","Venezuela"],"es-UY":["🇺🇾","Uruguay"],"es-ES":["🇪🇸","España"]};
const ORDER=["es-AR","es-CL","es-UY","es-419","es-MX","es-US","es-CO","es-PE","es-VE"];
const norm=l=>(l||"").replace("_","-");
function score(v){const l=norm(v.lang).toLowerCase();let i=ORDER.findIndex(o=>l.startsWith(o.toLowerCase()));let s=i<0?(l.startsWith("es-es")?50:60):i*2;if(/premium|enhanced|mejorada|neural|natural|online/i.test(v.name))s-=1.5;if(/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|bad|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bahh|fred|junior|kathy|ralph/i.test(v.name))s+=30;return s;}
function loadVoices(){ if(!synth) return; voices=synth.getVoices().filter(v=>norm(v.lang).toLowerCase().startsWith("es")).sort((a,b)=>score(a)-score(b)); if(prefs.voice){const v=voices.find(v=>v.name===prefs.voice); if(v) voice=v;} if(!voice) voice=voices[0]||null; renderVoices(); }
if(synth){ loadVoices(); synth.onvoiceschanged=loadVoices; setTimeout(loadVoices,800); }
function renderVoices(){
  const box=$("#vlist"); if(!box) return;
  if(!voices.length){ box.innerHTML=`<div class="note">No se encontraron voces en español en este teléfono.</div>`; return; }
  box.innerHTML=voices.slice(0,12).map((v,i)=>{const l=norm(v.lang);const r=Object.keys(REG).find(k=>l.toLowerCase()===k.toLowerCase());const [fl,rg]=r?REG[r]:["🌐",l];
    return `<button class="vopt ${voice&&v.name===voice.name?"on":""}" data-i="${i}"><span class="fl">${fl}</span><span><b>${v.name.replace(/\(.*\)/,"").trim()}</b><span>${rg}${/premium|enhanced|mejorada|neural/i.test(v.name)?" · alta calidad":""}</span></span></button>`;}).join("");
  box.querySelectorAll(".vopt").forEach(b=>b.onclick=()=>{voice=voices[+b.dataset.i];prefs.voice=voice.name;store.set("toledo_prefs",prefs);renderVoices();say("Hola, soy su guía por Toledo. ¿Les gusta cómo sueno?","Prueba de voz");});
}
function chunk(text){ const clean=text.replace(/<[^>]+>/g,""); const parts=clean.replace(/([\.\?\!:])\s+/g,"$1|").split(/\||\n+/).map(s=>s.trim()).filter(Boolean); const out=[];let buf=""; for(const p of parts){ if((buf+" "+p).length>200&&buf){out.push(buf);buf=p}else{buf=buf?buf+" "+p:p} } if(buf) out.push(buf); return out; }
function hardCancel(){ gen++; if(synth) synth.cancel(); }
/* say: reemplaza lo que suena */
function say(text,label){ if(!synth){ toast("Este navegador no tiene voz."); return; } hardCancel(); resumeAfter=null; queue=chunk(text); nowLabel=label||""; paused=false; next(); }
/* sayIfFree: solo si no está hablando (historias automáticas) */
function sayIfFree(text,label){ if(speaking||paused) return false; say(text,label); return true; }
/* sayUrgent: indicación de giro; interrumpe y luego retoma la historia */
function sayUrgent(text){
  if(!synth) return;
  const saved = speaking&&!paused ? {q:[cur,...queue].filter(Boolean),label:nowLabel} : (resumeAfter||null);
  hardCancel(); queue=[text]; nowLabel="Indicación"; resumeAfter=saved; paused=false; next();
}
function next(){
  if(!queue.length && resumeAfter){ queue=resumeAfter.q; nowLabel=resumeAfter.label; resumeAfter=null; }
  if(!queue.length){ speaking=false; cur=""; lastSpeechEnd=Date.now(); updatePlayer(); setTimeout(onSpeechEnd,1400); return; }
  speaking=true; cur=queue.shift();
  const my=gen, u=new SpeechSynthesisUtterance(cur);
  if(voice){u.voice=voice;u.lang=voice.lang;} else u.lang="es-MX";
  u.rate=rate; u.pitch=1;
  u.onend=()=>{ if(my===gen && !paused) next(); };
  u.onerror=e=>{ if(my===gen && e.error!=="interrupted" && e.error!=="canceled"){ speaking=false; updatePlayer(); } };
  synth.speak(u); updatePlayer();
}
function stopVoice(){ chainOn=false; hardCancel(); speaking=false; queue=[]; resumeAfter=null; paused=false; lastSpeechEnd=Date.now(); updatePlayer(); }
function togglePause(){
  if(!speaking){ if(mode==="stop") say(STOPS[idx].narr,STOPS[idx].name); else legSay(true); return; }
  if(paused){ paused=false; hardCancel(); queue.unshift(cur); next(); }
  else { paused=true; hardCancel(); }
  updatePlayer();
}
function updatePlayer(){
  const s=STOPS[idx]; const on=speaking&&!paused;
  $("#pPause").textContent=on?"❚❚":"▶";
  $("#npT").textContent=speaking?(nowLabel||s.name):(mode==="stop"?s.name:"Camino a "+s.name);
  $("#npS").textContent=speaking?(paused?"En pausa":"Narrando…"):"Toquen ▶ para escuchar";
  $("#stop").classList.toggle("playing",on);
  $("#plIcon").textContent=on?"❚❚":"▶";
  $("#plTitle").textContent=on?"Narrando…":(paused?"Continuar":"Escuchar la historia");
}
$("#pPause").onclick=togglePause;
$("#pStop").onclick=stopVoice;
$("#pBack").onclick=()=>{ if(cur){ hardCancel(); queue.unshift(cur); paused=false; next(); } };

/* ======================= GEO BÁSICO ======================= */
const R=6371000, rad=d=>d*Math.PI/180;
function dist(a,b){const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function bearing(a,b){const y=Math.sin(rad(b.lng-a.lng))*Math.cos(rad(b.lat));const x=Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(rad(b.lng-a.lng));return (Math.atan2(y,x)*180/Math.PI+360)%360;}
const CARD=["norte","noreste","este","sureste","sur","suroeste","oeste","noroeste"];
function relDir(b){ if(heading==null) return "hacia el "+CARD[Math.round(b/45)%8]; const d=(b-heading+360)%360; if(d<30||d>330) return "al frente"; if(d<150) return "a su derecha"; if(d<=210) return "detrás"; return "a su izquierda"; }
/* distancia punto-segmento aproximada (metros) */
function distToLine(p,line){ if(!line||line.length<2) return Infinity; let best=Infinity; const kx=Math.cos(rad(p.lat))*111320, ky=110540;
  for(let i=0;i<line.length-1;i++){ const a=line[i],b=line[i+1]; const ax=(a.lng-p.lng)*kx, ay=(a.lat-p.lat)*ky, bx=(b.lng-p.lng)*kx, by=(b.lat-p.lat)*ky; const dx=bx-ax, dy=by-ay; const L=dx*dx+dy*dy; let t=L?-(ax*dx+ay*dy)/L:0; t=Math.max(0,Math.min(1,t)); const x=ax+t*dx, y=ay+t*dy; best=Math.min(best,Math.hypot(x,y)); } return best; }

/* ======================= MOVIMIENTO (¿están quietos?) ======================= */
let track=[], stationary=false, walkedSinceSpeech=0, lastPosForWalk=null;
function updateMotion(p){
  const now=Date.now(); track.push({t:now,lat:p.lat,lng:p.lng}); track=track.filter(x=>now-x.t<75000);
  const span = track.length? now-track[0].t : 0;
  const maxD = Math.max(0,...track.map(x=>dist(x,p)));
  const was=stationary;
  stationary = span>45000 && maxD<18;
  if(!stationary && lastPosForWalk){ const d=dist(lastPosForWalk,p); if(d>4&&d<80){ walkedSinceSpeech+=d; walkedSinceInstr+=d; } }
  lastPosForWalk=p;
  if(was!==stationary){ if(stationary) feedAdd("⏸","Parece que se detuvieron. Pauso las historias automáticas hasta que vuelvan a caminar."); else feedAdd("▶","Siguen caminando. Retomo la guía."); }
  const ms=$("#moveState"); ms.textContent = stationary?"⏸ Detenidos · historias en pausa":"🚶 Caminando"; ms.className="pill "+(stationary?"warn":"blue");
}

/* ======================= MAPA ======================= */
const LAYERS={}; let curLayer="det"; const poiMarkers={};
function poiIcon(p){ return L.divIcon({className:"",html:`<div class="poi ${told["poi_"+p.id]?"d":""}">★</div>`,iconSize:[22,22],iconAnchor:[11,11]}); }
let map=null, meMarker=null, accCircle=null, routeLine=null, ghostLine=null, stopMarkers=[], follow=true;
function mkIcon(i){ const s=STOPS[i]; const cls = i===idx?"c":(visited[s.id]?"d":""); return L.divIcon({className:"",html:`<div class="mk ${cls}">${visited[s.id]&&i!==idx?"✓":i+1}</div>`,iconSize:[30,30],iconAnchor:[15,15]}); }
function initMap(){
  if(map||typeof L==="undefined"){ if(typeof L==="undefined") $("#map").innerHTML='<div style="padding:30px;color:#bfae98;text-align:center">No se pudo cargar el mapa. Usen Google Maps.</div>'; return; }
  map=L.map("map",{zoomControl:false,attributionControl:true}).setView([STOPS[idx].lat,STOPS[idx].lng],16);
  LAYERS.det=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© OpenStreetMap'});
  LAYERS.sat=L.layerGroup([L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:'Esri · Maxar'}),L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",{maxZoom:19,subdomains:"abcd",attribution:'© CARTO'})]);
  LAYERS.det.addTo(map);
  POIS.forEach(p=>{ const mk=L.marker([p.lat,p.lng],{icon:poiIcon(p)}).addTo(map); mk.bindPopup(`<b>${p.n}</b><br>${p.t.charAt(0).toUpperCase()+p.t.slice(1)}<br><button data-poi="${p.id}">🎧 Escuchar</button>`); poiMarkers[p.id]=mk; });
  map.on("popupopen",e=>{ const b=e.popup.getElement().querySelector("button[data-poi]"); if(b) b.onclick=()=>{ const p=POIS.find(x=>x.id===b.dataset.poi); say(p.n+". "+p.t.charAt(0).toUpperCase()+p.t.slice(1),p.n); }; });
  ghostLine=L.polyline(STOPS.map(s=>[s.lat,s.lng]),{color:"#8a6a3a",weight:3,opacity:.5,dashArray:"4 8"}).addTo(map);
  STOPS.forEach((s,i)=>{ const m=L.marker([s.lat,s.lng],{icon:mkIcon(i)}).addTo(map); m.on("click",()=>{ if(i!==idx){ idx=i; mode="walk"; startLeg(); render(); } }); stopMarkers.push(m); });
  map.on("dragstart",()=>{ follow=false; $("#bFollow").classList.remove("on"); });
}
function refreshMarkers(){ stopMarkers.forEach((m,i)=>m.setIcon(mkIcon(i))); }
function drawMe(){
  if(!map||!pos) return;
  const ll=[pos.lat,pos.lng];
  if(!meMarker){ meMarker=L.marker(ll,{icon:L.divIcon({className:"",html:'<div class="me"><div class="cone" id="cone"></div><div class="dot"></div></div>',iconSize:[22,22],iconAnchor:[11,11]}),zIndexOffset:1000}).addTo(map); accCircle=L.circle(ll,{radius:pos.acc,color:"#4aa3ff",weight:1,fillOpacity:.08}).addTo(map); }
  meMarker.setLatLng(ll); accCircle.setLatLng(ll).setRadius(Math.min(pos.acc,150));
  const c=document.getElementById("cone"); if(c){ if(heading!=null){ c.style.display="block"; c.style.transform=`rotate(${heading}deg)`; } else c.style.display="none"; }
  if(follow) map.panTo(ll,{animate:true,duration:.6});
}
$("#bLayer").onclick=()=>{ if(!map) return; map.removeLayer(LAYERS[curLayer]); curLayer=curLayer==="det"?"sat":"det"; LAYERS[curLayer].addTo(map); $("#bLayer").textContent=curLayer==="det"?"🛰️":"🗺️"; toast(curLayer==="det"?"Mapa detallado":"Vista satélite"); };
$("#bFollow").onclick=()=>{ follow=!follow; $("#bFollow").classList.toggle("on",follow); if(follow&&pos&&map) map.setView([pos.lat,pos.lng],17); };
$("#bFit").onclick=()=>{ if(!map) return; follow=false; $("#bFollow").classList.remove("on"); const pts=[[STOPS[idx].lat,STOPS[idx].lng]]; if(pos) pts.push([pos.lat,pos.lng]); if(route&&route.line) route.line.forEach(p=>pts.push([p.lat,p.lng])); map.fitBounds(pts,{padding:[60,60],maxZoom:18}); };

/* ======================= RUTA A PIE (OSRM) ======================= */
let route=null, routing=false, lastRouteAt=0, offCount=0, leg=null;
const MOD={"left":"a la izquierda","right":"a la derecha","slight left":"levemente a la izquierda","slight right":"levemente a la derecha","sharp left":"bien a la izquierda","sharp right":"bien a la derecha","straight":"recto","uturn":"media vuelta"};
const ICON={"left":"↰","right":"↱","slight left":"↖","slight right":"↗","sharp left":"↰","sharp right":"↱","straight":"↑","uturn":"↶"};
function stepText(st){
  const n = st.name ? ` por ${st.name}` : "";
  const t=st.type, m=st.modifier;
  if(t==="arrive") return {tx:`Llegan a ${STOPS[idx].name}`, ic:"📍"};
  if(t==="depart") return {tx:`Salgan${n||" hacia la parada"}`, ic:"↑"};
  if(t==="roundabout"||t==="rotary") return {tx:`En la rotonda, tomen la salida${n}`, ic:"⟳"};
  if(!m||m==="straight"||t==="new name"||t==="continue"&&m==="straight") return {tx:`Sigan recto${n}`, ic:"↑"};
  if(m==="uturn") return {tx:`Den media vuelta${n}`, ic:"↶"};
  return {tx:`Giren ${MOD[m]||m}${n}`, ic:ICON[m]||"↑"};
}
async function fetchRoute(from,to){
  const url=`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),9000);
  try{ const r=await fetch(url,{signal:ctl.signal}); clearTimeout(tm); if(!r.ok) throw 0; const j=await r.json(); const rt=j.routes&&j.routes[0]; if(!rt) throw 0;
    const line=rt.geometry.coordinates.map(c=>({lat:c[1],lng:c[0]}));
    const steps=[]; rt.legs[0].steps.forEach(s=>steps.push({type:s.maneuver.type,modifier:s.maneuver.modifier,name:s.name,loc:{lat:s.maneuver.location[1],lng:s.maneuver.location[0]},done:false}));
    return {line,steps,distance:rt.distance};
  }catch(e){ clearTimeout(tm); return null; }
}
async function computeRoute(reason){
  const to=STOPS[idx]; const from = pos || (idx>0?STOPS[idx-1]:null); if(!from||routing) return;
  routing=true; lastRouteAt=Date.now(); $("#turnTx").textContent = reason==="re"?"Recalculando…":"Calculando ruta…";
  const r=await fetchRoute(from,to); routing=false;
  if(r){ route=r; route.steps[0].done=true; } else { route={line:[from,{lat:to.lat,lng:to.lng}],steps:[],distance:dist(from,to),straight:true}; }
  if(leg && !leg.total) leg.total=route.distance;
  if(map){ if(routeLine) map.removeLayer(routeLine); routeLine=L.polyline(route.line.map(p=>[p.lat,p.lng]),{color:"#e3b25a",weight:6,opacity:.95,dashArray:route.straight?"2 10":null,lineCap:"round"}).addTo(map); }
  if(reason!=="re" && map && !pos){ map.fitBounds(route.line.map(p=>[p.lat,p.lng]),{padding:[60,60]}); }
  if(reason==="re") feedAdd("🔁","Ruta recalculada desde donde están.");
  updateNav();
}
function maybeReroute(){
  if(!route||!pos||routing||stationary||pos.acc>40||route.straight&&!pos) return;
  const off=distToLine(pos,route.line);
  offCount = off>45 ? offCount+1 : 0;
  if(offCount>=3 && Date.now()-lastRouteAt>30000){ offCount=0; computeRoute("re"); }
}
function updateNav(){
  const s=STOPS[idx];
  if(!pos){ $("#wDist").textContent="—"; $("#wEta").textContent=""; }
  else { const d=dist(pos,s); $("#wDist").textContent = d<1000?Math.round(d)+" m":(d/1000).toFixed(1)+" km"; $("#wEta").textContent=`~${Math.max(1,Math.round(d/70))} min`; }
  if(!route){ return; }
  if(route.straight){ $("#turnIc").textContent="➚"; $("#turnTx").textContent=`Hacia ${s.name}`; $("#turnSub").textContent=pos?`${relDir(bearing(pos,s))} · sin ruta detallada, sigan la línea`:"Sin ruta detallada"; return; }
  const nx=route.steps.find(x=>!x.done);
  if(!nx){ $("#turnIc").textContent="📍"; $("#turnTx").textContent=`Llegando a ${s.name}`; $("#turnSub").textContent=""; return; }
  const st=stepText(nx); $("#turnIc").textContent=st.ic; $("#turnTx").textContent=st.tx;
  $("#turnSub").textContent = pos ? `en ${Math.round(dist(pos,nx.loc)/5)*5} m` : "";
}
const lc=s=>s.charAt(0).toLowerCase()+s.slice(1);
let walkedSinceInstr=0;
function isTurn(st){ return st.type!=="arrive" && st.type!=="depart" && st.modifier && st.modifier!=="straight" && st.type!=="new name"; }
function checkSteps(){
  if(!route||!pos||route.straight) return;
  const i0=route.steps.findIndex(x=>!x.done); if(i0<0) return;
  for(let i=i0;i<route.steps.length;i++){
    const st=route.steps[i], d=dist(pos,st.loc);
    if(d<26){
      for(let j=i0;j<=i;j++) route.steps[j].done=true;
      if(isTurn(st) && autoVoice && !stationary){ sayUrgent(`Acá, ${lc(stepText(st).tx)}.`); walkedSinceInstr=0; }
      updateNav(); return;
    }
  }
  const st=route.steps[i0], d=dist(pos,st.loc);
  if(isTurn(st) && !st.pre && d<75 && d>35 && autoVoice && !stationary){ st.pre=true; sayUrgent(`En unos ${Math.round(d/10)*10} metros, ${lc(stepText(st).tx)}.`); walkedSinceInstr=0; }
}
const OKS=["Van bien, sigan por esta calle.","Perfecto, sigan así.","Bien encaminados. Sigan derecho.","Todo en orden, sigan por aquí."];
function reassure(){
  if(!route||route.straight||!pos||stationary||speaking||paused||!autoVoice) return;
  if(walkedSinceInstr<170) return;
  if(distToLine(pos,route.line)>25) return;
  const nx=route.steps.find(x=>!x.done); let extra="";
  if(nx && isTurn(nx)){ const d=Math.round(dist(pos,nx.loc)/10)*10; if(d>80) extra=` En unos ${d} metros tendrán que ${lc(stepText(nx).tx).replace("giren","girar")}.`; }
  const st=curStreet?` por ${curStreet}`:"";
  say(OKS[Math.floor(Math.random()*OKS.length)].replace("por esta calle",st||"por esta calle")+extra,"Indicación");
  walkedSinceInstr=0;
}
function checkPois(){
  if(!pos||pos.acc>50||stationary||!autoVoice) return;
  for(const p of POIS){
    if(told["poi_"+p.id]) continue;
    const d=dist(pos,p); if(d>p.r) continue;
    markTold("poi_"+p.id); if(poiMarkers[p.id]) poiMarkers[p.id].setIcon(poiIcon(p));
    const rd=d<12?"aquí mismo":relDir(bearing(pos,p));
    sayUrgent(`Miren, ${rd}: ${p.t}`); feedAdd("★",`<b>${p.n}</b>`); updStoryCount(); walkedSinceSpeech=0; return;
  }
}

/* ======================= CALLE ACTUAL (Nominatim) ======================= */
let lastGeoQ=null, lastGeoT=0, curStreet="", streetQ=false;
async function lookupStreet(){
  if(!pos||streetQ||pos.acc>60) return;
  if(lastGeoQ && dist(lastGeoQ,pos)<25 && Date.now()-lastGeoT<60000) return;
  if(Date.now()-lastGeoT<6000) return;
  streetQ=true; lastGeoQ={...pos}; lastGeoT=Date.now();
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat}&lon=${pos.lng}&zoom=18&addressdetails=1&accept-language=es`);
    const j=await r.json(); const a=j.address||{};
    const name=a.road||a.pedestrian||a.footway||a.square||a.path||a.place||a.neighbourhood||"";
    if(name && name!==curStreet){ curStreet=name; $("#streetName").textContent=name; onStreet(name); }
  }catch(e){ /* sin red: usar nombre de la ruta */ fallbackStreet(); }
  streetQ=false;
}
function fallbackStreet(){
  if(!route||route.straight) return; const done=route.steps.filter(x=>x.done); const last=done[done.length-1];
  if(last&&last.name&&last.name!==curStreet){ curStreet=last.name; $("#streetName").textContent=last.name; onStreet(last.name); }
}
function onStreet(name){
  const n=strip(name);
  const st=STREETS.find(s=>s.k.some(k=>n.includes(strip(k))));
  if(st && !told["st_"+st.id]){
    if(stationary||mode!=="walk"||!autoVoice) return;
    if(sayIfFree(st.t,"📍 "+name)){ markTold("st_"+st.id); feedAdd("🏛️",`<b>${name}</b>: historia de la calle`); updStoryCount(); walkedSinceSpeech=0; }
    else pendingStreet=st;   // se cuenta apenas termine lo que suena
  }
}
let pendingStreet=null;

/* ======================= HISTORIA DEL TRAMO (por avance) ======================= */
function startLeg(){
  const s=STOPS[idx];
  const parts=(s.legNarr||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  leg={id:s.id,parts,next:0,total:null,startedAt:Date.now()};
  route=null; offCount=0; announcedNear=false;
  computeRoute("new");
  refreshMarkers();
}
let announcedNear=false;
function legProgress(){ if(!leg||!pos) return 0; const tot=leg.total||dist(STOPS[idx-1]||pos,STOPS[idx]); const rem=dist(pos,STOPS[idx]); return Math.max(0,Math.min(1,1-rem/Math.max(tot,1))); }
function legSay(manual){
  const s=STOPS[idx]; if(!leg) startLeg();
  if(manual){ say(`${s.legDir.replace(/<[^>]+>/g,"")} ${s.legNarr}`,"Camino a "+s.name); if(leg) leg.next=leg.parts.length; return; }
  // al iniciar el tramo: indicación + primera parte
  const first = leg.parts[0]||"";
  say(`Próxima parada: ${s.name}. ${s.legDir.replace(/<[^>]+>/g,"")} ${first}`, "Camino a "+s.name);
  leg.next=1; markTold("leg_"+s.id+"_0");
}
function autoStories(){
  if(mode!=="walk"||!autoVoice||stationary||speaking||paused) return;
  if(pendingStreet && !told["st_"+pendingStreet.id]){ const st=pendingStreet; pendingStreet=null; if(sayIfFree(st.t,"📍 "+curStreet)){ markTold("st_"+st.id); feedAdd("🏛️",`<b>${curStreet}</b>: historia de la calle`); updStoryCount(); walkedSinceSpeech=0; return; } }
  // siguientes partes de la historia del tramo según avance
  if(leg && leg.next<leg.parts.length){
    const need = leg.parts.length>1 ? 0.15 + 0.65*(leg.next/(leg.parts.length)) : 0;
    if(legProgress()>=need || Date.now()-lastSpeechEnd>40000){
      const k="leg_"+leg.id+"_"+leg.next;
      if(!told[k]){ say(leg.parts[leg.next],"Camino a "+STOPS[idx].name); markTold(k); updStoryCount(); }
      leg.next++; walkedSinceSpeech=0; return;
    }
  }
  // dato al paso si llevan un rato caminando en silencio
  if(walkedSinceSpeech>220 && Date.now()-lastSpeechEnd>60000){
    const f=FILL.find(x=>!told["f_"+x.id]);
    if(f){ say(f.t,"Dato al paso"); markTold("f_"+f.id); feedAdd("💬","Dato al paso"); updStoryCount(); walkedSinceSpeech=0; }
  }
}
function updStoryCount(){ $("#storyState").textContent="Historias: "+Object.keys(told).filter(k=>k!=="day").length; }

/* ======================= CAPÍTULOS Y TRIVIA ======================= */
let chainOn=false;
let quizState=store.get("toledo_quiz")||{score:0,ans:{}};
function renderChapters(){
  const s=STOPS[idx], ch=CHAPTERS[s.id]||[];
  $("#chapBox").classList.toggle("hidden",!ch.length);
  $("#chapList").innerHTML=ch.map((c,i)=>`<button class="chap ${told["ch_"+s.id+"_"+i]?"done":""}" data-i="${i}"><span class="pl">${told["ch_"+s.id+"_"+i]?"✓":"▶"}</span><span><b>${c.t}</b><span class="s">~${Math.max(1,Math.round(c.x.split(/\s+/).length/150))} min · capítulo ${i+1}</span></span></button>`).join("");
  document.querySelectorAll("#chapList .chap").forEach(b=>b.onclick=()=>playChapter(+b.dataset.i));
}
function playChapter(i){ const s=STOPS[idx], c=CHAPTERS[s.id][i]; chainOn=true; markTold("ch_"+s.id+"_"+i); say(`${c.t}. ${c.x}`,"📚 "+c.t); renderChapters(); updStoryCount(); }
function renderQuiz(){
  const s=STOPS[idx], q=QUIZ[s.id]; $("#quizBox").classList.toggle("hidden",!q); if(!q) return;
  $("#quizPts").textContent=`${quizState.score} punto${quizState.score===1?"":"s"}`;
  $("#quizQ").textContent=q.q; const an=quizState.ans[s.id];
  $("#quizO").innerHTML=q.o.map((o,i)=>`<button class="qo ${an!=null?(i===q.a?"ok":(i===an?"no":"")):""}" data-i="${i}">${["A","B","C"][i]}. ${o}</button>`).join("");
  $("#quizR").classList.toggle("hidden",an==null); if(an!=null) $("#quizR").textContent= an===q.a?"¡Correcto! +1 punto.":`Era: ${q.o[q.a]}.`;
  document.querySelectorAll("#quizO .qo").forEach(b=>b.onclick=()=>{ if(quizState.ans[s.id]!=null) return; const i=+b.dataset.i; quizState.ans[s.id]=i; if(i===q.a) quizState.score++; store.set("toledo_quiz",quizState); renderQuiz(); $("#score").textContent="⭐ "+quizState.score; say(i===q.a?"¡Correcto! Un punto para ustedes.":`Casi. La respuesta era: ${q.o[q.a]}.`,"Trivia"); });
  $("#score").textContent="⭐ "+quizState.score;
}
function onSpeechEnd(){
  if(speaking||paused||!chainOn||!autoVoice||mode!=="stop"||view!=="guide") return;
  const s=STOPS[idx], ch=CHAPTERS[s.id]||[];
  const i=ch.findIndex((c,k)=>!told["ch_"+s.id+"_"+k]);
  if(i>=0){ const c=ch[i]; markTold("ch_"+s.id+"_"+i); say(`Les cuento algo más. ${c.t}. ${c.x}`,"📚 "+c.t); renderChapters(); updStoryCount(); return; }
  chainOn=false;
  const q=QUIZ[s.id];
  if(q && quizState.ans[s.id]==null){ say(`Y ahora, la trivia de esta parada. ${q.q} ¿${q.o.join(", ").replace(/, ([^,]*)$/," o $1")}? Respondan en la pantalla.`,"🧠 Trivia"); }
  else say("Cuando quieran, toquen Siguiente parada y seguimos caminando.","Guía");
}

/* ======================= FEED ======================= */
function feedAdd(ic,html){ const f=$("#feed"); const d=document.createElement("div"); d.className="fi"; d.innerHTML=`<span class="ic">${ic}</span><span>${html} <span style="opacity:.6">· ${hhmm(new Date())}</span></span>`; f.prepend(d); while(f.children.length>5) f.lastChild.remove(); }

/* ======================= GPS + BRÚJULA ======================= */
function startGeo(){
  if(!("geolocation" in navigator)){ geoFail("Sin GPS en este navegador"); return; }
  try{ navigator.geolocation.watchPosition(p=>{
      const np={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy};
      const first=!pos; pos=np;
      if(!compassOn && p.coords.heading!=null && !isNaN(p.coords.heading) && p.coords.speed>0.6) heading=p.coords.heading;
      setGps(); updateMotion(pos); drawMe();
      if(first){ if(map) map.setView([pos.lat,pos.lng],17); if(mode==="walk") computeRoute("new"); }
      tick();
    }, e=>geoFail(e.code===1?"Ubicación denegada":"Sin señal GPS"), {enableHighAccuracy:true,maximumAge:3000,timeout:20000});
  }catch(e){ geoFail("GPS bloqueado aquí"); }
}
function geoFail(msg){ const g=$("#gps"); g.textContent="Manual"; g.className="pill warn"; $("#manualNote").innerHTML=`📍 ${msg}. Usen <b>Google Maps</b> y toquen <b>Llegamos</b> al llegar.`; $("#streetName").textContent="Sin GPS"; }
function setGps(){ if($("#streetName").textContent==="Sin GPS") $("#streetName").textContent=curStreet||"Buscando calle…"; const g=$("#gps"); g.textContent="GPS ±"+Math.round(pos.acc)+"m"; g.className="pill "+(pos.acc<40?"ok":"warn"); $("#manualNote").textContent=pos.acc>60?"El GPS pierde precisión entre estas calles. Si ya están ahí, toquen Llegamos.":""; }
function onOrient(e){ let h=null; if(typeof e.webkitCompassHeading==="number") h=e.webkitCompassHeading; else if(e.absolute&&e.alpha!=null) h=(360-e.alpha)%360; if(h!=null){ heading=h; compassOn=true; const c=document.getElementById("cone"); if(c){ c.style.display="block"; c.style.transform=`rotate(${h}deg)`; } } }
async function startCompass(){ try{ if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==="function"){ const r=await DeviceOrientationEvent.requestPermission(); if(r!=="granted") return; } window.addEventListener("deviceorientationabsolute",onOrient,true); window.addEventListener("deviceorientation",onOrient,true); }catch(e){} }
async function keepAwake(){ try{ if("wakeLock" in navigator) await navigator.wakeLock.request("screen"); }catch(e){} }
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") keepAwake(); });

/* ======================= UI ======================= */
function hhmm(d){return d.toTimeString().slice(0,5);}
function minsUntil(t){const [h,m]=t.split(":").map(Number);const c=new Date();c.setHours(h,m,0,0);return Math.round((c-new Date())/60000);}
function hoursBadge(s){ if(!s.closes) return `<span class="pill">Exterior · libre</span>`; if(s.closes==="closed") return `<span class="pill bad">Hoy cerrado · por fuera</span>`; const lim=s.lastEntry||s.closes,m=minsUntil(lim); if(m<0) return `<span class="pill bad">Ya cerró · por fuera</span>`; if(m<40) return `<span class="pill warn">⚠️ ${s.lastEntry?"Acceso":"Cierra"} ${lim} · ${m} min</span>`; return `<span class="pill ok">Abierto hasta ${s.closes}</span>`; }
const mapsUrl=s=>`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=walking`;
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("on");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("on"),3000);}
function save(){store.set("toledo_state",{idx,mode,visited,day:today});}
function setBg(el,url){ el.style.backgroundImage=`url("${url}")`; }

function render(){
  const s=STOPS[idx];
  $("#walk").classList.toggle("hidden",view!=="guide"||mode!=="walk");
  $("#stop").classList.toggle("hidden",view!=="guide"||mode!=="stop");
  $("#list").classList.toggle("hidden",view!=="list");
  $("#prog").innerHTML=STOPS.map((x,i)=>`<i class="${visited[x.id]?"d":""} ${i===idx?"c":""}"></i>`).join("");
  if(mode==="walk"){
    setBg($("#wThumb"),IMG[s.id]);
    $("#wKick").textContent=`Próxima · ${idx+1} de ${STOPS.length}`;
    $("#wName").textContent=s.name;
    $("#wBadges").innerHTML=hoursBadge(s)+`<span class="pill">~${s.visit} min de visita</span>`;
    $("#wDir").innerHTML=s.legDir?s.legDir:"Diríjanse al punto de partida siguiendo la línea dorada del mapa.";
    $("#bMaps").href=mapsUrl(s);
    if(map){ setTimeout(()=>map.invalidateSize(),60); }
  } else {
    setBg($("#sBg"),IMG[s.id]);
    $("#sKick").textContent=`Parada ${idx+1} de ${STOPS.length} · ${SHORT[s.id]||""}`;
    $("#sName").textContent=s.name; $("#sBadges").innerHTML=hoursBadge(s);
    $("#sNarr").textContent=s.narr; $("#sNarr").classList.add("clamp"); $("#bMore").textContent="Leer todo ▾";
    $("#plSub").textContent=`Narración · ~${Math.max(1,Math.round(s.narr.split(/\s+/).length/150))} min`;
    $("#sRetoTxt").textContent=s.reto; $("#sAns").textContent=s.ans; $("#sAns").classList.add("hidden"); $("#bAns").classList.remove("hidden");
    $("#sTipTxt").textContent=s.tip;
    renderChapters(); renderQuiz();
    $("#bNext").textContent=idx<STOPS.length-1?`Siguiente: ${STOPS[idx+1].name} →`:"🏁 Terminar el recorrido";
  }
  renderList(); refreshMarkers(); updatePlayer(); updateNav(); save();
}
function renderList(){
  $("#list").innerHTML=STOPS.map((s,i)=>`<button class="it ${visited[s.id]?"done":""} ${i===idx?"cur":""}" data-i="${i}" style="width:100%;text-align:left">
    <div class="th" style="background-image:url('${IMG[s.id]}')"><span class="n">${visited[s.id]?"✓":i+1}</span></div>
    <div class="nm"><b>${s.name}</b><span>${s.closes==="closed"?"Hoy cerrado · exterior":s.closes?"Cierra "+s.closes:"Exterior"} · ~${s.visit} min</span></div><span style="color:var(--mute)">›</span></button>`).join("");
  document.querySelectorAll("#list .it").forEach(el=>el.onclick=()=>{ idx=+el.dataset.i; mode="walk"; view="guide"; startLeg(); render(); window.scrollTo({top:0}); });
}
function tick(){
  $("#clock").textContent=hhmm(new Date());
  if(!pos) return;
  updateNav();
  if(mode!=="walk") return;
  const s=STOPS[idx], d=dist(pos,s);
  // llegada (una sola vez por parada)
  if(d < s.r + Math.min(25,(pos.acc||0)/2) && !visited[s.id]){ arrive(true); return; }
  if(d<90 && !announcedNear && !told["near_"+s.id] && autoVoice && !stationary){ announcedNear=true; markTold("near_"+s.id); sayUrgent(`Ya casi llegan a ${s.name}. Unos ${Math.round(d/10)*10} metros.`); }
  checkSteps(); checkPois(); maybeReroute(); lookupStreet(); autoStories(); reassure();
}
setInterval(()=>{ $("#clock").textContent=hhmm(new Date()); if(!$("#app").classList.contains("hidden")){ if(pos&&mode==="walk"){ updateMotion(pos); autoStories(); } } },5000);

function arrive(auto){
  if(mode==="stop") return;
  mode="stop"; view="guide"; visited[STOPS[idx].id]=true; render();
  if(auto) toast("📍 ¡Llegaron a "+STOPS[idx].name+"!");
  try{ navigator.vibrate&&navigator.vibrate([120,60,120]); }catch(e){}
  if(!told["stop_"+STOPS[idx].id] || !auto){ markTold("stop_"+STOPS[idx].id); if(autoVoice||!auto){ chainOn=true; say(STOPS[idx].narr,STOPS[idx].name); } }
  window.scrollTo({top:0,behavior:"smooth"});
}
function goNext(){
  if(idx>=STOPS.length-1){ say("Fin del recorrido. Gracias por caminar Toledo. Que disfruten el atardecer.","Fin"); toast("🏁 ¡Recorrido completo!"); return; }
  idx++; mode="walk"; startLeg(); render();
  if(autoVoice) legSay(false); else stopVoice();
  window.scrollTo({top:0,behavior:"smooth"});
}
$("#bArrive").onclick=()=>arrive(false);
$("#bSkip").onclick=()=>{ stopVoice(); visited[STOPS[idx].id]=visited[STOPS[idx].id]||false; goNext(); };
$("#bNext").onclick=goNext;
$("#bLeg").onclick=()=>legSay(true);
$("#bPlay").onclick=()=>{ if(speaking) togglePause(); else { chainOn=true; say(STOPS[idx].narr,STOPS[idx].name); } };
$("#bMore").onclick=()=>{ const n=$("#sNarr"); n.classList.toggle("clamp"); $("#bMore").textContent=n.classList.contains("clamp")?"Leer todo ▾":"Mostrar menos ▴"; };
$("#bAns").onclick=()=>{ $("#sAns").classList.remove("hidden"); $("#bAns").classList.add("hidden"); };
$("#bList").onclick=()=>{ view=view==="list"?"guide":"list"; render(); window.scrollTo({top:0}); };
$("#home").onclick=()=>{ view="guide"; render(); };

/* ajustes */
function openSheet(on){ $("#sheet").classList.toggle("on",on); $("#sheetBg").classList.toggle("on",on); if(on){ loadVoices(); syncSet(); } }
function syncSet(){ document.querySelectorAll("#rateSeg button").forEach(b=>b.classList.toggle("on",+b.dataset.r===rate)); $("#autoSw").classList.toggle("on",autoVoice); }
$("#bSet").onclick=()=>openSheet(true);
$("#sheetBg").onclick=()=>openSheet(false);
document.querySelectorAll("#rateSeg button").forEach(b=>b.onclick=()=>{ rate=+b.dataset.r; prefs.rate=rate; store.set("toledo_prefs",prefs); syncSet(); });
$("#autoSw").onclick=()=>{ autoVoice=!autoVoice; prefs.auto=autoVoice; store.set("toledo_prefs",prefs); syncSet(); };
$("#bTest").onclick=()=>say("Bienvenidos a Toledo, la ciudad de las tres culturas. Así va a sonar su guía durante el paseo.","Prueba de voz");

/* inicio */
$("#startAt").innerHTML=STOPS.map((s,i)=>`<option value="${i}">${i+1}. ${s.name}</option>`).join("");
const prev=store.get("toledo_state");
if(prev&&prev.day===today&&prev.idx>0){ const ni = prev.mode==="stop" && prev.idx<STOPS.length-1 ? prev.idx+1 : prev.idx; $("#startAt").value=ni; visited=prev.visited||{}; $("#resumeNote").textContent=`↺ Retoman en: ${STOPS[ni].name}`; }
$("#go").onclick=()=>{
  idx=+$("#startAt").value; mode="walk"; view="guide";
  $("#landing").classList.add("hidden"); $("#app").classList.remove("hidden"); $("#player").classList.remove("hidden");
  window.scrollTo({top:0});
  initMap(); startLeg();
  const s=STOPS[idx];
  if(!told["intro"]){ markTold("intro"); say(`${INTRO} Primera parada: ${s.name}. ${s.legDir.replace(/<[^>]+>/g,"")} ${(leg.parts[0]||"")}`,"Bienvenida"); leg.next=Math.min(1,leg.parts.length); }
  else legSay(false);
  startCompass(); keepAwake(); startGeo(); render(); updStoryCount(); $("#score").textContent="⭐ "+quizState.score;
};
