# Fed for a Fiver · guía para Claude Code

Lee esto entero antes de tocar nada. Si algo de aquí no coincide con lo que ves en el código, manda el código: dilo y no adivines.

## Qué es

Fed for a Fiver dice a los estudiantes dónde comer en Londres por menos de £5: abierto ahora, cerca, y al precio real con las tarjetas de estudiante que ya tienen.

- Web: https://fedforafiver.com. Es una PWA: se instala desde el navegador. Sin App Store, sin cuentas, sin registro.
- Tagline: "Under a fiver, near you."
- La app se llama **Fed for a Fiver**. **Fiver** es la rata, la mascota. Nunca llames "Fiver" a la app a secas.
- Olivia es la autora y la única persona que decide.

## Cómo trabajar con Olivia

- Háblale en **español**. Todo lo que ve el usuario de la app va en **inglés británico**, revisado.
- Formato de respuesta: resumen de 1–3 líneas arriba, frases cortas, **negritas** en lo clave, tablas para comparar y, al final, **"Siguiente paso"** con una acción y quién la hace.
- Suelta muchas ideas a la vez. Ordénalas por impacto y protege el foco. Si algo no cabe ahora, di dónde va.
- Lo que está en "Decidido que no" no se reabre salvo que ella lo pida.
- Si un dato no está comprobado, dilo. No rellenes huecos.

## Publicar

- **Antes de cualquier acción en GitHub, avisa a Olivia y espera su "ok".** Push, abrir o cambiar un pull request, comentar, crear o borrar ramas, conectar el repo con permiso de escritura: di qué vas a hacer y en qué rama, y para. Un "ok" vale solo para lo que pediste, no para lo siguiente. Leer o clonar no hace falta pedirlo.
- **`main` es producción.** GitHub Pages publica sola en fedforafiver.com.
- **Nunca hagas push a `main`.** Trabaja en una rama, abre un pull request y para. Olivia revisa y fusiona.
- **El repo es público.** No escribas en archivos, commits ni pull requests: claves, datos personales de nadie, ni planes de negocio.
- En cada entrega, **sube la caché de `sw.js`** (`fiver-vNNN` → el número siguiente). Si no, los móviles no ven el cambio.
- Cada pull request lleva: lista corta de cambios, qué pruebas pasan, capturas a 390 px de lo que cambia, y lo que no has podido probar.

## No tocar sin que Olivia lo pida

- `CNAME`. Si se borra, se cae el dominio.
- Los iconos y `manifest.webmanifest` (salvo el número de versión, `?v=`).
- Supabase: nada, salvo que el encargo lo diga con todas las letras.

## Piezas

| Pieza | Qué es |
|---|---|
| `index.html` | La app entera en un archivo (código, datos y letras). Se genera con `build.py`. |
| `src/`, `build.py`, `test/`, `tools/` | Las fuentes, la construcción y las pruebas. Ver `FUENTES.md`. |
| `supabase/` | Código de las funciones y migraciones (sin claves). |
| `sw.js` | Service worker. Caché `fiver-vNNN`. Guarda `index.html`, el manifest y los 3 iconos. |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Lo que hace que se instale. |
| `CNAME` | El dominio. |
| `london.json` | Las sucursales del Gran Londres de más de 100 cadenas, sacadas de OpenStreetMap. |
| `build-london.html` | Página oculta que genera `london.json` en el navegador (el entorno de Claude no llega a Overpass). |
| Supabase | Función `read-menu` (lee fotos de cartas con Claude), tablas con lo que enseñan los usuarios, y `events` (analítica anónima). |
| Google Places | Respaldo para encontrar sucursales, horarios y nota. |
| Mapa y buscador | MapLibre + OpenFreeMap. Buscador: sitios de la app → Google autocomplete → Photon. |

### Fuentes y construcción

`index.html` se genera con `build.py` a partir de `src/`. No edites `index.html` a mano.

- Las fuentes de trabajo del chat anterior se perdieron (14/11). Las de `src/` se recuperaron el 16/11 partiendo la v118 por sus secciones (`tools/split_v118.py`). El primer build devolvió la v118 byte a byte. Detalle en `FUENTES.md`.
- `src/gen/` son datos generados (catálogos, rata, letras, iconos). Sus generadores (`tools/unis.py`, `london.py`, `drinks.py`, `westfield.py`, `cat15.py`) se perdieron: hasta rehacerlos, esos archivos se editan a mano y con cuidado.
- `python3 build.py` escribe en `dist/` (no cambia nada publicado). `python3 build.py --publish` copia `index.html` y `sw.js` a la raíz: solo en el paso de publicar.
- La caché sale de `VERSION`. Súbelo uno en cada entrega.

### Pruebas

