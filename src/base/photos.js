/* ======================= FOTOS (Wikimedia Commons) ======================= */
const WM = f => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=1400";
const PH = {
  pano:   WM("Toledo Skyline Panorama, Spain - Dec 2006.jpg"),
  valle:  WM("Toledo - Panorama desde Mirador del Valle.jpg"),
  sky:    WM("Toledo Skyline (4280718845).jpg"),
  puente: WM("Puente de San Martín. Toledo, Spain.jpg"),
  cate:   WM("FP Toledo Cathedral 2025 - West façade.jpg"),
  comercio: WM("Catedral de Toledo, desde la Calle Comercio.JPG"),
  sanjuan: WM("Claustro del monasterio de San Juan de los Reyes, Toledo, España..jpg"),
  blanca: WM("Santa María la Blanca - Arcos.jpg"),
  bisagra: WM("Puerta Nueva de Bisagra, Toledo.jpg"),
  bisagraPatio: WM("Puerta Nueva de Bisagra (Toledo). Patio.jpg"),
  sagra: WM("Puerta de la Sagra (Bab-Shagra), Toledo.jpg")
};
const IMG = { bisagra:PH.bisagra, sol:PH.valle, cristo:PH.sky, zoco:PH.valle, alcazar:PH.pano, catedral:PH.cate, santotome:PH.comercio, transito:PH.sky, blanca:PH.blanca, sanjuan:PH.sanjuan, puente:PH.puente };
const SLIDES = [
  [PH.pano,"Toledo al amanecer · Alcázar y Catedral"],
  [PH.cate,"Catedral Primada · 800 años"],
  [PH.blanca,"Santa María la Blanca"],
  [PH.sanjuan,"Claustro de San Juan de los Reyes"],
  [PH.puente,"Puente de San Martín sobre el Tajo"],
  [PH.bisagra,"Puerta de Bisagra"],
  [PH.valle,"Toledo desde el Mirador del Valle"]
];
const SHORT = { bisagra:"La puerta imperial de Carlos V", sol:"Mudéjar, siglo XIV", cristo:"Una mezquita del año 999", zoco:"El corazón de la ciudad", alcazar:"La cima de Toledo", catedral:"Gótico · 800 años", santotome:"El Greco y el conde de Orgaz", transito:"La judería · por fuera", blanca:"Sinagoga del siglo XII", sanjuan:"Los Reyes Católicos", puente:"Atardecer sobre el Tajo" };

