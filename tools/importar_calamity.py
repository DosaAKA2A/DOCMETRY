#!/usr/bin/env python3
"""Trae la guía de Calamity (EDERUS/calamity.html, ya pública) a EDERUSDEX como assets/calamity.html.

Desde el 02/11 la sección no copia la guía tal cual: la trocea en temas (un <h2> = un tema), los agrupa en
categorías y codice.js pinta cada tema como una tarjeta (resumen + puntos clave) que abre su ficha completa.
El fichero que sale lleva:
  - <style> con el CSS de la guía (acotado a #p-calamity), para el contenido de las fichas;
  - <script type="application/json" id="cal-temas"> con la lista de temas (título, categoría, icono, resumen, puntos);
  - un <template data-tema="id"> por tema con su contenido completo, y <template id="cal-fichas"> con las fichas de objeto;
  - <script type="text/plain" data-cal-js> con los scripts de la guía (fichas de objeto, modelos 3D, biomas),
    que codice.js ejecuta al abrir cada ficha.
También corrige con datos del Survival lo que se haya quedado viejo (cambios de Carpa).

Uso: python tools/importar_calamity.py [ruta a calamity.html] [ruta a trades.yml de PremioPescao]
"""
import html
import json
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGEN = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Dosa\Documents\ProyectosGit\EDERUS\calamity.html")
TRADES = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else
                      r"C:\Users\Dosa\Documents\Ederus\estudio-temporada-3\snapshot\live\plugins\PremioPescao\trades.yml")
DESTINO = RAIZ / "assets" / "calamity.html"

# categoría e icono de cada tema (título del <h2> → (categoría, icono de Minecraft)). Un tema nuevo sin entrada aquí hace fallar el import.
CATS = [
    ("antes", "Antes de entrar", "Qué es, qué cambia dentro, quién te ayuda y cómo volver con vida."),
    ("sobrevivir", "Sobrevivir ahí dentro", "Distancia, cordura, clima y Corrupción: lo que te va desgastando."),
    ("enemigos", "Enemigos", "Los mobs de cada bioma, los minijefes y lo que te persigue."),
    ("eventos", "Eventos y PvP", "Cuándo se oscurece todo, cuándo hay tregua y quién puede ponerle precio a tu cabeza."),
    ("botin", "Botín y economía", "Qué se saca, de dónde sale cada llave y qué vale cada cosa."),
    ("mejorar", "Mejorar tu equipo", "Dónde se gastan las Esencias: Altar, Forja, gemas y sets."),
    ("clanes", "Clanes, ranking y temporada", "Contratos, ranking semanal, Trofeo, hitos y lo que queda al cerrar la temporada."),
]
TEMAS = {
    "Qué es Calamity": ("antes", "crying_obsidian"),
    "Lo que cambia dentro": ("antes", "rotten_flesh"),
    "El spawn de Calamity": ("antes", "respawn_anchor"),
    "Quién es quién": ("antes", "villager_spawn_egg"),
    "Cómo volver vivo": ("antes", "amethyst_shard"),
    "Cuatro consejos para la primera vez": ("antes", "writable_book"),
    "Cuanto más lejos, más peligro": ("sobrevivir", "spyglass"),
    "Tu marcador": ("sobrevivir", "map"),
    "Tu cordura": ("sobrevivir", "fermented_spider_eye"),
    "La noche, el clima y el cielo rojo": ("sobrevivir", "lightning_rod"),
    "La Corrupción": ("sobrevivir", "wither_rose"),
    "Los mobs de cada bioma": ("enemigos", "zombie_spawn_egg"),
    "Los seis minijefes": ("enemigos", "wither_skeleton_spawn_egg"),
    "La Parca": ("enemigos", "netherite_hoe"),
    "El Vigilante": ("enemigos", "ender_eye"),
    "Tu Eco": ("enemigos", "echo_shard"),
    "El Resentimiento": ("enemigos", "bone"),
    "Lo que los hace más fuertes": ("enemigos", "blaze_powder"),
    "El Eclipse": ("eventos", "end_crystal"),
    "El Armisticio": ("eventos", "white_wool"),
    "Ambush y la Sentencia": ("eventos", "iron_sword"),
    "Esencias, MobCoins y Reliquias": ("botin", "glowstone_dust"),
    "Cofres y bóvedas": ("botin", "barrel"),
    "De dónde sale cada llave": ("botin", "tripwire_hook"),
    "La Caja del Caos": ("botin", "nether_star"),
    "La pesca de Calamity": ("botin", "fishing_rod"),
    "El Altar de Sael": ("mejorar", "enchanting_table"),
    "La Forja de Vael": ("mejorar", "netherite_ingot"),
    "Las gemas y Lior": ("mejorar", "emerald"),
    "El Hábito del Segador": ("mejorar", "netherite_chestplate"),
    "Los contratos de Maren": ("clanes", "paper"),
    "Clanes y el Trofeo de Temporada": ("clanes", "totem_of_undying"),
    "El ranking de la semana": ("clanes", "gold_ingot"),
    "La Temporada": ("clanes", "experience_bottle"),
    "Hitos y tags": ("clanes", "name_tag"),
    "Las Vigilias de Velen": ("clanes", "lantern"),
}
# pestañas viejas → categoría nueva (para los enlaces internos data-ir)
TAB_CAT = {"empezar": "antes", "sobrevivir": "sobrevivir", "amenazas": "enemigos", "botin": "botin", "mejorar": "mejorar", "clanes": "clanes"}