- `npm install` una vez y después `npm test` (build + arranque en jsdom + reglas del ranking). Las pruebas antiguas (flow, freeze, intents, mic, combos, london) se perdieron con las fuentes.
- Capturas a **390 px** de ancho (móvil) de cada pantalla que cambie.
- Desde el entorno de Claude no se llega a Supabase ni a Overpass. Lo que dependa de eso, márcalo como **no probado**.
- Útil al probar: `?debug=1` (panel del buscador), `?me=1` (no cuenta en la analítica), `?src=` (canal de procedencia).

## Reglas de producto (no se negocian)

**Precios y horarios**
- **Nunca inventes un precio ni un horario.** Cada precio lleva su origen y su fecha (foto en tienda, app de la cadena, prensa, o Deliveroo ÷ 1,2 mostrado como "about").
- Un precio leído con duda en una foto se deja fuera.
- Un sitio sin precio nunca es la recomendación. Va al final: "Not priced yet · Snap a menu".
- Precio para llevar por defecto. Comer dentro puede subir (`price_eat_in`).
- Horario sin comprobar: "Hours not checked".

**Ranking**
- Con £5 o menos: la comida de verdad más barata que encaja. A igual precio, la más cercana.
- Con más de £5: el mejor plato para ese dinero (nivel de plato 1–5, nota de Google, uso del presupuesto, minutos andando).
- Andar a 80 m/min. Comer: 6 min (snack, café, meal deal) o 12 min (caliente).
- Presupuesto por defecto £5, máximo £15.
- **El ranking nunca se vende.**

**Alergias y alcohol**
- La app nunca dice "safe". Dice "likely" + "Ask staff; allergens change."
- Drinks: aviso 18+, siempre una opción sin alcohol arriba, precios con "about" o "from".

**Privacidad**
- Sin cuentas. Al servidor nunca va el nombre, la ubicación, las tarjetas concretas ni el texto de búsqueda.
- La clave de Anthropic vive solo como secreto en Supabase. Nunca en el repo ni en el móvil.

**Datos de Google**
- En el móvil solo se guarda el `place_id` (sin límite) y el punto (latitud y longitud, 30 días como máximo).
- Nombre, dirección, horarios, nota, valoraciones, fotos y reseñas de Google: en vivo y con atribución. No se guardan.
- Sin conexión: "Live info needs a connection".

**Claude dentro de la app**
- Modelo `claude-haiku-5-5`, a través de la función `read-menu`.
- La IA nunca añade platos ni precios que no estén en los datos.

**Enseñar a Fiver (fotos de cartas)**
- Límite de 10 fotos al día. Tiene que ser una carta. Hay que estar a menos de 150 m de la tienda. Precios entre £0,20 y £15.

## Viabilidad legal (siempre)

Cada idea, encargo o cambio lleva una revisión legal antes de construirlo, en la misma respuesta que la viabilidad técnica: **viable / viable con condiciones / no viable**, con la norma, la condición y lo que no está comprobado. Claude no es abogado: lo dudoso se marca "para revisión legal", no se da por bueno.

Qué mirar siempre (Reino Unido):
- **Datos personales:** UK GDPR y Data Protection Act 2018. Base legal, minimización, plazos, derechos (borrar), encargados (Supabase, Anthropic, Google) y el texto de Privacy.
- **Guardar o leer en el móvil y avisos:** PECR (`localStorage`, ID del móvil, analítica, notificaciones push). ¿Hace falta consentimiento o entra en una excepción?
- **Menores:** Age Appropriate Design Code del ICO (puede haber estudiantes de 17 años).
- **Contenido que suben los usuarios:** Online Safety Act 2023 (menús que ven otros).
- **Precios y publicidad:** DMCC Act 2024 (prácticas engañosas) y CAP Code (alcohol: nunca dirigido a menores de 18).
- **Alérgenos:** nunca "safe". La app no sustituye la información del local.
- **Terceros:** condiciones de Google Maps Platform (qué se guarda y cuánto tiempo), ODbL de OpenStreetMap (atribución), condiciones y política de uso de Anthropic, marcas y logos de las cadenas (nombres sí, logos no), derechos sobre fotos y cartas.

## Diseño (fijado por Olivia)

- Colores: crema `#FFF7EB`, burdeos `#59211F`, negro `#111111`. El damero burdeos/crema, una sola vez.
- Letras: su lettering propio (97 glifos) para títulos y precios, Josefin Sans para textos, Instrument Serif itálica.
- **Sin recuadros, sin bordes, sin emojis, sin botones grandes rellenos.**
- Navegación: flecha dibujada + palabra pequeña. Chips suaves en crema; seleccionado, negro.
- La rata: limpia y con estándares, nunca en cocinas ni basura. Enemigas: las palomas. Firma: "Don't tell the pigeons."
- **Si la app falla, la rata no hace chistes.**

## Decidido que no

- Cuentas, login y contraseñas.
- App nativa en la App Store (ya es instalable).
- Chat genérico con burbujas.
- Eventos con comida gratis dentro de la app.
- Copiar fotos de menús de Google.
- Inventar precios u horarios por cadena.
