# Fuentes de Fed for a Fiver

Cómo se construye y se prueba la app. Lo que ve el usuario sigue siendo un solo `index.html`.

## Construir

```bash
python3 build.py              # → dist/index.html y dist/sw.js (no cambia nada publicado)
python3 build.py --publish    # además copia los dos a la raíz, que es lo que sirve GitHub Pages
```

Solo hace falta Python 3 (biblioteca estándar). La caché de `sw.js` sale del número de `VERSION`: súbelo uno en cada entrega.

## Probar

```bash
npm install
npm test
```

- `test/build.test.js`: el build sale sin restos, el script y `sw.js` se pueden leer, la caché coincide con `VERSION`, no hay claves y el modelo es `claude-haiku-5-5`.
- `test/boot.test.js`: la app arranca en jsdom sin errores, pinta la portada y los resultados, y con £3, £5, £10 y £15 todo lo que «encaja» tiene precio, cabe en el presupuesto, está abierto y queda dentro del paseo. Un sitio sin precio nunca es la recomendación.
- Sin red: Supabase, Google y Overpass no se prueban aquí.

Herramientas usadas el 16/11/2026: Python 3.13, Node 22, jsdom 26.1.0 y Playwright con Chromium (capturas a 390 px).

## De dónde salen

Las fuentes de trabajo se perdieron el 14/11/2026. Las de `src/` se recuperaron el 16/11 partiendo el `index.html` de la v118 por sus cabeceras de sección (`tools/split_v118.py`). El primer `python3 build.py` devolvió la v118 **byte a byte** (`index.html` sha256 `121dd4f2…e529b`, `sw.js` sha256 `b3d25a64…0cfc0`).

| Carpeta | Qué es |
|---|---|
| `src/shell.html` | La página alrededor del estilo y el script |
| `src/style.css` | Todo el estilo |
| `src/*.js` | El código, en el orden que marca `build.py` |
| `src/gen/` | Datos generados: letras, rata, iconos, catálogos, Londres, Westfield, intenciones |
| `img/wordmark.png` | El logo de la cabecera |
| `src/sw.js` | Plantilla del service worker (`{{VERSION}}`) |

## Lo que falta

- **Generadores de `src/gen/`** (`tools/unis.py`, `london.py`, `drinks.py`, `westfield.py`, `cat15.py`) y los JSON de `data/` de los que salían. Hasta rehacerlos, `src/gen/` se edita a mano.
- **Pruebas antiguas**: flow, freeze, intents, mic, combos, london.
- **Parche de analítica del 28/10** (`n_results`, `pick_rank`, `card_saving`): no está en la v118.
- **`read-menu`**: el código desplegado no está en el repo. Hay que copiarlo desde Supabase antes de cambiarlo.
- `fiver-src.zip` (14/10) quedó viejo: lo sustituyen estas fuentes.