s = ORIGEN.read_text(encoding="utf-8")
i = s.index('<div class="doc">') + len('<div class="doc">')
j = s.rindex("</div>", 0, s.rindex("<script>const ICO_BASE"))
frag = s[i:j].strip()
frag = frag.replace("""'<h2>' + esc(b.n) + '</h2><span class="id">panacea/' + b.id + '</span>'""", """'<h2>' + esc(b.n) + '</h2>'""")
assert "panacea/" not in frag, "el formato de calamity.html ha cambiado; revisa el importador"

# clases que EDERUSDEX ya usa con otro estilo (.chip, .chips, .tip): se renombran a cal-*
CHOCAN = ("chip", "chips", "tip")
frag = re.sub(r"\.(" + "|".join(CHOCAN) + r")(?![\w-])", r".cal-\1", frag)
frag = re.sub(r'class="([^"]*)"', lambda m: 'class="' + " ".join("cal-" + c if c in CHOCAN else c for c in m.group(1).split()) + '"', frag)

# cambios de Carpa: escamas reales de trades.yml (Capucha, Chaqueta, Pantalón, Botas, Caña, en ese orden)
escamas = [int(x) for x in re.findall(r"pescao:\s*escama_sangrienta\s*\n\s*amount:\s*(\d+)", TRADES.read_text(encoding="utf-8"))]
if len(escamas) == 5:
    for pieza, n in zip(["Capucha", "Chaqueta", "Pantalón", "Botas", "Caña"], escamas):
        frag, k = re.subn(r"(\b(?:La|El|Las) " + pieza + r" Celestes? y )\d+ Escamas?", lambda m: f"{m.group(1)}{n} Escama{'s' if n != 1 else ''}", frag)
        assert k == 1, f"no encuentro el cambio de Carpa de {pieza}"

# Dosa 02/11: a Calamity se entra con el Cuerno de las Calamidades (lo vende Argos en el spawn del Survival,
# DeluxeMenus cuerno_calamity.yml, $1.000.000; no se pierde al morir: Calamity muerte.cuerno-se-queda) y se sale por el portal.
CORRIGE = [
    ('data-id="crying_obsidian" alt="" aria-hidden="true" decoding="async" width="44" height="44"></span><div><strong><span class="num">1</span>Entras por el portal</strong>Está en el spawn del Survival y te deja en el spawn de Calamity.',
     'data-id="goat_horn" alt="" aria-hidden="true" decoding="async" width="44" height="44"></span><div><strong><span class="num">1</span>Entras con el cuerno</strong>El Cuerno de las Calamidades lo vende Argos en el spawn del Survival por $1.000.000. Tócalo y te deja en el spawn de Calamity. No lo pierdes al morir.'),
    ("Ahí te deja el portal de entrada y ahí están todos los NPC.", "Ahí te deja el cuerno y ahí están todos los NPC. Por su portal se vuelve al Survival."),
]
for a, b in CORRIGE:
    assert frag.count(a) == 1, f"no encuentro el texto a corregir: {a[:60]}"
    frag = frag.replace(a, b)

# NPCs (Dosa 02/11: galería propia, sin fondos difuminados): se sacan de la lista «Quién es quién»
npcs = []
ul_npcs = re.search(r'<ul class="npcs">(.*?)</ul>\s*</section>', frag, re.S)
for li in re.findall(r'<li style="--tono:(#[0-9A-Fa-f]{6})">(.*?)</ul></li>', ul_npcs.group(1), re.S):
    tono, cuerpo_li = li
    nom = re.search(r'<span class="nom">([^<]+)</span>', cuerpo_li).group(1)
    rol = re.search(r'<span class="rol">([^<]+)</span>', cuerpo_li).group(1)
    hace = re.search(r'<p class="hace">(.*?)</p>', cuerpo_li, re.S).group(1)
    menu = re.findall(r"<li>(.*?)</li>", cuerpo_li.split('<ul class="menu">', 1)[1], re.S)
    # el retrato y el modelo 3D se leen del <template> de «Quién es quién» (no se duplican aquí)
    npcs.append(dict(n=nom, rol=rol, tono=tono, hace=hace.strip(), menu=[m.strip() for m in menu]))
