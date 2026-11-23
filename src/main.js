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
/* ---- voz premium (OpenAI / ElevenLabs) ---- */
const AUD=new Audio(); AUD.setAttribute("playsinline",""); AUD.preload="auto";
function silentWav(){ const n=800,b=new ArrayBuffer(44+n),v=new DataView(b); const w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0))); w(0,"RIFF");v.setUint32(4,36+n,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,"data");v.setUint32(40,n,true);for(let i=0;i<n;i++)v.setUint8(44+i,128);return URL.createObjectURL(new Blob([b],{type:"audio/wav"})); }
function unlockAudio(){ try{ AUD.src=silentWav(); AUD.play().catch(()=>{}); }catch(e){} }
const premiumOn=()=> (prefs.prov==="openai"||prefs.prov==="eleven") && !!prefs.key && !premiumBroken;
let premiumBroken=false;
const audioCache=new Map();
const OAI_INSTR="Sos un guía turístico cálido y apasionado que cuenta la historia de Toledo a dos amigos mientras caminan. Hablá en español latinoamericano neutro, con naturalidad, pausas expresivas y entusiasmo contenido, como un buen narrador de podcast. Nada de tono robótico.";
function ttsFetch(text){
  const k=(prefs.prov||"")+"|"+(prefs.prov==="openai"?(prefs.ovoice||"coral"):(prefs.evoice||""))+"|"+text;
  if(audioCache.has(k)) return audioCache.get(k);
  const p=(async()=>{
    let r;
    if(prefs.prov==="openai"){
      r=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{"Authorization":"Bearer "+prefs.key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini-tts",voice:prefs.ovoice||"coral",input:text,instructions:OAI_INSTR,response_format:"mp3"})});
    } else {
      const vid=(prefs.evoice||"EXAVITQu4vr4xnSDxMaL").trim();
      r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vid)}?output_format=mp3_44100_64`,{method:"POST",headers:{"xi-api-key":prefs.key,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2",voice_settings:{stability:0.45,similarity_boost:0.8,style:0.3,use_speaker_boost:true}})});
    }
    if(!r.ok){ const e=new Error("HTTP "+r.status); e.status=r.status; try{ e.body=(await r.text()).slice(0,160);}catch(_){} throw e; }
    return URL.createObjectURL(await r.blob());
  })();
  audioCache.set(k,p); p.catch(()=>audioCache.delete(k));
  return p;
}
function premiumFail(e){
  if(e&&(e.status===401||e.status===403||e.status===402||e.status===429)){ premiumBroken=true; toast(`Voz premium: ${e.status===401?"clave inválida":e.status===429?"sin crédito o límite alcanzado":"acceso rechazado"}. Uso la voz del teléfono.`); }
  else toast("La voz premium no respondió; sigo con la del teléfono.");
}
function chunk(text){ const clean=text.replace(/<[^>]+>/g,""); const parts=clean.replace(/([\.\?\!:])\s+/g,"$1|").split(/\||\n+/).map(s=>s.trim()).filter(Boolean); const out=[];let buf=""; for(const p of parts){ if((buf+" "+p).length>(premiumOn()?650:200)&&buf){out.push(buf);buf=p}else{buf=buf?buf+" "+p:p} } if(buf) out.push(buf); return out; }
function hardCancel(){ gen++; if(synth) synth.cancel(); try{ AUD.pause(); }catch(e){} }
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
  const my=gen;
  if(premiumOn()){
    const txt=cur;
    ttsFetch(txt).then(url=>{ if(my!==gen) return; AUD.src=url; AUD.playbackRate=rate; AUD.onended=()=>{ if(my===gen&&!paused) next(); }; AUD.onerror=()=>{ if(my===gen) deviceSpeak(txt,my); }; AUD.play().catch(()=>{ if(my===gen) deviceSpeak(txt,my); }); })
      .catch(e=>{ if(my!==gen) return; premiumFail(e); deviceSpeak(txt,my); });
    if(queue[0]) ttsFetch(queue[0]).catch(()=>{});
    updatePlayer(); return;
  }
  deviceSpeak(cur,my);
}
function deviceSpeak(text,my){
  if(!synth){ speaking=false; updatePlayer(); return; }
  const u=new SpeechSynthesisUtterance(text);
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

/* ======================= MAPA (MapLibre · navegación tipo GPS) ======================= */
const STYLE_DET="https://tiles.openfreemap.org/styles/liberty";
const STYLE_SAT={version:8,glyphs:"https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",sources:{sat:{type:"raster",tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,maxzoom:19,attribution:"Esri · Maxar"}},layers:[{id:"sat",type:"raster",source:"sat"}]};
let map=null, curLayer="det", meMarker=null, meEl=null, stopMarkers=[], poiMarkers={}, follow=true, headUp=true, mapFull=false, lastCam=0;
function mkEl(i){ const s=STOPS[i]; const d=document.createElement("div"); d.className="mk "+(i===idx?"c":(visited[s.id]?"d":"")); d.textContent = visited[s.id]&&i!==idx?"✓":(i+1); d.onclick=(e)=>{ e.stopPropagation(); if(i!==idx){ idx=i; mode="walk"; startLeg(); render(); toast("Próxima: "+s.name); } }; return d; }
function poiEl(p){ const d=document.createElement("div"); d.className="poi "+(told["poi_"+p.id]?"d":""); d.textContent="★"; return d; }
function initMap(){
  if(map) return;
  if(typeof maplibregl==="undefined"){ $("#map").innerHTML='<div style="padding:30px;color:#bfae98;text-align:center">No se pudo cargar el mapa. Usen Google Maps.</div>'; return; }
  map=new maplibregl.Map({container:"map",style:STYLE_DET,center:[STOPS[idx].lng,STOPS[idx].lat],zoom:16,pitch:0,attributionControl:{compact:true},maxPitch:70});
  map.on("style.load",addRouteLayers);
  map.on("dragstart",()=>{ follow=false; $("#bFollow").classList.remove("on"); });
  map.on("rotatestart",e=>{ if(e.originalEvent){ follow=false; $("#bFollow").classList.remove("on"); } });
  STOPS.forEach((s,i)=>{ const m=new maplibregl.Marker({element:mkEl(i)}).setLngLat([s.lng,s.lat]).addTo(map); stopMarkers.push(m); });
  POIS.forEach(p=>{ const el=poiEl(p); const pop=new maplibregl.Popup({offset:14,closeButton:false}).setHTML(`<b>${p.n}</b><br>${p.t.charAt(0).toUpperCase()+p.t.slice(1)}<br><button data-poi="${p.id}">🎧 Escuchar</button>`);
    pop.on("open",()=>{ const b=pop.getElement().querySelector("button[data-poi]"); if(b) b.onclick=()=>say(p.n+". "+p.t.charAt(0).toUpperCase()+p.t.slice(1),p.n); });
    poiMarkers[p.id]=new maplibregl.Marker({element:el}).setLngLat([p.lng,p.lat]).setPopup(pop).addTo(map); });
}
function addRouteLayers(){
  if(!map) return;
  if(curLayer==="det"){ try{ const lyr=map.getStyle().layers.find(l=>l.type==="fill-extrusion"); if(lyr) map.setPaintProperty(lyr.id,"fill-extrusion-opacity",0.75); }catch(e){} }
  if(!map.getSource("route")) map.addSource("route",{type:"geojson",data:routeGeo()});
  if(!map.getLayer("route-case")) map.addLayer({id:"route-case",type:"line",source:"route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#5a3c12","line-width":11,"line-opacity":.85}});
  if(!map.getLayer("route-line")) map.addLayer({id:"route-line",type:"line",source:"route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#f0b13d","line-width":7}});
}
function routeGeo(){ const coords = route&&route.line ? route.line.map(p=>[p.lng,p.lat]) : []; return {type:"Feature",geometry:{type:"LineString",coordinates:coords}}; }
function drawRoute(){ if(map&&map.getSource("route")) map.getSource("route").setData(routeGeo()); }
function refreshMarkers(){ stopMarkers.forEach((m,i)=>{ const s=STOPS[i]; const el=m.getElement(); el.className="mk "+(i===idx?"c":(visited[s.id]?"d":"")); el.textContent = visited[s.id]&&i!==idx?"✓":(i+1); }); }
function poiDone(id){ const m=poiMarkers[id]; if(m) m.getElement().classList.add("d"); }
let camHead=null;
function smoothCam(h){ if(h==null) return camHead; if(camHead==null) return camHead=h; const d=((h-camHead+540)%360)-180; camHead=(camHead+d*0.35+360)%360; return camHead; }
function drawMe(){
  if(!map||!pos) return;
  if(!meMarker){ meEl=document.createElement("div"); meEl.className="me2"; meEl.innerHTML='<div class="halo"></div><svg viewBox="0 0 40 40"><path d="M20 3 L33 35 L20 27 L7 35 Z" fill="#2f8cff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>'; meMarker=new maplibregl.Marker({element:meEl,rotationAlignment:"map",pitchAlignment:"map"}).setLngLat([pos.lng,pos.lat]).addTo(map); }
  meMarker.setLngLat([pos.lng,pos.lat]);
  const h=smoothCam(heading);
  meMarker.setRotation(h==null?0:h);
  camUpdate();
}
function camUpdate(force){
  if(!map||!pos||!follow) return;
  const now=Date.now(); if(!force && now-lastCam<450) return; lastCam=now;
  const H=map.getContainer().clientHeight;
  map.easeTo({center:[pos.lng,pos.lat], bearing: headUp&&camHead!=null?camHead:0, pitch: headUp?58:0, zoom: Math.max(map.getZoom(), headUp?17.6:17), padding:{top: headUp?Math.round(H*0.42):0, bottom: headUp?40:0, left:0, right:0}, duration: force?800:450, easing:t=>t});
}
function mapSetView(p,z){ if(map) map.jumpTo({center:[p.lng,p.lat],zoom:z||17}); }
function fitRoute(){ if(!map) return; const pts=[[STOPS[idx].lng,STOPS[idx].lat]]; if(pos) pts.push([pos.lng,pos.lat]); if(route&&route.line) route.line.forEach(p=>pts.push([p.lng,p.lat])); const b=pts.reduce((bb,c)=>bb.extend(c),new maplibregl.LngLatBounds(pts[0],pts[0])); map.fitBounds(b,{padding:70,bearing:0,pitch:0,maxZoom:18,duration:700}); }
$("#bLayer").onclick=()=>{ if(!map) return; curLayer=curLayer==="det"?"sat":"det"; map.setStyle(curLayer==="det"?STYLE_DET:STYLE_SAT); $("#bLayer").textContent=curLayer==="det"?"🛰️":"🗺️"; toast(curLayer==="det"?"Mapa 3D":"Vista satélite"); };
$("#bFollow").onclick=()=>{ follow=true; $("#bFollow").classList.add("on"); camUpdate(true); };
$("#bFit").onclick=()=>{ follow=false; $("#bFollow").classList.remove("on"); fitRoute(); };
$("#bHead").onclick=()=>{ headUp=!headUp; $("#bHead").textContent=headUp?"🧭":"N"; $("#bHead").classList.toggle("on",headUp); follow=true; $("#bFollow").classList.add("on"); toast(headUp?"El mapa gira según hacia dónde miran":"Norte arriba"); camUpdate(true); };
function setFull(on){ mapFull=on; document.body.classList.toggle("mapfull",on); $("#bFull").textContent=on?"✕":"⛶"; setTimeout(()=>{ if(map){ map.resize(); camUpdate(true); } },80); }
$("#bFull").onclick=()=>setFull(!mapFull);

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
  drawRoute();
  if(reason!=="re" && map && !pos){ fitRoute(); }
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
    markTold("poi_"+p.id); poiDone(p.id);
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
function guideStory(){
  const ref = pos || STOPS[idx];
  let best=null, bs=Infinity;
  for(const g of GUIDE){ if(told["g_"+g.id]) continue; const sc = g.lat!=null ? dist(ref,g) : 650; if(g.lat!=null && sc>700) continue; if(sc<bs){ bs=sc; best=g; } }
  if(!best) return false;
  markTold("g_"+best.id); say(`Les cuento una historia: ${best.t}. ${best.x}`,"📖 "+best.t); feedAdd("📖",`<b>${best.t}</b>`); updStoryCount(); walkedSinceSpeech=0; return true;
}
function autoStories(){
  if(!autoVoice||stationary||speaking||paused||waitingStart||view!=="guide") return;
  const silence=Date.now()-lastSpeechEnd;
  if(mode==="stop"){ if(chainOn||silence<20000) return; guideStory(); return; }
  if(silence<4500) return;
  if(pendingStreet && !told["st_"+pendingStreet.id]){ const st=pendingStreet; pendingStreet=null; markTold("st_"+st.id); say(st.t,"📍 "+(curStreet||"Calle")); feedAdd("🏛️",`<b>${curStreet}</b>: historia de la calle`); updStoryCount(); walkedSinceSpeech=0; return; }
  if(leg && leg.next<leg.parts.length){
    const k="leg_"+leg.id+"_"+leg.next; const part=leg.parts[leg.next]; leg.next++;
    if(!told[k]){ markTold(k); say(part,"Camino a "+STOPS[idx].name); updStoryCount(); walkedSinceSpeech=0; return; }
  }
  if(guideStory()) return;
  const f=FILL.find(x=>!told["f_"+x.id]);
  if(f){ markTold("f_"+f.id); say(f.t,"Dato al paso"); feedAdd("💬","Dato al paso"); updStoryCount(); walkedSinceSpeech=0; }
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
function startGeo(onFirst){
  if(!("geolocation" in navigator)){ geoFail("Sin GPS en este navegador"); return; }
  try{ navigator.geolocation.watchPosition(p=>{
      const np={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy};
      const first=!pos; pos=np;
      if(!compassOn && p.coords.heading!=null && !isNaN(p.coords.heading) && p.coords.speed>0.6) heading=p.coords.heading;
      setGps(); updateMotion(pos); drawMe();
      if(first){ if(onFirst) onFirst(pos); mapSetView(pos,17); if(mode==="walk"&&!waitingStart) computeRoute("new"); }
      if(!waitingStart) tick();
    }, e=>geoFail(e.code===1?"Ubicación denegada":"Sin señal GPS"), {enableHighAccuracy:true,maximumAge:3000,timeout:20000});
  }catch(e){ geoFail("GPS bloqueado aquí"); }
}
function geoFail(msg){ const g=$("#gps"); g.textContent="Manual"; g.className="pill warn"; $("#manualNote").innerHTML=`📍 ${msg}. Usen <b>Google Maps</b> y toquen <b>Llegamos</b> al llegar.`; $("#streetName").textContent="Sin GPS"; }
function setGps(){ if($("#streetName").textContent==="Sin GPS") $("#streetName").textContent=curStreet||"Buscando calle…"; const g=$("#gps"); g.textContent="GPS ±"+Math.round(pos.acc)+"m"; g.className="pill "+(pos.acc<40?"ok":"warn"); $("#manualNote").textContent=pos.acc>60?"El GPS pierde precisión entre estas calles. Si ya están ahí, toquen Llegamos.":""; }
function onOrient(e){ let h=null; if(typeof e.webkitCompassHeading==="number") h=e.webkitCompassHeading; else if(e.absolute&&e.alpha!=null) h=(360-e.alpha)%360; if(h!=null){ heading=h; compassOn=true; if(map&&pos) drawMe(); const c=document.getElementById("cone"); if(c){ c.style.display="block"; c.style.transform=`rotate(${h}deg)`; } } }
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
    if(map){ setTimeout(()=>map.resize(),60); }
  } else {
    setBg($("#sBg"),IMG[s.id]);
    $("#sKick").textContent=`Parada ${idx+1} de ${STOPS.length} · ${SHORT[s.id]||""}`;
    $("#sName").textContent=s.name; $("#sBadges").innerHTML=hoursBadge(s);
    $("#sNarr").textContent=s.narr; $("#sNarr").classList.add("clamp"); $("#bMore").textContent="Leer todo ▾";
    $("#plSub").textContent=`Narración · ~${Math.max(1,Math.round(s.narr.split(/\s+/).length/150))} min`;
    $("#sRetoTxt").textContent=s.reto; $("#sAns").textContent=s.ans; $("#sAns").classList.add("hidden"); $("#bAns").classList.remove("hidden");
    $("#sTipTxt").textContent=s.tip;
    renderChapters(); renderQuiz();
    { const nx=nextUnvisited(); $("#bNext").textContent=nx>=0?`Siguiente: ${STOPS[nx].name} →`:"🏁 Terminar el recorrido"; }
  }
  renderList(); refreshMarkers(); updatePlayer(); updateNav(); save();
}
function renderList(){
  $("#list").innerHTML=STOPS.map((s,i)=>`<button class="it ${visited[s.id]?"done":""} ${i===idx?"cur":""}" data-i="${i}" style="width:100%;text-align:left">
    <div class="th" style="background-image:url('${IMG[s.id]}')"><span class="n">${visited[s.id]?"✓":i+1}</span></div>
    <div class="nm"><b>${s.name}</b><span>${s.closes==="closed"?"Hoy cerrado · exterior":s.closes?"Cierra "+s.closes:"Exterior"} · ~${s.visit} min</span></div><span class="li-mark ${visited[s.id]?"on":""}" data-m="${i}" role="button" style="display:flex;align-items:center;justify-content:center">${visited[s.id]?"✓":"○"}</span></button>`).join("")+`<p class="note">Toquen ○ / ✓ para marcar lo que ya visitaron. Toquen la parada para ir hacia ella.</p>`;
  document.querySelectorAll("#list .li-mark").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const s=STOPS[+el.dataset.m]; visited[s.id]=!visited[s.id]; save(); renderList(); refreshMarkers(); $("#prog").innerHTML=STOPS.map((x,i)=>`<i class="${visited[x.id]?"d":""} ${i===idx?"c":""}"></i>`).join(""); });
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
  if(pos.acc<45 && !stationary){ const o=STOPS.findIndex((x,i)=>i!==idx && !visited[x.id] && dist(pos,x)<x.r); if(o>=0){ idx=o; startLeg(); toast("¡Pasaron por "+STOPS[o].name+"!"); arrive(true); return; } }
  if(d<90 && !announcedNear && !told["near_"+s.id] && autoVoice && !stationary){ announcedNear=true; markTold("near_"+s.id); sayUrgent(`Ya casi llegan a ${s.name}. Unos ${Math.round(d/10)*10} metros.`); }
  checkSteps(); checkPois(); maybeReroute(); lookupStreet(); autoStories(); reassure();
}
setInterval(()=>{ $("#clock").textContent=hhmm(new Date()); if(!$("#app").classList.contains("hidden")){ if(pos) updateMotion(pos); autoStories(); } },2500);

function arrive(auto){
  if(mode==="stop") return;
  mode="stop"; view="guide"; visited[STOPS[idx].id]=true; render();
  if(auto) toast("📍 ¡Llegaron a "+STOPS[idx].name+"!");
  try{ navigator.vibrate&&navigator.vibrate([120,60,120]); }catch(e){}
  if(!told["stop_"+STOPS[idx].id] || !auto){ markTold("stop_"+STOPS[idx].id); if(autoVoice||!auto){ chainOn=true; say(STOPS[idx].narr,STOPS[idx].name); } }
  window.scrollTo({top:0,behavior:"smooth"});
}
function nextUnvisited(){ for(let k=1;k<=STOPS.length;k++){ const j=(idx+k)%STOPS.length; if(!visited[STOPS[j].id]) return j; } return -1; }
function goNext(){
  const nx=nextUnvisited();
  if(nx<0){ say("Fin del recorrido. Gracias por caminar Toledo. Que disfruten el atardecer.","Fin"); toast("🏁 ¡Recorrido completo!"); return; }
  idx=nx; mode="walk"; startLeg(); render();
  if(autoVoice) legSay(false); else stopVoice();
  window.scrollTo({top:0,behavior:"smooth"});
}
$("#bArrive").onclick=()=>arrive(false);
$("#bSkip").onclick=()=>{ stopVoice(); const keep=idx; const nx=(()=>{ for(let k=1;k<=STOPS.length;k++){ const j=(keep+k)%STOPS.length; if(!visited[STOPS[j].id]&&j!==keep) return j; } return -1; })(); if(nx<0){ toast("No quedan otras paradas"); return; } idx=nx; mode="walk"; startLeg(); render(); if(autoVoice) legSay(false); };
$("#bNext").onclick=goNext;
$("#bLeg").onclick=()=>legSay(true);
$("#bPlay").onclick=()=>{ if(speaking) togglePause(); else { chainOn=true; say(STOPS[idx].narr,STOPS[idx].name); } };
$("#bMore").onclick=()=>{ const n=$("#sNarr"); n.classList.toggle("clamp"); $("#bMore").textContent=n.classList.contains("clamp")?"Leer todo ▾":"Mostrar menos ▴"; };
$("#bAns").onclick=()=>{ $("#sAns").classList.remove("hidden"); $("#bAns").classList.add("hidden"); };
$("#bList").onclick=()=>{ view=view==="list"?"guide":"list"; render(); window.scrollTo({top:0}); };
$("#home").onclick=()=>{ view="guide"; render(); };

/* ajustes */
var openSheet=function(on){ $("#sheet").classList.toggle("on",on); $("#sheetBg").classList.toggle("on",on); if(on){ loadVoices(); syncSet(); } }
function syncSet(){ document.querySelectorAll("#rateSeg button").forEach(b=>b.classList.toggle("on",+b.dataset.r===rate)); $("#autoSw").classList.toggle("on",autoVoice); }
$("#bSet").onclick=()=>openSheet(true);
$("#sheetBg").onclick=()=>openSheet(false);
document.querySelectorAll("#rateSeg button").forEach(b=>b.onclick=()=>{ rate=+b.dataset.r; prefs.rate=rate; store.set("toledo_prefs",prefs); syncSet(); });
$("#autoSw").onclick=()=>{ autoVoice=!autoVoice; prefs.auto=autoVoice; store.set("toledo_prefs",prefs); syncSet(); };
$("#bTest").onclick=()=>say("Bienvenidos a Toledo, la ciudad de las tres culturas. Así va a sonar su guía durante el paseo.","Prueba de voz");

/* inicio */
$("#startAt").innerHTML=`<option value="auto">📍 La parada más cercana a mí</option>`+STOPS.map((s,i)=>`<option value="${i}">${i+1}. ${s.name}</option>`).join("");
const prev=store.get("toledo_state");
if(prev&&prev.day===today){ visited=prev.visited||{}; }
const nVis=Object.values(visited).filter(Boolean).length;
if(nVis) $("#resumeNote").textContent=`✓ Ya visitaron ${nVis} de ${STOPS.length}. Seguimos por la más cercana que les falte.`;
let waitingStart=false;
function firstUnvisited(){ const i=STOPS.findIndex(s=>!visited[s.id]); return i<0?0:i; }
function nearestUnvisited(p){ let best=-1,bd=Infinity; STOPS.forEach((s,i)=>{ if(visited[s.id]) return; const d=dist(p,s); if(d<bd){bd=d;best=i;} }); return best<0?firstUnvisited():best; }
function beginLeg(intro){
  mode="walk"; startLeg(); render();
  const s=STOPS[idx];
  const txt=`${intro?INTRO+" ":""}${Object.values(visited).filter(Boolean).length?"Ya tengo anotado lo que visitaron. ":""}Vamos a ${s.name}. ${s.legDir.replace(/<[^>]+>/g,"")} ${(leg.parts[0]||"")}`;
  say(txt,"Camino a "+s.name); leg.next=Math.min(1,leg.parts.length); markTold("leg_"+s.id+"_0");
}
$("#go").onclick=()=>{
  unlockAudio();
  const v=$("#startAt").value; view="guide";
  $("#landing").classList.add("hidden"); $("#app").classList.remove("hidden"); $("#player").classList.remove("hidden");
  window.scrollTo({top:0});
  initMap(); startCompass(); keepAwake();
  const intro=!told["intro"]; markTold("intro");
  if(v==="auto"){
    idx=firstUnvisited(); waitingStart=true; mode="walk"; render();
    say("Un segundo, estoy buscando dónde están para elegir la parada más cercana.","Ubicándolos");
    const fallback=setTimeout(()=>{ if(waitingStart){ waitingStart=false; toast("Sin ubicación: empezamos por "+STOPS[idx].name); beginLeg(intro); } },9000);
    startGeo((p)=>{ if(!waitingStart) return; waitingStart=false; clearTimeout(fallback); idx=nearestUnvisited(p); toast("📍 Empezamos por "+STOPS[idx].name+", la más cercana"); beginLeg(intro); mapSetView(p,17); });
  } else {
    idx=+v; startGeo(); beginLeg(intro);
  }
  updStoryCount(); $("#score").textContent="⭐ "+quizState.score;
};

/* ======================= REALIDAD AUMENTADA ======================= */
let arOn=false, arStream=null, arHead=null, arRAF=null;
const FOV=60;
function smoothHeading(h){ if(h==null) return arHead; if(arHead==null) return arHead=h; let d=((h-arHead+540)%360)-180; arHead=(arHead+d*0.25+360)%360; return arHead; }
async function openAR(){
  if(!pos){ toast("Necesito la ubicación para la realidad aumentada"); return; }
  await startCompass();
  $("#ar").classList.remove("hidden"); arOn=true;
  try{ arStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false}); const v=$("#arVideo"); v.srcObject=arStream; await v.play(); }
  catch(e){ $("#arHint").textContent="No pude abrir la cámara. Revisen el permiso de cámara del navegador."; }
  if(heading==null) $("#arHint").textContent="No recibo la brújula. En iPhone, al empezar acepten el permiso de movimiento y orientación; si no apareció, recarguen la página.";
  buildAR(); arLoop();
}
function closeAR(){ arOn=false; cancelAnimationFrame(arRAF); if(arStream){ arStream.getTracks().forEach(t=>t.stop()); arStream=null; } $("#ar").classList.add("hidden"); }
let arItems=[];
function buildAR(){
  const box=$("#arLabels"); box.innerHTML=""; arItems=[];
  const add=(o,kind)=>{ const el=document.createElement("div"); el.className="arl "+kind; el.innerHTML=`<div class="card"><b>${o.name||o.n}</b><span></span></div><div class="stem"></div>`; el.onclick=()=>{ if(kind.includes("poi")){ say((o.n)+". "+o.t.charAt(0).toUpperCase()+o.t.slice(1),o.n); } else { const i=STOPS.indexOf(o); if(i!==idx){ idx=i; startLeg(); render(); toast("Nueva próxima parada: "+o.name); buildAR(); } } }; box.appendChild(el); arItems.push({o,el,kind}); };
  STOPS.forEach((s,i)=>add(s, i===idx?"main":(visited[s.id]?"stop done":"stop")));
  POIS.forEach(p=>add(p,"poi"));
}
function arLoop(){
  if(!arOn) return;
  const h=smoothHeading(heading);
  const W=innerWidth, H=innerHeight;
  const s=STOPS[idx]; const ds=pos?dist(pos,s):0;
  $("#arNext").textContent=s.name; $("#arNextD").textContent=pos?`${ds<1000?Math.round(ds)+" m":(ds/1000).toFixed(1)+" km"} · ${relDir(bearing(pos,s))}`:"";
  let showL=false, showR=false;
  const vis=[];
  arItems.forEach(it=>{
    const o=it.o; const d=dist(pos,o); const b=bearing(pos,o);
    const isMain=it.kind==="main";
    const maxD = isMain?5000 : it.kind.includes("poi")?350:1200;
    if(h==null||d>maxD){ it.el.style.display="none"; if(isMain&&h==null){} return; }
    const delta=((b-h+540)%360)-180;
    if(Math.abs(delta)>FOV/2+4){ it.el.style.display="none"; if(isMain){ if(delta<0) showL=true; else showR=true; } return; }
    it.el.style.display="flex";
    const x=W/2 + (delta/(FOV/2))*(W/2);
    const y=H*0.62 - Math.min(1,Math.log10(Math.max(d,10))/3.2)*H*0.38;
    vis.push({it,x,y,d,isMain});
    it.el.querySelector("span").textContent = d<1000?Math.round(d)+" m":(d/1000).toFixed(1)+" km";
  });
  // mostrar la próxima parada + los 5 lugares más cercanos, sin superponerse
  vis.sort((a,b)=>(b.isMain-a.isMain)||(a.d-b.d));
  const keep=vis.filter(v=>v.isMain).concat(vis.filter(v=>!v.isMain && !v.it.kind.includes("done")).slice(0,5));
  vis.forEach(v=>{ if(!keep.includes(v)) v.it.el.style.display="none"; });
  const placed=[];
  keep.forEach(v=>{ let y=v.isMain?H*0.40:H*0.40+Math.min(1,Math.log10(Math.max(v.d,10))/3)*H*0.18; let guard=0; while(placed.some(p=>Math.abs(p.x-v.x)<130&&Math.abs(p.y-y)<52)&&guard++<8) y+=54; placed.push({x:v.x,y}); v.it.el.style.left=Math.max(70,Math.min(W-70,v.x))+"px"; v.it.el.style.top=Math.min(H-120,y)+"px"; v.it.el.style.zIndex=v.isMain?50:Math.round(40-v.d/100); });
  $("#arL").style.display=showL?"flex":"none"; $("#arR").style.display=showR?"flex":"none";
  arRAF=requestAnimationFrame(arLoop);
}
$("#bAR").onclick=openAR; $("#bAR2").onclick=openAR; $("#arClose").onclick=closeAR;

/* ---- ajustes voz premium ---- */
function syncPrem(){ const p=prefs.prov||"device"; document.querySelectorAll("#provSeg button").forEach(b=>b.classList.toggle("on",b.dataset.p===p)); $("#premBox").classList.toggle("hidden",p==="device"); $("#oVoice").classList.toggle("hidden",p!=="openai"); $("#eVoice").classList.toggle("hidden",p!=="eleven"); $("#apiKey").value=prefs.key||""; $("#oVoice").value=prefs.ovoice||"coral"; $("#eVoice").value=prefs.evoice||""; $("#premNote").textContent = p==="device"?"":(premiumOn()?"✓ Voz premium activa.":"Peguen la clave y toquen Guardar."); }
document.querySelectorAll("#provSeg button").forEach(b=>b.onclick=()=>{ prefs.prov=b.dataset.p; if(prefs.prov==="device"){} store.set("toledo_prefs",prefs); premiumBroken=false; syncPrem(); });
$("#bPremSave").onclick=()=>{ prefs.key=$("#apiKey").value.trim(); prefs.ovoice=$("#oVoice").value; prefs.evoice=$("#eVoice").value.trim(); store.set("toledo_prefs",prefs); premiumBroken=false; audioCache.clear(); syncPrem(); unlockAudio(); say("Hola, soy su guía en Toledo. Así va a sonar la voz durante el resto del paseo. ¿Seguimos?","Prueba de voz premium"); };
const _openSheet=openSheet; openSheet=function(on){ _openSheet(on); if(on) syncPrem(); };
$("#bSet").onclick=()=>openSheet(true); $("#sheetBg").onclick=()=>openSheet(false);
