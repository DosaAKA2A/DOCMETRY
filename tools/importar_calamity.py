#!/usr/bin/env python3
"""Trae la guía de Calamity (EDERUS/calamity.html, ya pública) a EDERUSDEX como assets/calamity.html.

La sección «Calamity» de codice.js carga ese fragmento al abrirse. Aquí se:
  - recorta el bloque #p-calamity (estilos + contenido + scripts propios),
  - adapta las anclas internas (#calamity-x → #calamity/x) al router de EDERUSDEX,
  - quita restos internos (ids de bioma «panacea/…») y el script de iconos (lo hace hydrate()),
  - corrige con datos del Survival lo que se haya quedado viejo (cambios de Carpa).

Uso: python tools/importar_calamity.py [ruta a calamity.html] [ruta a trades.yml de PremioPescao]
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGEN = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Dosa\Documents\ProyectosGit\EDERUS\calamity.html")
TRADES = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else
                      r"C:\Users\Dosa\Documents\Ederus\estudio-temporada-3\snapshot\live\plugins\PremioPescao\trades.yml")
DESTINO = RAIZ / "assets" / "calamity.html"

s = ORIGEN.read_text(encoding="utf-8")
i = s.index('<div class="doc">') + len('<div class="doc">')
j = s.rindex("</div>", 0, s.rindex("<script>const ICO_BASE"))
frag = s[i:j].strip()

# router de EDERUSDEX: #vista/sub
frag = frag.replace("history.replaceState(null,'','#calamity-'+id)", "history.replaceState(null,'','#calamity/'+id)")
frag = frag.replace(r"/^#calamity-([a-z]+)$/", r"/^#calamity\/([a-z]+)$/")
frag = frag.replace("if(m&&ver(m[1])&&typeof showTab==='function') showTab('p-calamity');", "if(m) ver(m[1]);")
frag = frag.replace('href="#calamity-', 'href="#calamity/')
# nada de ids internos en las fichas de bioma
frag = frag.replace("""'<h2>' + esc(b.n) + '</h2><span class="id">panacea/' + b.id + '</span>'""", """'<h2>' + esc(b.n) + '</h2>'""")
# las fichas usan un <dialog> propio: que no choque con el panel de EDERUSDEX
assert "#calamity/" in frag and "panacea/" not in frag, "el formato de calamity.html ha cambiado; revisa el importador"

# clases que EDERUSDEX ya usa con otro estilo (.chip, .chips, .tip): se renombran a cal-*
CHOCAN = ("chip", "chips", "tip")
frag = re.sub(r"\.(" + "|".join(CHOCAN) + r")(?![\w-])", r".cal-\1", frag)
frag = re.sub(r'class="([^"]*)"', lambda m: 'class="' + " ".join("cal-" + c if c in CHOCAN else c for c in m.group(1).split()) + '"', frag)

# cambios de Carpa: escamas reales de trades.yml (Capucha, Chaqueta, Pantalón, Botas, Caña, en ese orden)
t = TRADES.read_text(encoding="utf-8")
escamas = [int(x) for x in re.findall(r"pescao:\s*escama_sangrienta\s*\n\s*amount:\s*(\d+)", t)]
piezas = ["Capucha", "Chaqueta", "Pantalón", "Botas", "Caña"]
if len(escamas) == 5:
    for pieza, n in zip(piezas, escamas):
        frag, k = re.subn(r"(\b(?:La|El|Las) " + pieza + r" Celestes? y )\d+ Escamas?", lambda m: f"{m.group(1)}{n} Escama{'s' if n != 1 else ''}", frag)
        assert k == 1, f"no encuentro el cambio de Carpa de {pieza}"

DESTINO.write_text("<!-- generado por tools/importar_calamity.py desde EDERUS/calamity.html: no editar a mano -->\n" + frag + "\n", encoding="utf-8")
print(f"OK · {DESTINO.relative_to(RAIZ)} ({DESTINO.stat().st_size // 1024} KB) · escamas de Carpa {escamas}")
