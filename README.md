# EDERUSDEX

Guía del Survival de Ederus: tier lists de armaduras, armas y anomalías, cajas y premios, encantamientos, jefes de mazmorra, mascotas, tags, economía, progresión y rangos.

Es solo para mostrar información. No se suben los datos de origen ni la configuración del servidor.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | La página: cabecera, menú y contenedores. No lleva datos. |
| `assets/codice.css` | Todo el diseño (colores, tipografías, animaciones, móvil). |
| `assets/codice.js` | La interfaz: vistas, tier lists, tablas, fichas, comparador, buscador y animaciones. |
| `assets/data.js` | Los datos (`window.D`). Se genera, no se edita a mano. |
| `tools/actualizar_datos.py` | Pasa los datos de un `index.html` de `build_doc.py` a `assets/data.js`. |

## Actualizar los datos

```bash
python build_doc.py --publico                    # genera el index.html de siempre, en el estudio local
python tools/actualizar_datos.py ruta/al/index.html
```

El script solo reescribe `assets/data.js`, así que el diseño se mantiene.

## Funciones

- Buscador global con <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> o <kbd>/</kbd>, con resultados agrupados y navegación por teclado.
- Fichas con estadísticas frente al máximo de la lista y su propio enlace (`#tl-armaduras/ID`).
- Comparador de hasta 4 armaduras o armas.
- Tablas con filtros, orden, resaltado de búsqueda, carga progresiva y exportación a CSV.
- Enlaces con filtro aplicado: `#cajas--Elytra`.
- Respeta `prefers-reduced-motion` y funciona en móvil (las fichas salen como hoja inferior).