assert len(npcs) >= 8, "no encuentro los NPC de «Quién es quién»"

css = re.search(r"<style>(.*?)</style>", frag, re.S).group(1)
scripts = re.findall(r"<script>(.*?)</script>", frag, re.S)
utiles = [x for x in scripts if ".subnav" not in x]  # el de las pestañas ya no hace falta
fichas = re.search(r'<div class="fichas-obj" hidden>.*?</div>\s*(?=<script>|$)', frag, re.S)
fichas = fichas.group(0) if fichas else ""


def texto(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h))).strip().replace(" .", ".").replace(" ,", ",")


def corta(t, n):
    if len(t) <= n:
        return t
    t = t[:n].rsplit(" ", 1)[0].rstrip(",;:")
    return t + "…"


temas, plantillas, vistos = [], [], set()
for m in re.finditer(r"<section[^>]*>\s*<h2[^>]*>(.*?)</h2>(.*?)</section>", frag, re.S):
    t = texto(m.group(1))
    if t not in TEMAS:
        raise SystemExit(f"tema sin categoría en TEMAS: «{t}»")
    vistos.add(t)
    cat, ic = TEMAS[t]
    cuerpo = m.group(2)
    cuerpo = re.sub(r'<nav class="sigue".*?</nav>', "", cuerpo, flags=re.S)  # «anterior / siguiente» de las pestañas viejas
    cuerpo = re.sub(r'href="#calamity-([a-z]+)"', lambda x: f'href="#calamity" data-cat="{TAB_CAT.get(x.group(1), "antes")}"', cuerpo)
    cuerpo = re.sub(r'data-ir="([a-z]+)"', lambda x: f'data-cat="{TAB_CAT.get(x.group(1), "antes")}"', cuerpo)
    pi = re.search(r'<p class="intro">(.*?)</p>', cuerpo, re.S)
    parrafos = [texto(x) for x in re.findall(r"<p>(.*?)</p>", cuerpo, re.S)]
    parrafos = [x for x in parrafos if len(x) > 40]
    if pi:
        intro = corta(texto(pi.group(1)), 230)
    else:
        intro = corta(parrafos.pop(0), 230) if parrafos else ""
    lis = []
    ul = re.search(r'<ul class="(reglas|consejos|objetos[^"]*)">(.*?)</ul>', cuerpo, re.S)
    roles = re.findall(r'<span class="nom">([^<]+)</span><span class="rol">([^<]+)</span>', cuerpo)
    if ul:
        for li in re.findall(r"<li[^>]*>(.*?)</li>", ul.group(2), re.S):
            b = re.search(r"<strong>(.*?)</strong>", li) or re.search(r'<span class="nom"[^>]*>(.*?)</span>', li)
            lis.append(corta(texto(b.group(1) if b and ul.group(1) != "reglas" else li), 120))
    elif roles:
        lis = [f"{n} · {r}" for n, r in roles]
    elif parrafos:
        lis = [corta(x, 120) for x in parrafos[:3]]
    subs = [texto(x) for x in re.findall(r"<h3[^>]*>(.*?)</h3>", cuerpo, re.S)]
    if not lis:
        lis = [corta(x, 60) for x in subs]
    slug = re.sub(r"[^a-z0-9]+", "-", texto(m.group(1)).lower().translate(str.maketrans("áéíóúñü", "aeiounu"))).strip("-")
    temas.append(dict(id=slug, cat=cat, t=t, ic=ic, intro=intro, puntos=lis[:4], mas=max(0, len(lis) - 4), subs=len(subs)))
    plantillas.append(f'<template data-tema="{slug}">{cuerpo.strip()}</template>')

falta = set(TEMAS) - vistos
assert not falta, f"temas que ya no están en calamity.html: {falta}"

out = ["<!-- generado por tools/importar_calamity.py desde EDERUS/calamity.html: no editar a mano -->",
       f"<style>{css}</style>",
       '<script type="application/json" id="cal-temas">' + json.dumps(dict(cats=[dict(id=a, t=b, d=c) for a, b, c in CATS], temas=temas, npcs=npcs), ensure_ascii=False).replace("</", "<\\/") + "</script>",
       f'<template id="cal-fichas">{fichas}</template>',
       *plantillas,
       *[f'<script type="text/plain" data-cal-js>{x}</script>' for x in utiles]]
DESTINO.write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"OK · {DESTINO.relative_to(RAIZ)} ({DESTINO.stat().st_size // 1024} KB) · {len(temas)} temas · {len(npcs)} NPC · escamas de Carpa {escamas}")
