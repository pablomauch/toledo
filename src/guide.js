/* ======================= HISTORIAS DE GUÍA (flujo continuo) =======================
   Se eligen por cercanía (lat/lng) o, si no tienen lugar, como historia general.      */
const GUIDE = [
 {id:"1085", lat:39.8571, lng:-4.0236, t:"La promesa rota de Alfonso Sexto", x:`Les cuento cómo cayó Toledo en manos cristianas, porque no fue con una batalla épica sino con un pacto. En 1085, después de años de presión, el rey taifa al-Qádir entregó la ciudad a Alfonso Sexto. Las condiciones eran generosas: los musulmanes podían quedarse, conservar sus bienes y, sobre todo, su mezquita mayor.

Pero un día en que el rey estaba lejos, su esposa, la reina Constanza, y el arzobispo Bernardo, un monje francés, entraron en la mezquita mayor, la consagraron como iglesia y colgaron campanas. Cuando Alfonso se enteró, montó en cólera: le habían hecho romper su palabra. Dice la crónica que quiso castigarlos duramente, y que fueron los propios musulmanes de Toledo quienes intercedieron para calmarlo.

Sobre esa mezquita, convertida en iglesia, se levantó después la catedral que hoy conocen.`},
 {id:"hercules", lat:39.8590, lng:-4.0245, t:"La Cueva de Hércules", x:`Toledo tiene una leyenda subterránea. Dicen que bajo la ciudad hay una cueva, la Cueva de Hércules, construida por el mismo héroe griego, cerrada con candados y con una orden: ningún rey debía abrirla jamás.

Cada rey visigodo, al subir al trono, añadía un candado nuevo. Hasta que llegó don Rodrigo, el último. Convencido de que adentro había un tesoro, mandó romper todos los cerrojos. Lo que encontró no fue oro: encontró un cofre con una tela pintada, que mostraba jinetes con turbantes, alfanjes y estandartes, y una inscripción que decía que quien abriera la cueva perdería España a manos de esos hombres.

Poco después, en el año 711, llegaron los musulmanes. Hoy, en un callejón cerca del centro, se puede visitar un espacio subterráneo romano que los toledanos identifican con aquella cueva.`},
 {id:"salomon", t:"La Mesa de Salomón", x:`Otra leyenda de tesoros. Se cuenta que los romanos, al saquear el templo de Jerusalén, se llevaron a Roma la mesa del rey Salomón, una mesa de oro y piedras preciosas con poderes misteriosos. Siglos después, los visigodos saquearon Roma y la mesa terminó, dicen, guardada en Toledo, su capital.

Cuando los musulmanes tomaron la ciudad en el año 711, el general Tariq la habría buscado con desesperación. Y aquí la leyenda se pone pícara: cuentan que al encontrarla, le faltaba una pata, y que Tariq la escondió para que su superior, Muza, no se llevara todo el mérito ante el califa.

Nadie sabe dónde terminó. Hay quien dice que sigue escondida bajo Toledo. Así que, si ven una baldosa suelta, avisen.`},
 {id:"guarrazar", t:"Las coronas de oro de los reyes godos", x:`Una historia que sí es real y parece leyenda. En 1858, unos campesinos que trabajaban cerca de Toledo, en un lugar llamado Guarrazar, encontraron enterradas unas coronas de oro y piedras preciosas. Eran coronas votivas de los reyes visigodos, que se colgaban en las iglesias como ofrenda, y una de ellas lleva el nombre del rey Recesvinto, del siglo siete.

Probablemente las escondieron cuando llegaron los musulmanes. El hallazgo terminó repartido: parte está hoy en el Museo Arqueológico de Madrid y parte en París. Es el gran tesoro visigodo de España, y salió de la tierra de Toledo.`},
 {id:"visigodos", lat:39.8585, lng:-4.0271, t:"Toledo, capital de los godos", x:`En el siglo sexto, los visigodos, un pueblo germánico que había entrado en el Imperio Romano, convirtieron Toledo en la capital de su reino. Aquí se coronaban sus reyes y aquí se reunían los famosos Concilios de Toledo, asambleas de obispos y nobles que en la práctica funcionaban como un parlamento.

En el año 589, en el tercer concilio, el rey Recaredo abandonó el arrianismo, la versión del cristianismo que practicaban los godos, y se convirtió al catolicismo, como la mayoría de la población. Fue un momento clave: por primera vez, gobernantes y gobernados compartían religión. Muchos historiadores ven ahí una de las raíces de la idea de España.`},
 {id:"mozarabes", t:"Los cristianos que hablaban árabe", x:`Una curiosidad de Toledo: durante los casi cuatro siglos de gobierno musulmán, muchos cristianos se quedaron en la ciudad. Se les llamó mozárabes. Mantenían su fe y su liturgia, pero vestían, comían y hablaban como sus vecinos musulmanes.

Tanto, que después de la conquista cristiana de 1085, los mozárabes de Toledo siguieron firmando contratos y documentos en árabe durante más de un siglo. Cristianos escribiendo en árabe, en una ciudad castellana. Toledo nunca fue tan simple como nos la cuentan.`},
 {id:"traductores", t:"El italiano que vino a buscar un libro", x:`En el siglo doce, un joven italiano, Gerardo de Cremona, viajó hasta Toledo por una razón: quería leer el Almagesto de Ptolomeo, el gran tratado de astronomía de la Antigüedad, que en Europa se había perdido pero que se conservaba en árabe.

Llegó, aprendió árabe y se quedó el resto de su vida. Tradujo al latín decenas de obras de astronomía, matemáticas, medicina y filosofía. Gracias a traductores como él, las universidades europeas volvieron a estudiar a los clásicos griegos y conocieron la ciencia árabe. Si alguna vez estudiaron álgebra, un poquito de esa historia pasó por estas calles.`},
 {id:"alfonsox", t:"Alfonso X, el rey sabio", x:`En 1221 nació en Toledo un rey muy particular: Alfonso Décimo, llamado el Sabio. Le interesaba todo: la astronomía, la música, la historia, las leyes, el ajedrez.

Reunió en Toledo a sabios judíos, musulmanes y cristianos, y bajo su impulso se escribieron obras en castellano, cuando la lengua culta era el latín. Mandó hacer las Tablas Alfonsíes, que calculaban el movimiento de los planetas y que los astrónomos europeos usaron durante siglos. Escribió las Cantigas de Santa María, cientos de canciones con su música. Y hasta un libro de ajedrez y juegos de mesa.

En buena medida, el castellano se convirtió en lengua de cultura gracias a un rey nacido aquí.`},
 {id:"comuneros", lat:39.8597, lng:-4.0276, t:"Los Comuneros: Toledo contra el emperador", x:`En 1520, Toledo se rebeló contra Carlos Quinto. El joven rey había llegado de Flandes sin hablar castellano, rodeado de consejeros extranjeros, y pidió dinero a las Cortes para hacerse coronar emperador. Las ciudades de Castilla se levantaron: fue la Guerra de las Comunidades, y Toledo fue uno de sus corazones.

El líder toledano era Juan de Padilla. Los comuneros fueron derrotados en Villalar en 1521, y Padilla fue ejecutado. Pero su viuda, María Pacheco, siguió resistiendo en Toledo durante meses, hasta comienzos de 1522, cuando huyó disfrazada a Portugal.

El emperador no perdonó: mandó derribar la casa de Padilla y sembrar el terreno con sal, para que nada volviera a crecer ahí. Ese lugar es hoy la plaza de Padilla.`},
 {id:"juana", lat:39.8567, lng:-4.0268, t:"Juana, la reina que nació en Toledo", x:`En 1479 nació en Toledo una niña que sería reina de Castilla: Juana, hija de los Reyes Católicos. La historia la conoce como Juana la Loca.

Se casó con Felipe el Hermoso, de quien estaba profundamente enamorada, y cuando él murió joven, ella recorrió Castilla de noche acompañando su ataúd. Su padre y luego su hijo, Carlos Quinto, la mantuvieron encerrada en Tordesillas durante casi cincuenta años, alegando que no estaba en condiciones de gobernar.

Hoy muchos historiadores se preguntan cuánto había de locura y cuánto de una mujer apartada del poder por los hombres de su familia. Lo cierto es que fue reina durante toda su vida, aunque casi nunca la dejaron reinar.`},
 {id:"lazarillo", lat:39.8567, lng:-4.0268, t:"El Lazarillo termina en Toledo", x:`Una de las novelas más importantes de la literatura española, el Lazarillo de Tormes, termina aquí. Lázaro, un niño pobre que sobrevive engañando a sus amos, un ciego, un clérigo avaro, un escudero muerto de hambre, acaba en Toledo como pregonero, el que anunciaba en voz alta las noticias y los vinos a la venta.

Y se casa con la criada del arcipreste de la iglesia de San Salvador, aquí cerca, mientras todo el barrio murmura sobre lo que pasa entre ella y el arcipreste. Lázaro, feliz, dice que está en la cumbre de toda buena fortuna. Es una ironía de hace casi quinientos años, y todavía funciona.`},
 {id:"garcilaso", lat:39.8592, lng:-4.0282, t:"Garcilaso, el poeta soldado", x:`Toledo dio también un gran poeta: Garcilaso de la Vega, nacido aquí a comienzos del siglo dieciséis. Era soldado y cortesano de Carlos Quinto, y a la vez renovó por completo la poesía en castellano, trayendo el soneto y los versos de los italianos.

Murió joven, en 1536, al asaltar una fortaleza en el sur de Francia, cuando subía el primero por una escalera. Su poesía habla del amor, de la pérdida y del Tajo, que describe como un río de aguas claras. Está enterrado aquí en Toledo, en la iglesia de San Pedro Mártir.`},
 {id:"beso", lat:39.8592, lng:-4.0282, t:"Bécquer y la leyenda de El beso", x:`El poeta Gustavo Adolfo Bécquer vivió en Toledo y escribió aquí varias de sus famosas Leyendas. Una se llama El beso.

Durante la guerra contra Napoleón, unos soldados franceses se alojan en una iglesia de Toledo convertida en cuartel. Uno de ellos, un capitán, se enamora de la estatua de piedra de una dama noble que está arrodillada junto a la tumba de su marido, un caballero en armadura. Una noche, borracho, presume ante sus compañeros, se acerca a la estatua e intenta besarla.

En ese instante, la estatua del marido levanta su mano de piedra y le da al capitán un golpe tan fuerte que lo deja tendido en el suelo, bañado en sangre. Bécquer ambientó esta historia en una iglesia toledana; dicen que es la de San Pedro Mártir.`},
 {id:"ajorca", lat:39.8571, lng:-4.0236, t:"La ajorca de oro", x:`Otra leyenda de Bécquer, esta vez en la catedral. Un joven llamado Pedro está loco de amor por María, y ella le confiesa su capricho: quiere la ajorca de oro, el brazalete, que lleva la imagen de la Virgen del Sagrario en la catedral.

Pedro, desesperado, se esconde en el templo de noche para robarla. Cuando llega al altar y estira la mano hacia la joya, le parece que las estatuas de los santos y los reyes de las tumbas cobran vida y lo rodean en la oscuridad. A la mañana siguiente lo encuentran tirado al pie del altar, con la ajorca en la mano, riendo. Había perdido la razón.

Bécquer escribe que, en Toledo de noche, la piedra parece respirar. Y a esta hora, caminando por aquí, cuesta no creerle.`},
 {id:"pozoamargo", lat:39.8565, lng:-4.0262, t:"El Pozo Amargo", x:`En Toledo hay una calle que se llama del Pozo Amargo, y su nombre tiene una leyenda triste.

Cuentan que una joven judía, Raquel, se enamoró de un joven cristiano. El padre de ella, al descubrirlo, lo esperó una noche y lo mató. La muchacha, rota de dolor, iba cada noche al pozo de su casa a llorar, hasta que sus lágrimas, de tantas, volvieron amarga el agua.

Es una leyenda romántica, pero dice algo verdadero sobre Toledo: tres comunidades que vivían una al lado de la otra, que se mezclaban en el mercado y en la calle, pero entre las que el amor estaba prohibido.`},
 {id:"cristovega", t:"A buen juez, mejor testigo", x:`Fuera de las murallas, en la vega del río, está la ermita del Cristo de la Vega. Y su leyenda la contó el poeta José Zorrilla.

Un joven soldado, Diego, promete casarse con Inés antes de irse a la guerra en Flandes, y lo jura frente al Cristo de esa ermita. Pasan los años, vuelve convertido en capitán, rico y orgulloso, y niega haber prometido nada. Inés lo lleva ante el juez, pero no hay testigos. Ella dice: sí hay uno, el Cristo de la Vega.

El tribunal entero va a la ermita. Le preguntan al Cristo si jura que Diego prometió casarse con Inés. Y el Cristo, dicen, despega una mano de la cruz, la pone sobre los autos del juicio y responde: sí, juro. Por eso la imagen tiene, todavía hoy, un brazo desclavado.`},
 {id:"tajo", t:"El río que abraza la ciudad", x:`Si miran un mapa de Toledo desde arriba, van a ver que el río Tajo hace una curva cerrada que rodea la ciudad casi por completo. Ese meandro se llama el Torno del Tajo.

Durante millones de años, el río fue cavando la roca y dejó a Toledo sobre un peñón, con barrancos de decenas de metros. Por eso los romanos, los visigodos, los musulmanes y los cristianos eligieron este lugar: era una fortaleza natural. El único acceso sencillo era por el norte, por donde entraron ustedes, por las puertas de Bisagra y del Sol.

En verano el Tajo baja manso, pero en la Edad Media sus crecidas se llevaron más de un puente. Por eso los que quedan, como Alcántara y San Martín, son tan robustos.`},
 {id:"acueducto", t:"Agua romana para Toletum", x:`Los romanos resolvieron el problema del agua de Toledo a su manera: construyeron un acueducto que traía agua desde las montañas del sur y la hacía cruzar el Tajo, probablemente sobre un puente o un sifón cerca de donde hoy está el puente de Alcántara.

Quedan pocos restos, pero imaginen la obra: llevar agua por gravedad durante kilómetros y subirla a una ciudad sobre una roca. Después, durante siglos, los toledanos volvieron a depender de aljibes, pozos y aguadores con burros. Hasta que llegó Juanelo con su artificio.`},
 {id:"greco_vista", t:"El Toledo de tormenta de El Greco", x:`Hay un cuadro de El Greco que es casi un retrato de esta ciudad: la Vista de Toledo, que hoy cuelga en el Museo Metropolitano de Nueva York. Es un paisaje bajo un cielo verde y negro de tormenta, con el Alcázar y la catedral iluminados como por un relámpago.

No es una foto: El Greco movió edificios de lugar para que salieran todos. Lo que pintó no fue Toledo como se veía, sino como se sentía. Algunos lo consideran uno de los primeros paisajes modernos de la pintura. Si esta noche ven nubes sobre la catedral, piensen en él.`},
 {id:"comida", t:"Qué cenar en Toledo", x:`Un dato práctico, que ya va siendo hora. La cocina toledana es de caza y de campo. El plato estrella es la perdiz estofada a la toledana, guisada lentamente con vino, vinagre y especias. Si ven carcamusas en una carta, pídanlas: es un guiso de cerdo con tomate y guisantes, típico para tapear, que nació en los bares de Toledo.

Y de postre, obviamente, mazapán. Pero también el queso manchego, que se hace en los alrededores. Con un vino de la región, es la mejor forma de terminar el día.`},
 {id:"noche", t:"Toledo de noche", x:`Ahora que cae la noche, Toledo cambia. Las callejuelas se vacían de grupos, las piedras se iluminan con luz cálida y el eco de los pasos rebota en las paredes. Es el Toledo de las leyendas.

No es casualidad que Bécquer y Zorrilla escribieran aquí sus historias de fantasmas, estatuas que se mueven y cristos que hablan. Esta ciudad, de noche, invita a creer. Caminen despacio, levanten la vista a los balcones y a los aleros de madera, y presten atención a los ruidos. Toledo tiene fama de ciudad encantada, y los toledanos la cuidan.`},
 {id:"corpus", t:"La gran fiesta de Toledo", x:`Si alguna vez vuelven en junio, traten de que coincida con el Corpus Christi. Es la gran fiesta de Toledo desde hace siglos.

Las calles del recorrido se cubren con toldos, se cuelgan tapices y mantones de los balcones, el suelo se llena de tomillo y romero, y por las calles pasa la enorme custodia de oro y plata de la catedral. Toda la ciudad huele a hierbas. Es probablemente el momento en que Toledo se parece más a lo que fue en el siglo dieciséis.`}
];
