/* ==========================================================================
   CÓDICE · EDERUS — interfaz
   Lee los datos de window.D (assets/data.js) y monta todas las vistas.
   ========================================================================== */
(() => {
'use strict';
const D = window.D, FICHAS = window.FICHAS || {};
const PUB = !!D.publico;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// ---------- formato
const CDN = 'https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets@master/data/';
const NF = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const fmt = v => v == null || v === '' ? '—' : (typeof v === 'number' ? NF.format(v) : v);
const fmtK = v => v == null ? '—' : v >= 1e6 ? (Math.round(v / 1e5) / 10).toString().replace('.', ',') + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' k' : fmt(v);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const AC = { a: 'aáàäâ', e: 'eéèëê', i: 'iíìïî', o: 'oóòöô', u: 'uúùüû', n: 'nñ', c: 'cç' };
const mkRe = q => q ? new RegExp('(' + [...q].map(ch => AC[ch] ? `[${AC[ch]}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + ')', 'i') : null;
const hl = (raw, re) => { raw = String(raw ?? ''); if (!re) return esc(raw); return raw.split(re).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join(''); };
// colores de tier: salen de la paleta de codice.css (:root)
const TC = { EX: 'var(--tc-ex)', S: 'var(--tc-s)', A: 'var(--tc-a)', B: 'var(--tc-b)', C: 'var(--tc-c)', D: 'var(--tc-d)' };
const TORD = { EX: 6, S: 5, A: 4, B: 3, C: 2, D: 1 };
const max = (arr, k) => Math.max(...arr.map(r => +r[k] || 0), 1);

const SVG = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>',
  cmp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  sortar: '<span class="ar">↓</span>'
};

// ---------- iconos de Minecraft
const ALIAS = { crossbow: 'crossbow_standby', sunflower: 'sunflower_front', illusioner_spawn_egg: 'evoker_spawn_egg', enchanted_golden_apple: 'golden_apple', shulker_box: 'shulker_shell', clock: 'clock_00', compass: 'compass_00', recovery_compass: 'recovery_compass_00', player_head: 'skeleton_skull', spawner: 'trial_spawner', chest: 'barrel' };
// cualquier caja de shulker de color se pinta con el caparazón
function ico(id, dye, lg) {
  if (!id) return '<span class="ic' + (lg ? ' lg' : '') + '"></span>';
  if (String(id).startsWith('data:')) return `<span class="ic${lg ? ' lg' : ''}"><img alt="" src="${id}"></span>`;
  id = String(id).toLowerCase(); id = ALIAS[id] || (id.endsWith('_shulker_box') ? 'shulker_shell' : id);
  if (dye && id.startsWith('leather_')) {
    return `<span class="ic${lg ? ' lg' : ''}"><span class="tint" style="background:${dye};-webkit-mask-image:url(${CDN}1.21.4/items/${id}.png);mask-image:url(${CDN}1.21.4/items/${id}.png)"></span><img alt="" loading="lazy" src="${CDN}1.21.4/items/${id}_overlay.png" onerror="this.remove()"></span>`;
  }
  return `<span class="ic${lg ? ' lg' : ''}"><img alt="" loading="lazy" data-id="${esc(id)}" data-i="0"></span>`;
}
// Recortes de cara corregidos para texturas cuya cabeza no es 8×8 o cuyo dato apunta mal.
// [x, y, ancho, alto] de la cara frontal y, si hay, la pieza del hocico/nariz: [x, y, ancho, alto, dx, dy].
const FACEFIX = {
  'piglin/piglin_brute': { f: [8, 8, 10, 8], n: [32, 2, 4, 4, 3, 4] },
  'piglin/piglin': { f: [8, 8, 10, 8], n: [32, 2, 4, 4, 3, 4] },
  'warden/warden': { f: [10, 42, 16, 16] },
  'villager/villager': { f: [8, 8, 8, 10] },
  'witch': { f: [8, 8, 8, 10] },
  'illager/ravager': { f: [16, 16, 16, 20] },
  'goat/goat': { f: [44, 56, 5, 7] }
};
const IMGC = {}, FACEC = {};
const loadImg = u => IMGC[u] || (IMGC[u] = new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = ko; i.src = u; }));
function face(a) {
  if (a.face) return `<span class="face"><img alt="" src="${a.face}"></span>`;
  if (a.skin) return `<span class="face" data-skin="${esc(JSON.stringify(a.skin))}"></span>`;
  return ico(a.icon);
}
// dibuja la cara recortada en un canvas (píxel nítido, centrada en un cuadrado) y la cachea
function faceURL(skin) {
  const k = skin.join(',');
  return FACEC[k] || (FACEC[k] = (async () => {
    const [p, , , x, y, fw, fh = fw] = skin, fix = FACEFIX[p];
    const [fx, fy, w, h] = fix ? fix.f : [x, y, fw, fh];
    const img = await loadImg(`${CDN}1.21.4/entity/${p}.png`);
    const S = Math.max(w, h), c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    // Dosa 02/11: si la cara no es cuadrada, no se deja hueco: se amplía el recorte con lo que sigue en la skin
    // (arriba y abajo si es ancha, a los lados si es alta), sin salirse de la textura
    const sx = Math.max(0, Math.min(img.width - S, fx - Math.floor((S - w) / 2))), sy = Math.max(0, Math.min(img.height - S, fy - Math.floor((S - h) / 2)));
    const ox = fx - sx, oy = fy - sy;
    g.drawImage(img, sx, sy, S, S, 0, 0, S, S);
    if (fix && fix.n) { const [nx, ny, nw, nh, dx, dy] = fix.n; g.drawImage(img, nx, ny, nw, nh, ox + dx, oy + dy, nw, nh); }
    return c.toDataURL();
  })());
}
function hydrateFaces(root) {
  root.querySelectorAll('.face[data-skin]').forEach(el => {
    const skin = JSON.parse(el.dataset.skin); el.removeAttribute('data-skin');
    faceURL(skin).then(u => { el.style.backgroundImage = `url(${u})`; el.style.backgroundSize = '100% 100%'; }, () => {
      // si el canvas no se puede leer, recorte con porcentajes como respaldo
      const [p, w, h, x, y, fw, fh = fw] = skin;
      el.style.backgroundImage = `url(${CDN}1.21.4/entity/${p}.png)`;
      el.style.backgroundSize = `${w / fw * 100}% ${h / fh * 100}%`;
      el.style.backgroundPosition = `${w === fw ? 0 : x / (w - fw) * 100}% ${h === fh ? 0 : y / (h - fh) * 100}%`;
    });
  });
}
// nombres de mobs y objetivos tal y como vienen de la config (ids en minúscula) → legibles
const MOBN = { GuardianDeLaMazmorra: 'Guardián de la Mazmorra', Dragon1: 'Dragón 1', Dragon2: 'Dragón 2' };
const mobName = n => MOBN[n] || String(n ?? '').replace(/_/g, ' ').replace(/([a-záéíóúñ])([A-Z0-9])/g, '$1 $2').replace(/\s+/g, ' ').trim()
  .replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (De|Del|La|Las|Los|Y) /g, m => m.toLowerCase());
const sentence = t => { t = String(t ?? '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
const tag = t => `<span class="tagbox">${t}</span>`;
const eggOf = n => ico(String(n).trim().toLowerCase().replace(/\s+/g, '_') + '_spawn_egg');
const mobFace = j => j.skin ? `<span class="face"><img alt="" loading="lazy" src="${j.skin}"></span>` : ico(j.icon);
function hydrate(root) {
  hydrateFaces(root);
  root.querySelectorAll('img[data-id]').forEach(img => {
    if (img.src) return; const id = img.dataset.id;
    const L = [CDN + '1.21.4/items/' + id + '.png', CDN + '1.21.4/blocks/' + id + '.png', CDN + '1.21.4/blocks/' + id + '_top.png', CDN + '1.21.11/items/' + id + '.png', CDN + '1.21.11/blocks/' + id + '.png'];
    const next = () => { const i = +img.dataset.i || 0; if (i < L.length) { img.dataset.i = i + 1; img.src = L[i]; } else { img.onerror = null; img.style.visibility = 'hidden'; } };
    img.onload = () => img.classList.add('ok'); img.onerror = next; next();
  });
}

// ---------- utilidades de UI
const toastEl = $('#toast'); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2200); }
const split = t => t.split(' ').map((w, i) => `<span class="split-word"><span style="--i:${i}">${w}</span></span>`).join(' ');
let rvSeq = 0;
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const t = e.target; t.classList.add('is-in'); io.unobserve(t);
  $$('[data-count]', t).concat(t.matches('[data-count]') ? [t] : []).forEach(countUp);
}), { rootMargin: '0px 0px -6% 0px', threshold: 0 });
function reveal(root) {
  rvSeq = 0;
  $$('.rv,.tl,.chart,[data-count]', root).forEach(el => { if (!el.classList.contains('is-in')) io.observe(el); });
}
function countUp(el) {
  if (el.dataset.done) return; el.dataset.done = 1;
  const to = +el.dataset.count; if (RM || !to) { el.textContent = NF.format(to); return; }
  const t0 = performance.now(), dur = 1600;
  const step = now => { const p = Math.min(1, (now - t0) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); el.textContent = NF.format(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
// (02/11) fuera el foco que seguía al ratón: repintaba la tarjeta a cada movimiento y no se usaba en el CSS
// ---------- vistas
const VIEWS = [
  { g: 'Empieza aquí', id: 'inicio', t: 'Inicio', ic: 'knowledge_book' },
  { g: 'Tier lists', id: 'tl-armaduras', t: 'Armaduras', ic: 'netherite_chestplate', n: () => D.armaduras.length, d: 'Todos los sets, del más fuerte al más débil.', w: 'w6' },
  { g: 'Tier lists', id: 'tl-armas', t: 'Armas', ic: 'netherite_sword', n: () => D.armas.length, d: 'Todas las armas, de la más fuerte a la más débil.', w: 'w3' },
  { g: 'Tier lists', id: 'tl-anomalias', t: 'Anomalías', ic: 'nether_star', n: () => D.anomalias.length, d: 'Todas las anomalías, de la más difícil a la más fácil.', w: 'w3' },
  { g: 'Base de datos', id: 'cajas', t: 'Cajas y premios', ic: 'tripwire_hook', n: () => D.premios.length, d: 'Cada caja, sus premios y la probabilidad de cada uno.', w: 'w4' },
  { g: 'Base de datos', id: 'encantamientos', t: 'Encantamientos', ic: 'enchanted_book', n: () => D.encantamientos.length, d: 'Los de AdvancedEnchantments con su efecto al nivel máximo.', w: 'w4' },
  { g: 'Base de datos', id: 'mazmorras', t: 'Mazmorras', ic: 'trial_key', hot: 'Jefes', hotc: 'oro', n: () => (D.mazmorras || []).length, d: 'Requisitos, jefes, botín, cofres, encargos y tiendas de cada mazmorra.', w: 'w4' },
  { g: 'Base de datos', id: 'mascotas', t: 'Mascotas', ic: 'wolf_spawn_egg', n: () => D.mascotas.length, d: 'Mascotas de CombatPets y de dónde sale cada una.', w: 'w3' },
  { g: 'Base de datos', id: 'tags', t: 'Tags', ic: 'name_tag', n: () => D.tags.length, d: 'Todos los tags y cómo se consiguen.', w: 'w3' },
  { g: 'Sistemas', id: 'economia', t: 'Economía y MobCoins', ic: 'gold_ingot', d: 'Dónde nace el dinero, dónde muere y cuánto vale cada cosa en MobCoins.', w: 'w6' },
  { g: 'Sistemas', id: 'progresion', t: 'Rankup, playtime y misiones', ic: 'experience_bottle', d: 'Lo que se gana subiendo de rango, jugando horas y haciendo misiones.', w: 'w4' },
  { g: 'Sistemas', id: 'rangos', t: 'Rangos VIP', ic: 'golden_helmet', d: 'Lo que da cada rango, lado a lado.', w: 'w4' },
  { g: 'Sistemas', id: 'combate', t: 'Dificultad y hordas', ic: 'iron_sword', d: 'Cuánto pega cada cosa con cada armadura.', w: 'w4' },
  { g: 'Sistemas', id: 'calamity', t: 'Calamity', ic: 'goat_horn', hot: 'Hardcore', d: 'El mundo hardcore: cordura, Parca, Eclipse, Armisticio, Forja, contratos y Temporada.', w: 'w6' },
  { g: 'Sistemas', id: 'pesca', t: 'Pesca', ic: 'fishing_rod', n: () => D.pesca.peces.length, d: 'Cajas, premios, cañas, carnadas, rangos y torneos de pesca.', w: 'w4' },
  { g: 'Sistemas', id: 'mundo', t: 'Mundo y servicios', ic: 'diamond_pickaxe', d: 'Minions, protecciones, minas y otros servicios.', w: 'w6' },
];
const VI = Object.fromEntries(VIEWS.map((v, i) => [v.id, { ...v, i }]));
const pad = n => String(n).padStart(2, '0');

const nav = $('#nav'), main = $('#main');
{
  let lastG = '';
  nav.innerHTML = VIEWS.map(v => { const h = v.g !== lastG ? `<div class="rail__grp">${v.g}</div>` : ''; lastG = v.g; return h + `<a href="#${v.id}" data-v="${v.id}" data-num="${pad(VI[v.id].i)}"${v.hot ? ` class="hot${v.hotc ? ' ' + v.hotc : ''}"` : ''}>${ico(v.ic)}<span>${v.t}</span>${v.hot ? `<span class="hot__tag">${v.hot}</span>` : ''}${v.n ? `<span class="n">${v.n()}</span>` : ''}</a>`; }).join('') +
    `<div class="rail__foot"><b>Atajos</b><kbd>${MAC ? '⌘' : 'Ctrl'}</kbd> <kbd>K</kbd> o <kbd>/</kbd> para buscar · <kbd>Esc</kbd> para cerrar fichas.</div>`;
  hydrate(nav);
}

// objetos de cada sección para el arte de cabecera del tema Ederus (la guía normal no lo enseña)
const VH_ART = {
  'tl-armaduras': ['netherite_chestplate', 'diamond_helmet', 'golden_leggings', 'iron_boots', 'netherite_helmet', 'diamond_chestplate'],
  'tl-armas': ['netherite_sword', 'bow', 'trident', 'mace', 'crossbow', 'diamond_axe'],
  'tl-anomalias': ['nether_star', 'ender_eye', 'echo_shard', 'wither_rose', 'dragon_breath', 'blaze_rod'],
  cajas: ['tripwire_hook', 'trial_key', 'ominous_trial_key', 'gold_ingot', 'emerald', 'diamond'],
  encantamientos: ['enchanted_book', 'experience_bottle', 'lapis_lazuli', 'book', 'amethyst_shard', 'glowstone_dust'],
  mazmorras: ['ominous_trial_key', 'iron_sword', 'trial_key', 'heavy_core', 'netherite_scrap', 'totem_of_undying'],
  mascotas: ['bone', 'wolf_spawn_egg', 'cat_spawn_egg', 'allay_spawn_egg', 'cookie', 'lead'],
  tags: ['name_tag', 'paper', 'writable_book', 'oak_sign', 'feather', 'ink_sac'],
  economia: ['gold_ingot', 'emerald', 'gold_nugget', 'diamond', 'raw_gold', 'gold_block'],
  progresion: ['experience_bottle', 'clock_00', 'map', 'compass_00', 'writable_book', 'recovery_compass_00'],
  rangos: ['golden_helmet', 'diamond_helmet', 'netherite_helmet', 'nether_star', 'totem_of_undying', 'emerald'],
  combate: ['iron_sword', 'bow', 'arrow', 'golden_apple', 'potion', 'rotten_flesh'],
  calamity: ['goat_horn', 'wither_rose', 'netherite_hoe', 'echo_shard', 'rotten_flesh', 'fire_charge'],
  pesca: ['fishing_rod', 'cod', 'salmon', 'tropical_fish', 'pufferfish', 'nautilus_shell'],
  mundo: ['diamond_pickaxe', 'map', 'oak_sapling', 'wheat', 'bucket', 'iron_ingot'],
};
function head(id, title, p, stats = []) {
  const v = VI[id];
  const art = (VH_ART[id] || []).slice(0, 1).map(ic => `<span class="vh__disco"></span><img alt="" data-id="${ic}" class="vh__obj">`).join('');
  return `<header class="vh" data-v="${id}"><div class="vh__art" aria-hidden="true">${art}</div><nav class="crumbs" aria-label="Migas"><a href="#inicio">EDERUSDEX</a><span>›</span><span>${esc(v.g)}</span><span>›</span><b>${esc(v.t)}</b><em class="upd">Actualizado 31/10/2026</em></nav><h1>${split(title)}</h1>${p ? `<p>${p}</p>` : ''}${stats.length ? `<div class="stats">${stats.map(([k, b]) => `<span class="chip"><i></i>${k} <b>${b}</b></span>`).join('')}</div>` : ''}</header>`;
}
function sect(title, inner, n, sub) {
  return `<section class="sect"><div class="sect__h rv"><h2>${n ? `<small>${n}</small>` : ''}${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${inner}</section>`;
}
function fichas(v) { return (FICHAS[v] || []).length ? sect('Fichas completas', `<div class="plist">${FICHAS[v].join('')}</div>`) : ''; }
const footer = () => `<footer class="foot"><div class="foot__big" aria-hidden="true">EDERUSDEX</div><div class="foot__row"><span>EDERUS · Guía del Survival. Datos sacados de la configuración real del servidor.</span><span><a href="#inicio">Inicio</a> · <a href="guia.html">Guía pública</a> · <a href="#" data-open-search>Buscar</a></span></div></footer>`;

// ---------- tabla
const PAGE = 80;
function table(el, cols, rows, opt = {}) {
  let sortK = opt.sort || null, dir = opt.dir || -1, q = '', re = null, f = {}, limit = PAGE, cur = [];
  const lab = k => (cols.find(c => c.k === k) || {}).l || k;
  const filt = (opt.filters || []).map(k => {
    const vals = [...new Set(rows.map(r => r[k]).filter(v => v != null && v !== ''))].sort((a, b) => typeof a === 'number' ? a - b : String(a).localeCompare(String(b), 'es'));
    return `<span class="sel"><select data-f="${k}" aria-label="${esc(lab(k))}"><option value="">${esc(lab(k))}: todos</option>${vals.map(v => `<option>${esc(v)}</option>`).join('')}</select></span>`;
  }).join('');
  el.classList.add('tbl');
  el.innerHTML = `<div class="bar"><label class="field">${SVG.search}<input type="search" placeholder="Filtrar ${NF.format(rows.length)} filas…" aria-label="Filtrar tabla"></label>${filt}<span class="cnt"></span><button type="button" class="icon-btn" data-csv title="Descargar lo filtrado en CSV">${SVG.dl}CSV</button></div>
  <div class="tw"><table><thead><tr>${cols.map(c => `<th data-k="${c.k}" class="${c.t === 'num' || c.t === 'bar' ? 'num' : ''}" scope="col">${esc(c.l)}${SVG.sortar}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`;
  const tb = $('tbody', el), cnt = $('.cnt', el), tw = $('.tw', el);
  const mx = {}; cols.filter(c => c.t === 'bar').forEach(c => mx[c.k] = max(rows, c.k));
  const sv = (c, r) => c.sv ? c.sv(r) : c.t === 'tier' ? TORD[r[c.k]] || 0 : r[c.k];
  function cell(c, r) {
    const v = r[c.k];
    if (c.render) return c.render(r, re);
    if (c.t === 'bar') return `<div class="bcell"><i style="width:${Math.max(2, (+v || 0) / mx[c.k] * 100)}%"></i><span>${fmt(v)}${v != null && c.u ? c.u : ''}</span></div>`;
    if (c.t === 'tier') return `<span class="pill tier-${esc(v)}">${esc(v)}</span>`;
    if (c.t === 'num') return fmt(v) + (v != null && v !== '' && c.u ? c.u : '');
    return hl(v, re);
  }
  const rowHtml = r => `<tr${opt.onRow ? ' class="clk" tabindex="0"' : ''}>${cols.map(c => `<td class="${c.t === 'num' || c.t === 'bar' ? 'num' : ''}">${cell(c, r)}</td>`).join('')}</tr>`;
  const sentinelIO = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { root: tw, rootMargin: '300px' });
  function more() {
    const from = limit; limit += PAGE * 2;
    const s = $('tr.more', tb); if (s) { sentinelIO.unobserve(s); s.remove(); }
    tb.insertAdjacentHTML('beforeend', cur.slice(from, limit).map(rowHtml).join(''));
    tail(); hydrate(tb);
  }
  function tail() {
    if (cur.length > limit) { tb.insertAdjacentHTML('beforeend', `<tr class="more"><td colspan="${cols.length}">Mostrando ${NF.format(limit)} de ${NF.format(cur.length)} · baja para ver más</td></tr>`); sentinelIO.observe($('tr.more', tb)); }
  }
  function draw() {
    let rs = rows.filter(r => (!q || norm(Object.values(r).filter(x => typeof x !== 'object').join(' ')).includes(q)) && Object.entries(f).every(([k, v]) => !v || String(r[k]) === v));
    if (sortK) {
      const c = cols.find(c => c.k === sortK);
      rs = [...rs].sort((a, b) => { const x = sv(c, a), y = sv(c, b); if (typeof x === 'number' || typeof y === 'number') return ((+x || 0) - (+y || 0)) * dir; return String(x ?? '').localeCompare(String(y ?? ''), 'es') * dir; });
    }
    cur = rs; limit = PAGE; sentinelIO.disconnect();
    tb.innerHTML = rs.length ? rs.slice(0, limit).map(rowHtml).join('') : `<tr class="empty"><td colspan="${cols.length}">Nada coincide con el filtro.</td></tr>`;
    tail();
    cnt.innerHTML = `<b>${NF.format(rs.length)}</b> de ${NF.format(rows.length)}`;
    $$('th', el).forEach(th => th.removeAttribute('aria-sort'));
    if (sortK) { const th = $(`th[data-k="${sortK}"]`, el); if (th) th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending'); }
    hydrate(tb);
  }
  let deb; $('input', el).addEventListener('input', e => { clearTimeout(deb); deb = setTimeout(() => { q = norm(e.target.value.trim()); re = mkRe(q); draw(); }, 90); });
  $$('select', el).forEach(s => s.addEventListener('change', () => { f[s.dataset.f] = s.value; s.classList.toggle('set', !!s.value); draw(); }));
  $$('th', el).forEach(th => th.addEventListener('click', () => { const k = th.dataset.k; dir = sortK === k ? -dir : -1; sortK = k; draw(); }));
  $('[data-csv]', el).addEventListener('click', () => {
    const cell = v => { v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const csv = '﻿' + [cols.map(c => cell(c.l)).join(';'), ...cur.map(r => cols.map(c => cell(typeof r[c.k] === 'number' ? String(r[c.k]).replace('.', ',') : r[c.k])).join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'ederusdex-' + (opt.name || 'tabla') + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(`CSV con ${NF.format(cur.length)} filas descargado`);
  });
  if (opt.onRow) {
    const pick = e => { const tr = e.target.closest('tr.clk'); if (!tr) return; const i = [...tb.children].indexOf(tr); if (cur[i]) opt.onRow(cur[i]); };
    tb.addEventListener('click', pick); tb.addEventListener('keydown', e => { if (e.key === 'Enter') pick(e); });
  }
  el.setFilter = t => { const i = $('input', el); i.value = t; q = norm(t); re = mkRe(q); draw(); };
  draw(); return el;
}

// ---------- tier list
function tierlist(el, items, o) {
  const tiers = o.tiers, groups = o.groups; let q = '', off = new Set(), offT = new Set(), cols = false, first = true;  // Dosa 02/11: «Todo junto» por defecto
  const sorted = [...items].sort((a, b) => o.value(b) - o.value(a));
  const fv = o.fmtv || fmt, tn = t => (o.tierName ? o.tierName(t) : t), tc = t => (o.tierColor ? o.tierColor(t) : TC[t]);
  const rng = t => { const v = sorted.filter(i => i.tier === t).map(o.value); if (!v.length) return 'sin entradas'; const mn = Math.min(...v), mx = Math.max(...v); return mn === mx ? fv(mn) : fv(mn) + ' – ' + fv(mx); };
  const cntT = t => sorted.filter(i => i.tier === t).length;
  el.innerHTML = `<div class="tlbar">
    <div class="tlbar__row"><label class="field">${SVG.search}<input type="search" placeholder="Buscar por nombre…" aria-label="Buscar en la tier list"></label>
      <div class="seg" role="group" aria-label="Columnas"><button type="button" class="on" data-cols="0">Todo junto</button><button type="button" data-cols="1">Por ${esc(o.groupLabel)}</button></div>
      <span class="cnt"></span><button type="button" class="icon-btn reset">${SVG.reset}Restablecer</button></div>
    <div class="tlbar__row"><span class="lab">Tier</span><div class="chips">${tiers.map(t => `<button type="button" class="tchip on${tn(t).length > 2 ? ' largo' : ''}" data-t="${t}" style="--tc:${tc(t)}" aria-pressed="true" title="${cntT(t)} en tier ${tn(t)}">${tn(t)}</button>`).join('')}</div>
      <span class="lab">${esc(o.groupLabel)}</span><div class="chips">${groups.map(g => `<button type="button" class="tg on" data-g="${esc(g)}" aria-pressed="true">${esc(g)} <small>${sorted.filter(i => o.group(i) === g).length}</small></button>`).join('')}</div></div>
  </div><div class="tl"></div>`;
  const tl = $('.tl', el), cnt = $('.cnt', el);
  function card(it, i) {
    const d = document.createElement('div'); d.className = 'tt'; d.tabIndex = 0; d.setAttribute('role', 'button');
    d.dataset.n = norm(it[o.name]); d.dataset.g = o.group(it); d.dataset.id = it.id;
    d.style.setProperty('--c', tc(it.tier)); d.style.setProperty('--i', Math.min(i, 60));
    d.setAttribute('aria-label', `${it[o.name]}, tier ${tn(it.tier)}`);
    if (o.tip) d.dataset.tip = o.tip + ':' + it.id;
    d.innerHTML = `<span class="slot${it.tier === 'EX' ? ' glint' : ''}">${o.icon(it)}</span><span class="nm">${esc(it[o.name])}</span><span class="pw">${o.label ? o.label(it) : fmt(o.value(it))}</span>`;
    d.addEventListener('click', () => o.detail(it)); d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.detail(it); } });
    return d;
  }
  function render() {
    const gs = cols ? groups : ['Todos'];
    tl.style.setProperty('--nc', gs.length); tl.classList.toggle('one', !cols);
    tl.innerHTML = `<div class="tl-scroll"><div class="tl-grid">${cols ? `<div class="tl-cols"><div>Tier</div>${gs.map(g => `<div>${esc(g)}</div>`).join('')}</div>` : ''}
      ${tiers.map(t => `<div class="tl-row" data-t="${t}" style="--tc:${tc(t)}"><div class="tl-t${tn(t).length > 2 ? ' largo' : ''}"><b>${tn(t)}</b><small>${o.rng ? o.rng(t) : rng(t)}</small><span>${cntT(t)}</span></div>${gs.map(g => `<div class="tl-c" data-t="${t}" data-g="${esc(g)}"></div>`).join('')}</div>`).join('')}</div></div>`;
    sorted.forEach((it, i) => { const c = tl.querySelector(`.tl-c[data-t="${it.tier}"][data-g="${CSS.escape(cols ? o.group(it) : 'Todos')}"]`); if (c) c.appendChild(card(it, i)); });
    apply(); hydrate(tl);
    if (!first) tl.classList.add('is-in'); first = false;
  }
  function apply() {
    $$('.tt', tl).forEach(t => t.classList.toggle('hide', !!(q && !t.dataset.n.includes(q)) || off.has(t.dataset.g)));
    let n = 0;
    $$('.tl-row', tl).forEach(r => {
      const vis = $$('.tt:not(.hide)', r).length;
      r.hidden = offT.has(r.dataset.t) || (!vis && !!(q || off.size));
      if (!r.hidden) n += vis;
    });
    cnt.innerHTML = `<b>${n}</b> de ${sorted.length}`;
  }
  $('input', el).addEventListener('input', e => { q = norm(e.target.value.trim()); apply(); });
  $$('.tg[data-g]', el).forEach(b => b.addEventListener('click', () => { const g = b.dataset.g, on = b.classList.toggle('on'); b.setAttribute('aria-pressed', on); on ? off.delete(g) : off.add(g); apply(); }));
  $$('.tchip', el).forEach(b => b.addEventListener('click', () => { const t = b.dataset.t, on = b.classList.toggle('on'); b.setAttribute('aria-pressed', on); on ? offT.delete(t) : offT.add(t); apply(); }));
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { cols = b.dataset.cols === '1'; $$('.seg button', el).forEach(x => x.classList.toggle('on', x === b)); render(); }));
  $('.reset', el).addEventListener('click', () => { q = ''; off.clear(); offT.clear(); $('input', el).value = ''; $$('.tg[data-g],.tchip', el).forEach(b => { b.classList.add('on'); b.setAttribute('aria-pressed', true); }); apply(); });
  render();
}

// ---------- guía de Calamity: temas por categorías (assets/calamity.html, sale de tools/importar_calamity.py)
let calP = null;
function cargarCalamity() {
  const v = (($('script[src*="codice.js"]') || {}).src || '').split('v=')[1] || '1';
  return calP || (calP = fetch((($('script[src*="codice.js"]') || {}).src || 'assets/').replace(/codice\.js.*$/, '') + 'calamity.html?v=' + v).then(r => { if (!r.ok) throw r.status; return r.text(); }).then(html => {
    const box = document.createElement('div'); box.innerHTML = html;
    const st = document.createElement('style'); st.id = 'cal-css'; st.textContent = $('style', box).textContent; document.head.appendChild(st);
    const C = JSON.parse($('#cal-temas', box).textContent);
    C.html = Object.fromEntries($$('template[data-tema]', box).map(t => [t.dataset.tema, t.innerHTML]));
    C.fichas = $('#cal-fichas', box).innerHTML;
    C.js = $$('script[data-cal-js]', box).map(x => x.textContent);
    C.byId = Object.fromEntries(C.temas.map(t => [t.id, t])); C.cat = Object.fromEntries(C.cats.map(c => [c.id, c]));
    return C;
  }).catch(e => { calP = null; throw e; }));
}
function calCat(id) {
  closeDrawer(); const s = $('#calx-' + id); if (s) s.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' });
}
// NPCs de Calamity: retrato nítido en marco sólido con el color de cada uno (Dosa 02/11: nada de fondos difuminados)
function npcLis(C) {
  if (!C.npcLi) { const t = document.createElement('template'); t.innerHTML = C.html['quien-es-quien']; C.npcLi = Object.fromEntries($$('.npcs > li', t.content).map(li => [$('.nom', li).textContent, li])); }
  return C.npcLi;
}
function npcGaleria(C) {
  const L = npcLis(C);
  return `<div class="npcs-x">${C.npcs.map((n, i) => `<button type="button" class="npc rv" style="--tono:${n.tono};--d:${(i % 5) * 50}ms" data-npc="${esc(n.n)}">
    <span class="npc__img"><img src="${L[n.n] ? $('img', L[n.n]).getAttribute('src') : ''}" alt="" width="110" height="166"></span>
    <span class="npc__txt"><span class="npc__rol">${esc(n.rol)}</span><b class="npc__n">${esc(n.n)}</b><span class="npc__hace">${n.hace}</span></span></button>`).join('')}</div>`;
}
function calNpc(nom) {
  cargarCalamity().then(C => {
    const n = C.npcs.find(x => x.n === nom), li = npcLis(C)[nom]; if (!n) return;
    openDrawer({ kind: 'Calamity · NPC del spawn', title: n.n, art: `<img src="${$('img', li).getAttribute('src')}" alt="" style="height:78%;image-rendering:pixelated">`, color: n.tono,
      sub: `<span class="pill" style="background:${n.tono};color:#000">${esc(n.rol)}</span>`,
      extra: `<div id="p-calamity" class="calx-dr"><div class="hoja"><p class="npc-dr__hace">${n.hace}</p><h4>Lo que te ofrece</h4><ul class="npc-dr__menu">${n.menu.map(m => `<li>${m}</li>`).join('')}</ul><h4>Su skin</h4><ul class="npcs npc-dr__3d">${li.outerHTML}</ul>${C.fichas}</div></div>` });
    C.js.forEach(code => { try { new Function(code)(); } catch (e) { console.warn('[calamity]', e); } });
    hydrate(dr);
  });
}
function calTema(id) {
  cargarCalamity().then(C => {
    const t = C.byId[id]; if (!t) return;
    openDrawer({ kind: 'Calamity · ' + C.cat[t.cat].t, title: t.t, art: ico(t.ic, null, 1), color: 'var(--cal-sangre)', link: 'calamity/' + t.id, wide: true,
      extra: `<div id="p-calamity" class="calx-dr"><div class="hoja">${C.html[id]}${C.fichas}</div></div>` });
    C.js.forEach(code => { try { new Function(code)(); } catch (e) { console.warn('[calamity]', e); } });
    hydrate(dr);
    $$('[data-cat]', dr).forEach(a => a.addEventListener('click', e => { e.preventDefault(); calCat(a.dataset.cat); }));
  });
}
// ---------- panel de premios de una caja (pesca o crate): cada premio con su icono, probabilidad, lore y enlace
const RAR_C = { Único: 'var(--rar-unico)', Inmortal: 'var(--rar-inmortal)', Ancestral: 'var(--rar-ancestral)', Mítico: 'var(--rar-mitico)', Legendario: 'var(--rar-legendario)', Épico: 'var(--rar-epico)', Raro: 'var(--rar-raro)', Común: 'var(--rar-comun)' };
const RAR_T = { Común: 'D', 'Poco común': 'C', Raro: 'B', Épico: 'A', Legendario: 'S', Mítico: 'EX', Ancestral: 'EX', Inmortal: 'EX', Único: 'A' };
// Dosa 02/11: cuadrícula de casillas (sin halo) y el lore en el recuadro al pasar el ratón
let PZX = null;
function premioCelda(f, i) {
  return `<button type="button" class="pzc${f.r === 'Único' ? ' unico' : ''}" data-tip="p:${i}"${f.go ? ` data-go="${esc(f.go)}"` : ''}><span class="slot pzc__slot">${f.img ? `<span class="ic lg"><img alt="" src="${f.img}"></span>` : ico(f.ic, null, 1)}${f.q ? `<b class="pz__q">${esc(f.q)}</b>` : ''}</span>
    <b class="pzc__n" style="${f.c ? `color:${f.c}` : ''}">${f.nh ? rt(f.nh) : esc(f.n)}</b>${f.r ? `<span class="pzc__r" style="--rc:${RAR_C[f.r] || 'var(--mc-7)'}">${esc(f.r)}</span>` : ''}<span class="pzc__p">${fmt(f.p)} %</span></button>`;
}
// texto original de Minecraft: tramos [texto, color, banderas] (1 negrita, 2 cursiva, 4 subrayado, 8 tachado)
const rt = runs => (runs || []).map(([t, c, fl]) => { const st = (c ? `color:#${c};` : '') + (fl & 1 ? 'font-weight:700;' : '') + (fl & 2 ? 'font-style:italic;' : '') + (fl & 12 ? `text-decoration:${fl & 4 ? 'underline ' : ''}${fl & 8 ? 'line-through' : ''};` : ''); return st ? `<span style="${st}">${esc(t)}</span>` : esc(t); }).join('');
function premioTip(f) {
  const lin = (cls, xs) => xs && xs.length ? xs.filter(x => String(x).trim()).map(x => `<span class="${cls}">${esc(x)}</span>`).join('') : '';
  return `<span class="t" style="color:${f.c || 'var(--blanco)'}">${f.nh ? rt(f.nh) : esc(f.n)}${f.q ? ` ×${esc(f.q)}` : ''}</span><span class="sub">${esc(f.t || '')}${f.r ? `${f.t ? ' · ' : ''}<b style="color:${RAR_C[f.r] || 'inherit'};font-weight:700">${esc(f.r)}</b>` : ''}</span>
    ${f.lh ? `<span class="pt-lore">${f.lh.map(l => `<span class="pt-lh">${l.length ? rt(l) : '&nbsp;'}</span>`).join('')}</span>` : lin('pt-l', f.l)}${lin('pt-e', f.e)}${f.st ? f.st.map(([k, v]) => r(k, v)).join('') : ''}${f.fl ? `<span class="pt-fl">«${esc(f.fl)}»</span>` : ''}
    ${f.in ? `<span class="pt-h">Trae</span>${f.in.map(([ic, q, n]) => `<span class="pt-in">${q && q !== '1' ? q + '× ' : ''}${esc(n || String(ic).replace(/_/g, ' '))}</span>`).join('')}` : ''}
    ${r('Probabilidad', fmt(f.p) + ' %')}${PZX && PZX.extra ? r('Por captura', PZX.extra(f)) : ''}${f.go ? '<span class="l">Clic para ver su ficha</span>' : ''}`;
}
function openPremios(o) {
  // Dosa 02/11: primero las únicas (borde blanco), luego de la rareza más alta a la más baja; dentro, de la más rara a la más probable
  const ORD = { Único: 0, Inmortal: 1, Ancestral: 2, Mítico: 3, Legendario: 4, Épico: 5, Raro: 6, 'Poco común': 7, Común: 8 };
  const L = [...(o.lista || [])].sort((a, b) => (ORD[a.r] ?? 9) - (ORD[b.r] ?? 9) || a.p - b.p); PZX = o; BYID.p = new Map(L.map((f, i) => [String(i), f]));
  openDrawer({ kind: o.kind, title: o.title, art: ico(o.ic, null, 1), color: o.color, wide: true, link: o.link, sub: o.sub,
    extra: `<div class="pz-wrap"><label class="field pz-f">${SVG.search}<input type="search" placeholder="Buscar entre ${L.length} premios…" aria-label="Buscar premio"></label>
      <p class="mut sm pz-ayuda">Pasa el ratón por un premio para ver su lore. Primero las únicas (borde blanco) y después de la rareza más alta a la más baja.</p>
      <div class="pz-grid">${L.map(premioCelda).join('')}</div></div>` });
  hydrate(dr);
  const q = $('.pz-f input', dr), cells = $$('.pzc', dr);
  q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); cells.forEach((a, i) => { a.hidden = v && !JSON.stringify(L[i]).toLowerCase().includes(v); }); });
  cells.forEach((a, i) => a.addEventListener('click', () => {
    if (a.dataset.go) { closeDrawer(); setTimeout(() => { location.hash = a.dataset.go; }, 60); return; }
    if (matchMedia('(hover: none)').matches) {  // en el móvil, tocar enseña el recuadro
      const b = a.getBoundingClientRect(); mctip.innerHTML = premioTip(L[i]); mctip.classList.add('on'); tipEl = a;
      placeTip({ clientX: Math.min(b.left, innerWidth - mctip.offsetWidth - 26), clientY: b.bottom + 14 });
    }
  }));
}
// ---------- ficha (drawer)
const dr = $('#dr'), scrim = $('#scrim'); let drBack = null, drView = null;
function openDrawer(o) {
  drBack = document.activeElement;
  dr.classList.toggle('wide', !!o.wide); dr.style.setProperty('--c', o.color || 'var(--azure)');
  const bars = (o.bars || []).map(([l, v, m, txt, sub], i) => `<div class="sb" style="--i:${i}"><div class="sb__l"><span>${l}</span><span><b>${txt ?? fmt(v)}</b>${sub ? `<small>${sub}</small>` : ''}</span></div><div class="sb__t"><i style="width:${Math.max(1.5, Math.min(100, (+v || 0) / m * 100))}%"></i></div></div>`).join('');
  const acts = [o.link ? `<button type="button" class="icon-btn" data-act="link">${SVG.link}Copiar enlace</button>` : '', o.compare ? `<button type="button" class="icon-btn" data-act="cmp">${SVG.cmp}${cmpHas(o.compare) ? 'En el comparador' : 'Añadir al comparador'}</button>` : ''].join('');
  dr.innerHTML = `<div class="dr__hero"><div class="dr__bar"><span class="eyebrow">${esc(o.kind)}</span><button class="dr__x" type="button" aria-label="Cerrar ficha">${SVG.x}</button></div>
    <div class="dr__id"><div class="dr__art">${o.art}</div><div><h2 id="dr-title">${esc(o.title)}</h2><p>${o.sub || ''}</p></div></div></div>
    <div class="dr__body">${acts ? `<div class="dr__acts">${acts}</div>` : ''}${bars ? `<div><h4>Estadísticas · frente al máximo de la lista</h4><div class="statbars">${bars}</div></div>` : ''}
    ${o.kv && o.kv.length ? `<div><h4>Ficha</h4><div class="dkv">${o.kv.map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div></div>` : ''}${o.extra || ''}</div>`;
  hydrate(dr);
  dr.classList.add('on'); scrim.classList.add('on'); dr.scrollTop = 0; $('.dr__body', dr).scrollTop = 0;
  document.documentElement.style.overflow = 'hidden'; document.documentElement.classList.add('dr-open');
  $('.dr__x', dr).onclick = closeDrawer;
  const l = $('[data-act=link]', dr); if (l) l.onclick = () => { const u = location.href.split('#')[0] + '#' + o.link; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('Enlace copiado'), () => prompt('Copia el enlace:', u)); };
  const c = $('[data-act=cmp]', dr); if (c) c.onclick = () => { cmpAdd(o.compare); c.innerHTML = SVG.cmp + 'En el comparador'; };
  if (o.link) { drView = o.link.split('/')[0]; history.replaceState(null, '', '#' + o.link); }
  setTimeout(() => $('.dr__x', dr).focus({ preventScroll: true }), 50);
}
function closeDrawer() {
  if (!dr.classList.contains('on')) return;
  dr.classList.remove('on'); scrim.classList.remove('on'); document.documentElement.style.overflow = ''; document.documentElement.classList.remove('dr-open');
  if (drView && location.hash.includes('/')) history.replaceState(null, '', '#' + drView);
  drView = null; if (drBack && drBack.focus) drBack.focus({ preventScroll: true });
}
scrim.addEventListener('click', closeDrawer);
// cerrar arrastrando hacia abajo en móvil
{ let y0 = null; dr.addEventListener('touchstart', e => { if (e.target.closest('.dr__hero')) y0 = e.touches[0].clientY; }, { passive: true });
  dr.addEventListener('touchend', e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 80) closeDrawer(); y0 = null; }, { passive: true }); }

const MX = {};
const mxA = () => MX.a || (MX.a = { poder: max(D.armaduras, 'poder'), armadura: max(D.armaduras, 'armadura'), dureza: max(D.armaduras, 'dureza'), vida: max(D.armaduras, 'vida') });
const mxW = () => MX.w || (MX.w = { poder: max(D.armas, 'poder'), dano: max(D.armas, 'dano'), max: max(D.armas, 'max'), media: max(D.armas, 'media') });
const mxN = () => MX.n || (MX.n = { vida: max(D.anomalias, 'vida'), dano_real: max(D.anomalias, 'dano_real'), dificultad: max(D.anomalias, 'dificultad') });
const rankOf = (list, it, k) => [...list].sort((a, b) => b[k] - a[k]).indexOf(it) + 1;

function setDetail(s) {
  const m = mxA();
  openDrawer({ kind: 'Armadura · ' + s.origen, title: s.nombre, art: ico(s.icon, s.dye, 1), color: s.col || TC[s.tier], link: 'tl-armaduras/' + s.id, compare: { kind: 'a', it: s },
    sub: `<span class="pill tier-${s.tier}">${s.tier}</span> Puesto ${rankOf(D.armaduras, s, 'poder')} de ${D.armaduras.length} por poder`,
    bars: [['Poder', s.poder, m.poder], ['Armadura', s.armadura, m.armadura], ['Dureza', s.dureza, m.dureza], ['Vida extra', s.vida, m.vida]],
    kv: [['Origen', esc(s.origen)], ['Tier', `<span class="pill tier-${s.tier}">${s.tier}</span>${fmt(s.poder)}`], ['Piezas', fmt((s.piezas || []).length)], ['Id', esc(s.id)]],
    extra: (s.fig ? `<div><h4>Puesta</h4><div class="fig"><img alt="${esc(s.nombre)} puesta, de frente" src="${s.fig}"></div></div>` : '') + (s.piezas && s.piezas.length ? `<div><h4>Piezas</h4><div class="pieces">${s.piezas.map((p, i) => `<div class="pc" style="--i:${i}">${ico(p.m, p.d)}<span><b>${esc(p.n)}</b><small>${fmt(p.a)} arm · ${fmt(p.t)} dur · +${fmt(p.v)} vida</small></span></div>`).join('')}</div></div>` : '') });
}
function armaDetail(a) {
  const m = mxW();
  openDrawer({ kind: 'Arma · ' + a.clase, title: a.nombre, art: ico(a.icon, null, 1), color: a.col || TC[a.tier], link: 'tl-armas/' + a.id, compare: { kind: 'w', it: a },
    sub: `<span class="pill tier-${a.tier}">${a.tier}</span> Puesto ${rankOf(D.armas, a, 'poder')} de ${D.armas.length} por poder`,
    bars: [['Poder', a.poder, m.poder], ['Daño normal', a.dano, m.dano], ['Daño crítico', a.max, m.max], ['Daño medio', a.media, m.media], ['Prob. de crítico', a.critico, 100, a.critico + ' %']],
    kv: [['Clase', esc(a.clase)], ['Origen', esc(a.origen)], ['Tier', `<span class="pill tier-${a.tier}">${a.tier}</span>${fmt(a.poder)}`], ['Id', esc(a.id)]] });
}
function anDetail(a) {
  const N = a.dano || 1, x = v => v == null ? '—' : fmt(Math.round(v * 10) / 10), m = mxN();
  const rng = (h, k) => h.mn == null ? '<span class="mut">sin golpe directo</span>' : h.mn >= 1000 ? '<b>letal</b>' : (h.mn === h.mx ? x(h.mn * h.m * k) : x(h.mn * h.m * k) + '–' + x(h.mx * h.m * k));
  const rows = (a.habs || []).map(h => `<tr${h.act ? '' : ' class="off"'}><td><b>${esc(h.n)}</b>${h.act ? '' : ' <span class="mut">(apagada)</span>'}<div class="mut sm">${esc(h.desc)}${h.nota ? ' · <i>' + esc(h.nota) + '</i>' : ''}</div></td><td>${h.f ? h.f : 'Todas'}</td><td class="n">${fmt(h.cd)} s</td><td class="n">${h.m === 1 ? '—' : '×' + fmt(h.m)}</td><td class="n">${rng(h, 1)}</td><td class="n hx">${rng(h, N)}</td></tr>`).join('');
  const tab = a.habs && a.habs.length ? `<div><h4>Habilidades · daño por golpe</h4><p class="mut sm" style="margin:0 0 10px">×1 = valor de diseño del código (nivel 1). ×${fmt(N)} = con el multiplicador de su ficha, que es lo que pega hoy en el Survival. Daño antes de armadura y en la fase 1 (las fases altas suben entre un 10 % y un 60 %).</p><div class="ht-wrap"><table class="ht"><thead><tr><th>Habilidad</th><th>Fase</th><th class="n">Recarga</th><th class="n">Ajuste</th><th class="n">×1</th><th class="n">×${fmt(N)}</th></tr></thead><tbody>${rows}</tbody></table></div></div>` : '<p class="mut sm">Esta anomalía no tiene lista de habilidades en el código de EDM.</p>';
  openDrawer({ kind: 'Anomalía · ' + a.clase, title: a.nombre, art: face(a), color: TC[a.tier], link: 'tl-anomalias/' + a.id, wide: true,
    sub: `<span class="pill tier-${a.tier}">${a.tier}</span> Puesto ${rankOf(D.anomalias, a, 'dificultad')} de ${D.anomalias.length} por puntuación`,
    bars: [['Vida', a.vida, m.vida, fmt(a.vida), a.vida_base ? `${fmt(a.vida_base)} ×${fmt(a.vida_x)}` : ''], ['Daño medio por golpe', a.dano_real, m.dano_real, x(a.dano_real), `${x(a.dano_base)} ×${fmt(N)}`], ['Puntuación', a.dificultad, m.dificultad]],
    kv: [['Clase', esc(a.clase)], ['Tier', `<span class="pill tier-${a.tier}">${a.tier}</span>${fmt(a.dificultad)}`], ['Vida', a.vida_base ? `${fmt(a.vida_base)} → ${fmt(a.vida)}` : fmt(a.vida)], ['Daño medio', `${x(a.dano_base)} → ${x(a.dano_real)}`], ['Bioma', esc(a.bioma)], ['MobCoins por participante', fmt(a.mobcoins)], ['Experiencia', fmt(a.exp)], ['Objetos en su botín', fmt(a.botin)], ['Habilidades', fmt(a.habilidades)]],
    extra: tab });
}
// Ficha de un encantamiento (Dosa 01/11): cada libro con su nivel, lo que da y su nombre en inglés
// colores de cada tier en AdvancedEnchantments (groups.yml → global-color): los mismos que los libros en el juego
const AE_C = { Simple: '#AAAAAA', Único: '#55FF55', Elite: '#55FFFF', Supremo: '#FFFF55', Legendario: '#FFAA00', Ancestral: '#FF55FF' };
const ENC_TC = { Simple: 'D', Único: 'C', Elite: 'B', Supremo: 'A', Legendario: 'S', Ancestral: 'EX' };
const ROM = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
function encDetail(e) {
  const t = ENC_TC[e.tier] || 'D';
  const libros = (e.lv || []).map((l, i) => `<div class="book" style="--i:${i}"><span class="slot${t === 'EX' ? ' glint' : ''}">${ico('enchanted_book')}</span><div><b>${esc(e.nombre)} ${ROM(l.n)}</b><small>${esc(e.en)} ${ROM(l.n)}</small>
    <dl>${l.filas.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div></div>`).join('');
  openDrawer({ kind: 'Encantamiento · ' + e.tier, title: e.nombre, art: ico('enchanted_book', null, 1), color: AE_C[e.tier] || TC[t], link: 'encantamientos/' + e.id,
    sub: `<span class="pill tier-${t}">${esc(e.tier)}</span> En inglés: <b>${esc(e.en)}</b>`,
    kv: [['Nombre en inglés', esc(e.en)], ['Tier', `<span class="pill tier-${t}">${esc(e.tier)}</span>`], ['Para', esc(e.para)], ['Niveles', fmt(e.niveles)]],
    extra: (e.desc ? `<div><h4>Qué hace</h4><p class="encdesc">${esc(e.desc)}</p></div>` : '') + (libros ? `<div><h4>Libros por nivel</h4><div class="books">${libros}</div></div>` : '') });
}
const PZOPEN = {
  cajas: id => { const b = $(`.pzcard[data-caja="${CSS.escape(id)}"]`); if (b) b.click(); },
  pesca: id => { const v = built.pesca; if (v && v.pescaZona) v.pescaZona(id.startsWith('calamity-') ? 'calamity' : 'normal'); const b = $(`.pzcard[data-tier="${CSS.escape(id.replace(/^calamity-/, ''))}"]`); if (b) b.click(); },
};
const FIND = { encantamientos: [() => D.encantamientos, encDetail], 'tl-armaduras': [() => D.armaduras, setDetail], 'tl-armas': [() => D.armas, armaDetail], 'tl-anomalias': [() => D.anomalias, anDetail] };

// ---------- comparador
const tray = $('#tray'), cmpEl = $('#cmp'); const CMP = { kind: null, items: [] };
const CMPDEF = {
  a: { t: 'armaduras', rows: [['Poder', 'poder'], ['Armadura', 'armadura'], ['Dureza', 'dureza'], ['Vida extra', 'vida']], ico: s => ico(s.icon, s.dye, 1), detail: setDetail },
  w: { t: 'armas', rows: [['Poder', 'poder'], ['Daño normal', 'dano'], ['Daño crítico', 'max'], ['Daño medio', 'media'], ['Prob. de crítico', 'critico', ' %']], ico: a => ico(a.icon, null, 1), detail: armaDetail }
};
const cmpHas = c => CMP.kind === c.kind && CMP.items.includes(c.it);
function cmpAdd(c) {
  if (CMP.kind && CMP.kind !== c.kind) { CMP.items = []; toast('Comparador reiniciado: solo se comparan ' + CMPDEF[c.kind].t + ' entre sí'); }
  CMP.kind = c.kind;
  if (CMP.items.includes(c.it)) { toast('Ya está en el comparador'); return; }
  if (CMP.items.length >= 4) CMP.items.shift();
  CMP.items.push(c.it); drawTray(); if (CMP.items.length === 1) toast('Añade otro para comparar');
}
function drawTray() {
  if (!CMP.items.length) { tray.classList.remove('on'); CMP.kind = null; return; }
  const d = CMPDEF[CMP.kind];
  tray.innerHTML = `<span class="tray__k">Comparar ${d.t}</span><div class="tray__items">${CMP.items.map((it, i) => `<button type="button" class="tray__it" data-i="${i}" title="Quitar ${esc(it.nombre)}">${d.ico(it)}</button>`).join('')}</div><button type="button" class="btn btn--p" data-go ${CMP.items.length < 2 ? 'disabled style="opacity:.5;pointer-events:none"' : ''}>${SVG.cmp}Comparar ${CMP.items.length}</button><button type="button" class="dr__x" data-clear aria-label="Vaciar comparador">${SVG.x}</button>`;
  hydrate(tray); tray.classList.add('on');
}
tray.addEventListener('click', e => {
  const it = e.target.closest('.tray__it'); if (it) { CMP.items.splice(+it.dataset.i, 1); drawTray(); return; }
  if (e.target.closest('[data-clear]')) { CMP.items = []; drawTray(); return; }
  if (e.target.closest('[data-go]')) openCmp();
});
function openCmp() {
  const d = CMPDEF[CMP.kind], its = CMP.items;
  const cells = d.rows.map(([l, k, u]) => { const m = Math.max(...its.map(i => +i[k] || 0), 1); return `<div class="lb">${l}</div>` + its.map(i => `<div class="vl${(+i[k] || 0) === m ? ' best' : ''}"><span>${fmt(i[k])}${u || ''}</span><i style="width:${(+i[k] || 0) / m * 100}%"></i></div>`).join(''); }).join('');
  cmpEl.innerHTML = `<div class="cmp__box"><div class="cmp__h"><span class="eyebrow">Comparador</span><h2>${its.length} ${d.t} frente a frente</h2><button type="button" class="dr__x" aria-label="Cerrar comparador">${SVG.x}</button></div>
  <div class="cmp__cols" style="--n:${its.length}"><div></div>${its.map((i, n) => `<div class="hd">${d.ico(i)}<b>${esc(i.nombre)}</b><span class="pill tier-${i.tier}">${i.tier}</span></div>`).join('')}${cells}</div>
  <p class="mut sm" style="margin:16px 0 0">★ el mejor valor de cada fila.</p></div>`;
  hydrate(cmpEl); cmpEl.classList.add('on'); $('.dr__x', cmpEl).onclick = closeCmp; $('.dr__x', cmpEl).focus();
}
const closeCmp = () => cmpEl.classList.remove('on');
cmpEl.addEventListener('click', e => { if (e.target === cmpEl) closeCmp(); });

// respuestas rápidas de la portada (todo calculado de los datos)
function answers() {
  const top = (arr, k) => arr.reduce((m, x) => (+x[k] || 0) > (+m[k] || 0) ? x : m, arr[0]);
  const bestOf = o => { const l = D.armaduras.filter(s => s.origen === o); return l.length ? top(l, 'poder') : null; };
  const cajaD = top(D.cajas, 'ev_dinero'), cajaM = top(D.cajas, 'ev_mc'), anMC = top(D.anomalias, 'mobcoins'), mob = top(D.mc_drops, 'media');
  const rara = D.premios.reduce((m, x) => x.pct < m.pct ? x : m, D.premios[0]);
  const vip = bestOf('VIP'), caj = bestOf('Cajas y eventos'), cal = bestOf('Calamity');
  const A = [
    ['¿Qué caja da más dinero por llave?', cajaD.caja, fmt(cajaD.ev_dinero) + ' de media', ico('trial_key'), '#cajas'],
    ['¿Y más MobCoins por llave?', cajaM.caja, fmt(cajaM.ev_mc) + ' MC de media', ico('ominous_trial_key'), '#cajas'],
    ['¿Qué anomalía da más MobCoins?', anMC.nombre, fmt(anMC.mobcoins) + ' MC por participante', face(anMC), '#tl-anomalias/' + anMC.id],
    ['¿Qué mob suelta más MobCoins?', mobName(mob.mob), fmt(mob.media) + ' MC por muerte', eggOf(mob.mob), '#economia'],
    vip && ['¿Mejor set de origen VIP?', vip.nombre, fmt(vip.poder) + ' de poder', ico(vip.icon, vip.dye), '#tl-armaduras/' + vip.id],
    caj && ['¿Mejor set de cajas y eventos?', caj.nombre, fmt(caj.poder) + ' de poder', ico(caj.icon, caj.dye), '#tl-armaduras/' + caj.id],
    cal && ['¿Mejor set de Calamity?', cal.nombre, fmt(cal.poder) + ' de poder', ico(cal.icon, cal.dye), '#tl-armaduras/' + cal.id],
    ['¿El premio más difícil de sacar?', rara.premio, `${fmt(rara.pct)} % en ${rara.caja}`, tag(fmt(rara.pct) + '%'), '#cajas--' + encodeURIComponent(rara.premio)],
  ].filter(Boolean);
  return A.map(([q, a, v, i, h]) => `<a class="ans" href="${h}"><span class="slot">${i}</span><span class="ans__t"><small>${esc(q)}</small><b>${esc(a)}</b><em>${esc(v)}</em></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a>`).join('');
}
// ---------- constructores de vistas
const tierStats = (list, tiers) => tiers.map(t => [`Tier ${t}`, list.filter(x => x.tier === t).length]).filter(x => x[1]);
const B = {
  inicio(el) {
    const topA = [...D.armaduras].sort((a, b) => b.poder - a.poder), topW = [...D.armas].sort((a, b) => (b.tier === 'EX') - (a.tier === 'EX') || b.poder - a.poder), topN = [...D.anomalias].sort((a, b) => b.dificultad - a.dificultad);
        const total = D.armaduras.length + D.armas.length + D.anomalias.length + D.premios.length + D.encantamientos.length + D.mascotas.length + D.tags.length + D.jefes.length;
    const word = [...'EDERUSDEX'].map((ch, i) => `<span style="--i:${i}"${i > 5 ? ' class="az"' : ''}>${ch}</span>`).join('');
    const slot = (kind, it, art, v) => `<button type="button" class="slot${it.tier === 'EX' ? ' glint' : ''}" data-tip="${kind}:${esc(it.id)}" data-go="${v}/${esc(it.id)}" aria-label="${esc(it.nombre)}, tier ${it.tier}">${art}<span class="q">${it.tier}</span></button>`;
    const inv = topA.slice(0, 9).map(s => slot('a', s, ico(s.icon, s.dye), 'tl-armaduras')).join('') + topW.slice(0, 9).map(a => slot('w', a, ico(a.icon), 'tl-armas')).join('') + topN.slice(0, 9).map(a => slot('n', a, face(a), 'tl-anomalias')).join('');
    const mq = [...topA.slice(0, 10).map(s => ({ v: 'tl-armaduras', it: s, i: ico(s.icon, s.dye) })), ...topW.slice(0, 8).map(a => ({ v: 'tl-armas', it: a, i: ico(a.icon) })), ...topN.slice(0, 6).map(a => ({ v: 'tl-anomalias', it: a, i: face(a), val: '♥ ' + fmtK(a.vida) }))];
    const mqHtml = mq.map(m => `<button type="button" class="mq-item" data-go="${m.v}/${esc(m.it.id)}">${m.i}${esc(m.it.nombre)}<span class="pill tier-${m.it.tier}">${m.it.tier}</span><span>${m.val || fmt(m.it.poder)}</span></button>`).join('');
    const champ = (kind, it, val, unit, art, v, tk, rank = 'Nº 1') => `<button type="button" class="champ" style="--c:${TC[it.tier]}" data-go="${v}/${esc(it.id)}" data-tip="${tk}:${esc(it.id)}"><div class="champ__top"><span class="champ__k">${kind}</span><span class="champ__rank">${rank}</span></div><div class="champ__art${it.tier === 'EX' ? ' glint' : ''}">${art}</div><div><h3>${esc(it.nombre)}</h3><div class="champ__v"><b>${val}</b>${unit} <span class="pill tier-${it.tier}">${it.tier}</span></div></div></button>`;
    let lastG = '', n = 0;
    const toc = VIEWS.filter(v => v.id !== 'inicio').map(v => { const g = v.g !== lastG ? `<div class="grp">${v.g}</div>` : ''; lastG = v.g; n++;
      return g + `<a href="#${v.id}"><span class="no">${pad(n)}</span><span class="slot">${ico(v.ic)}</span><h3>${v.t}</h3><p>${v.d}</p><span class="ct">${v.n ? NF.format(v.n()) + ' entradas' : 'Sistema'}</span><svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a>`; }).join('');
    el.innerHTML = `<section class="mast">
      <div class="mast__rule"><span class="live"><b>Datos del servidor</b> · 31/10/2026</span><span>Ederus · Survival</span><span>${NF.format(total)} fichas</span><span>Edición pública</span></div>
      <div class="mast__word"><h1 aria-label="EDERUSDEX">${word}</h1></div>
      <div class="mast__grid">
        <div class="mast__lead"><p>La guía del Survival de Ederus, medida al detalle: qué equipo pega más, qué jefe aguanta más y cuánto vale cada cosa.</p>
          ${PUB ? '<small>Equipo, jefes, cajas, economía y rangos del Survival a 31/10/2026, sacados de la configuración real. Toca cualquier objeto para ver su ficha.</small>' : ''}
          <div class="mast__cta"><a class="btn btn--p" href="#tl-armaduras">Ver las tier lists ${SVG.arrow}</a><button type="button" class="btn" data-open-search>${SVG.search.replace('stroke-width="2"', 'stroke="currentColor" stroke-width="2.5"')}Buscar <kbd>${MAC ? '⌘' : 'Ctrl'} K</kbd></button></div></div>
        <div class="mast__inv"><div class="inv-h"><span><b>Inventario de élite</b> · lo mejor de cada lista</span><span>Fila 1 armaduras · 2 armas · 3 anomalías</span></div>
          <div class="inv">${inv}</div><div class="inv-note">Pasa el ratón por una casilla para ver sus estadísticas. Haz clic para abrir la ficha.</div></div>
      </div></section>
    <div class="marquee" aria-label="Lo más fuerte del Survival"><div class="marquee__track">${mqHtml}${mqHtml.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ')}</div></div>
    ${sect('Respuestas rápidas', `<div class="answers rv">${answers()}</div>`, '§0', 'Lo que más se pregunta, sacado de los datos. Toca para ir.')}
    ${sect('El número uno', `<div class="podium rv">${champ('Armadura · evento', topA[0], fmt(topA[0].poder), 'de poder', ico(topA[0].icon, topA[0].dye, 1), 'tl-armaduras', 'a')}${(v => v && v !== topA[0] ? champ('Armadura · fija', v, fmt(v.poder), 'de poder', ico(v.icon, v.dye, 1), 'tl-armaduras', 'a', 'Set top') : '')(D.armaduras.find(x => x.id === 'ARTORIA_VEYRA_ARMOR'))}${champ('Arma', topW[0], fmt(topW[0].poder), 'de poder', ico(topW[0].icon, null, 1), 'tl-armas', 'w')}${champ('Anomalía', topN[0], fmtK(topN[0].vida), 'de vida', face(topN[0]), 'tl-anomalias', 'n')}</div>`, '§1', 'Lo primero de cada tier list. Toca para abrir su ficha.')}
    ${sect('Índice', `<nav class="toc rv" aria-label="Índice">${toc}</nav>`, '§2', 'Tier lists, base de datos y sistemas del servidor.')}
    `;
    $$('[data-go]', el).forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.go; }));
  },
  'tl-armaduras'(el) {
    el.innerHTML = head('tl-armaduras', 'Tier list de armaduras', 'Los sets de armadura del Survival, de más a menos fuertes. Toca un set para ver sus piezas.', tierStats(D.armaduras, ['EX', 'S', 'A', 'B', 'C', 'D'])) +
      `<div id="tl"></div>` + sect('Todas las armaduras', '<div id="tb" class="rv"></div>', 'DB', 'Pulsa una fila para abrir la ficha. Ordena tocando la cabecera.') + fichas('armaduras');
    const G = ['Anomalía', 'Mazmorra', 'Cajas y eventos', 'VIP', 'Calamity', 'Playtime (God Kit)'];
    tierlist($('#tl', el), D.armaduras.filter(s => G.includes(s.origen)), { groups: G, tiers: ['EX', 'S', 'A', 'B', 'C', 'D'], group: s => s.origen, groupLabel: 'origen', name: 'nombre', value: s => s.poder, icon: s => ico(s.icon, s.dye, 1), detail: setDetail, tip: 'a' });
    table($('#tb', el), [{ k: 'nombre', l: 'Set', render: (r, re) => `<span class="row">${ico(r.icon, r.dye)}<b>${hl(r.nombre, re)}</b></span>` }, { k: 'origen', l: 'Origen' }, { k: 'tier', l: 'Tier', t: 'tier' }, { k: 'poder', l: 'Poder', t: 'bar' }, { k: 'armadura', l: 'Armadura', t: 'num' }, { k: 'dureza', l: 'Dureza', t: 'num' }, { k: 'vida', l: 'Vida extra', t: 'num' }], D.armaduras, { filters: ['origen', 'tier'], sort: 'poder', onRow: setDetail, name: 'armaduras' });
  },
  'tl-armas'(el) {
    el.innerHTML = head('tl-armas', 'Tier list de armas', 'Las armas del Survival, de más a menos fuertes. Toca un arma para ver su ficha.', tierStats(D.armas, ['EX', 'S', 'A', 'B', 'C', 'D'])) +
      `<div id="tl"></div>` + sect('Todas las armas', '<div id="tb" class="rv"></div>', 'DB', 'Incluye las de tier D, que no salen en la tier list.') + fichas('armas');
    const G = ['Espada', 'Hacha', 'Lanza', 'Tridente', 'Arco', 'Ballesta', 'Mazo'];
    tierlist($('#tl', el), D.armas.filter(a => a.tier !== 'D'), { groups: G.filter(g => D.armas.some(a => a.clase === g)), tiers: ['EX', 'S', 'A', 'B', 'C'], group: a => a.clase, groupLabel: 'clase', name: 'nombre', value: a => a.poder, icon: a => ico(a.icon, null, 1), detail: armaDetail, tip: 'w' });
    table($('#tb', el), [{ k: 'nombre', l: 'Arma', render: (r, re) => `<span class="row">${ico(r.icon)}<b>${hl(r.nombre, re)}</b></span>` }, { k: 'clase', l: 'Clase' }, { k: 'origen', l: 'Origen' }, { k: 'tier', l: 'Tier', t: 'tier' }, { k: 'dano', l: 'Daño', t: 'num' }, { k: 'critico', l: 'Crítico', t: 'num', u: ' %' }, { k: 'max', l: 'Daño crítico', t: 'num' }, { k: 'poder', l: 'Poder', t: 'bar' }], D.armas, { filters: ['clase', 'origen', 'tier'], sort: 'poder', onRow: armaDetail, name: 'armas' });
  },
  'tl-anomalias'(el) {
    el.innerHTML = head('tl-anomalias', 'Tier list de anomalías', 'Las anomalías, de más a menos difíciles. ♥ vida · ⚔ daño medio por golpe. Pulsa una para ver todas sus habilidades.', tierStats(D.anomalias, ['S', 'A', 'B', 'C', 'D'])) +
      `<div id="tl"></div>` + sect('Comparativa', '<div id="tb" class="rv"></div>', 'DB') + fichas('anomalias');
    tierlist($('#tl', el), D.anomalias, { groups: ['General', 'Monarca', 'Dios'], tiers: ['S', 'A', 'B', 'C', 'D'], group: a => a.clase, groupLabel: 'clase', fmtv: fmtK, name: 'nombre', value: a => a.dificultad, label: a => `<span title="Vida">♥ ${fmtK(a.vida)}</span><span title="Daño medio por golpe">⚔ ${fmt(Math.round(a.dano_real))}</span>`, icon: a => face(a), detail: anDetail, tip: 'n' });
    table($('#tb', el), [{ k: 'nombre', l: 'Anomalía', render: (r, re) => `<span class="row">${face(r)}<b>${hl(r.nombre, re)}</b></span>` }, { k: 'clase', l: 'Clase' }, { k: 'tier', l: 'Tier', t: 'tier' }, { k: 'vida', l: 'Vida', t: 'bar' }, { k: 'dano', l: 'Daño ×', t: 'num' }, { k: 'dano_base', l: 'Daño medio ×1', t: 'num' }, { k: 'dano_real', l: 'Daño medio real', t: 'bar' }, { k: 'dificultad', l: 'Puntuación', t: 'num' }, { k: 'mobcoins', l: 'MobCoins', t: 'num' }, { k: 'exp', l: 'EXP', t: 'num' }, { k: 'botin', l: 'Objetos', t: 'num' }, { k: 'bioma', l: 'Bioma' }], D.anomalias, { filters: ['clase', 'tier'], sort: 'dificultad', onRow: anDetail, name: 'anomalias' });
  },
  cajas(el) {
    const C = [...D.cajas].sort((a, b) => b.ev_dinero - a.ev_dinero), mx = Math.max(...C.map(c => c.ev_dinero)), mm = Math.max(...C.map(c => c.ev_mc));
    el.innerHTML = head('cajas', 'Cajas y premios', `${D.cajas.length} cajas y ${D.premios.length} premios. La probabilidad es el peso del premio entre el total de su caja.`, [['Cajas', D.cajas.length], ['Premios', D.premios.length]]) +
      sect('Comparativa por caja', `<div class="cards">${C.map((c, i) => `<button type="button" class="cc glass spot rv pzcard" style="--d:${(i % 4) * 60}ms" data-caja="${esc(c.caja)}"><h3>${esc(c.caja)}<span class="rank">#${pad(i + 1)}</span></h3><div class="kv"><span>Premios</span><span>${c.premios}</span><span>Equipo</span><span>${fmt(c.equipo)} %</span><span>Premio más raro</span><span>${fmt(c.rara)} %</span></div>
        <div class="mlabel"><span>Dinero medio por llave</span><b>${fmt(c.ev_dinero)}</b></div><div class="meter"><i style="--w:${c.ev_dinero / mx}"></i></div>
        <div class="mlabel"><span>MobCoins medias por llave</span><b>${fmt(c.ev_mc)}</b></div><div class="meter az"><i style="--w:${c.ev_mc / mm}"></i></div><span class="ct__more">Ver los ${(c.lista || []).length} premios <span aria-hidden="true">→</span></span></button>`).join('')}</div>`, '01', 'Ordenadas por dinero medio por llave. Toca una caja para ver todos sus premios.') +
      sect('Todos los premios', '<div id="tb" class="rv"></div>', '02') + fichas('cajas');
    $$('.pzcard', el).forEach(b => b.addEventListener('click', () => { const c = D.cajas.find(x => x.caja === b.dataset.caja);
      openPremios({ kind: 'Crate · llave ' + c.llave, title: 'Crate ' + c.caja, ic: 'tripwire_hook', color: 'var(--gold)', lista: c.lista, link: 'cajas/' + c.caja,
        sub: `${c.premios} premios · el más raro, ${fmt(c.rara)} %` }); }));
    table($('#tb', el), [{ k: 'caja', l: 'Caja' }, { k: 'premio', l: 'Premio', render: (r, re) => `<b>${hl(r.premio, re)}</b>` }, { k: 'tipo', l: 'Tipo' }, { k: 'rareza', l: 'Rareza', render: r => `<b style="color:${RAR_C[r.rareza] || 'inherit'}">${esc(r.rareza)}</b>` }, { k: 'pct', l: 'Probabilidad', t: 'bar', u: ' %' }, { k: 'limite', l: 'Límite' }], D.premios, { filters: ['caja', 'tipo', 'rareza'], sort: 'pct', name: 'premios' });
  },
  encantamientos(el) {
    // Dosa 02/11: como una tier list. Fila = tier de AE; icono = el objeto en el que se pone; el efecto, al pasar el ratón
    const tc = { Simple: 'D', Único: 'C', Elite: 'B', Supremo: 'A', Legendario: 'S', Ancestral: 'EX' }, ord = { Simple: 1, Único: 2, Elite: 3, Supremo: 4, Legendario: 5, Ancestral: 6 };
    const TN = Object.fromEntries(Object.entries(tc).map(([k, v]) => [v, k]));
    const para = p => /arco|ballesta/i.test(p) && !/espada|hacha|armas/i.test(p) ? 'Arcos y tridentes' : /tridente/i.test(p) && !/espada/i.test(p) ? 'Arcos y tridentes'
      : /espada|hacha|^armas$/i.test(p) && !/herramient/i.test(p) ? 'Armas' : /armadura|bota|casco|pechera|pantal|elytra/i.test(p) ? 'Armaduras'
      : /pico|pala|azada|herramient|caña|cuerno/i.test(p) ? 'Herramientas' : 'Varios';
    const ICP = [[/caña/i, 'fishing_rod'], [/cuerno/i, 'goat_horn'], [/elytra/i, 'elytra'], [/bota/i, 'diamond_boots'], [/casco/i, 'diamond_helmet'], [/pechera/i, 'diamond_chestplate'], [/pantal/i, 'diamond_leggings'],
      [/armadura/i, 'diamond_chestplate'], [/azada/i, 'diamond_hoe'], [/pico/i, 'diamond_pickaxe'], [/herramient/i, 'diamond_shovel'], [/^arcos/i, 'bow'], [/ballesta/i, 'crossbow'], [/tridente/i, 'trident'],
      [/hacha/i, 'diamond_axe'], [/espada|armas/i, 'diamond_sword']];
    const icp = p => (ICP.find(([re]) => re.test(p)) || [0, 'enchanted_book'])[1];
    const G = ['Armas', 'Arcos y tridentes', 'Armaduras', 'Herramientas', 'Varios'];
    const items = D.encantamientos.map(e => ({ ...e, tn: e.tier, tier: tc[e.tier] || 'D', g: para(e.para || ''), n: e.niveles || 1 }));
    BYID.e = new Map(items.map(x => [String(x.id), x]));
    el.innerHTML = head('encantamientos', 'Encantamientos', `Los ${D.encantamientos.length} de AdvancedEnchantments, por tier. Pasa el ratón para ver su efecto al nivel máximo; tócalo para ver cada libro. Libros: /xpshop (Simple a Legendario), Bóveda, cajas, pase, cofres PvP.`, Object.keys(tc).reverse().map(t => [t, D.encantamientos.filter(e => e.tier === t).length]).filter(x => x[1])) +
      '<div id="tl"></div>' + sect('Lista completa', '<div id="tb" class="rv"></div>', 'DB', 'Para buscar por efecto o filtrar por objeto.') + fichas('encantamientos');
    tierlist($('#tl', el), items, { groups: G.filter(g => items.some(x => x.g === g)), tiers: ['EX', 'S', 'A', 'B', 'C', 'D'], tierName: t => TN[t], tierColor: t => AE_C[TN[t]], rng: () => "",
      group: x => x.g, groupLabel: 'objeto', name: 'nombre', value: x => x.n, label: x => `Nivel ${ROM(x.n)}`, icon: x => `${ico('enchanted_book', null, 1)}<span class="enc-sub">${ico(icp(x.para || ''))}</span>`, detail: e => encDetail(D.encantamientos.find(y => y.id === e.id)), tip: 'e' });
    table($('#tb', el), [{ k: 'nombre', l: 'Encantamiento', render: (r, re) => `<b>${hl(r.nombre, re)}</b>` }, { k: 'tier', l: 'Tier', sv: r => ord[r.tier] || 0, render: r => `<span class="pill" style="background:${AE_C[r.tier]};color:#0b0a16">${esc(r.tier)}</span>` }, { k: 'para', l: 'Para' }, { k: 'niveles', l: 'Niveles', t: 'num' }, { k: 'efecto', l: 'Efecto al nivel máximo' }], D.encantamientos, { filters: ['tier', 'para'], sort: 'tier', dir: -1, name: 'encantamientos', onRow: encDetail });
  },
  mazmorras(el) {
    // Dosa 02/11: las mazmorras en sí (requisitos, jefe, tropa con su botín, cofres, encargos y tiendas), no solo la lista de mobs
    const M = D.mazmorras || [], T = D.mazmorras_tiendas || {};
    const top = [...D.jefes].sort((a, b) => b.vida - a.vida);
    el.innerHTML = head('mazmorras', 'Mazmorras', 'Las mazmorras del Survival: qué hace falta para entrar, a quién te enfrentas, qué sueltan sus mobs y sus cofres, los encargos de sus NPC y sus tiendas. Dungeons está en dificultad Difícil.', [['Mazmorras', M.length], ['Mobs', D.jefes.length], ['Más vida', `${esc(top[0].mob)} · ${fmt(top[0].vida)}`]]) +
      sect('Las mazmorras', `<div class="mz-grid">${M.map(m => `<article class="mz glass" data-mz="${m.id}">
        <div class="mz__h">${ico(m.ic, null, 1)}<div><h3>${esc(m.n)}</h3>${m.rank ? `<span class="mz__rank">Rango ${m.rank} o más</span>` : ''}</div></div>
        <p>${esc(m.req)}</p>
        ${m.tropa.length ? `<div class="mz__tropa">${m.tropa.slice(0, 6).map(t => `<span><b>${esc(t.n)}</b><small>♥ ${fmt(t.vida)} · ⚔ ${fmt(t.dano)}</small></span>`).join('')}${m.tropa.length > 6 ? `<span class="mut sm">y ${m.tropa.length - 6} más</span>` : ''}</div>` : ''}
        <div class="mz__btns">${m.cofres.map(c => `<button type="button" class="mz__cofre" data-cofre="${esc(c.r)}" style="--rc:${RAR_C[c.r] || 'var(--mc-7)'}">Cofre ${esc(c.r.toLowerCase())} <small>${c.lista.length}</small></button>`).join('')}${m.encargos.length ? `<button type="button" class="mz__enc">Encargos de ${esc(m.npc)} <small>${m.encargos.length}</small></button>` : ''}</div>
        ${m.tropa.length ? '<button type="button" class="ct__more mz__more">Ver jefe, tropa y botín <span aria-hidden="true">→</span></button>' : ''}
      </article>`).join('')}</div>`, '01', 'Toca una mazmorra para ver su jefe, su tropa y lo que suelta cada mob.') +
      sect('Jefes y tropa', '<div id="tb" class="rv"></div>', '02') +
      sect('Darian, el intendente: forja de Artoria', '<div id="td" class="shop-grid"></div>', '03', 'Equipo de los caballeros a cambio del botín de los mobs de Artoria.') +
      sect('Nerea: consumibles y el set de Veyra', '<div id="tn" class="shop-grid"></div>', '04', 'El set de Veyra se desbloquea tras «La mano del culto» y solo se compra una vez.') +
      sect('El alquimista', '<div id="ta" class="shop-grid"></div>', '05', 'Efectos temporales y libros a cambio de dinero y materiales de mazmorra.') + fichas('mazmorras');
    const EF = { SPEED: 'Velocidad', JUMP_BOOST: 'Salto', NIGHT_VISION: 'Visión nocturna', HASTE: 'Prisa', STRENGTH: 'Fuerza', RESISTANCE: 'Resistencia', REGENERATION: 'Regeneración', FIRE_RESISTANCE: 'Resistencia al fuego', WATER_BREATHING: 'Respiración acuática', ABSORPTION: 'Absorción', HEALTH_BOOST: 'Vida extra', LUCK: 'Suerte' };
    const efes = t => (t || '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [k, n] = x.split(':'); return (EF[k] || k) + ' ' + ROM(+n + 1); }).join(', ');
    const zona = id => M.find(m => m.id === id);
    const encDr = m => openDrawer({ kind: 'Mazmorra · ' + m.n, title: 'Encargos de ' + m.npc, art: ico('writable_book', null, 1), wide: true,
      extra: `<div class="mz-enc">${m.encargos.map(q => `<div class="mz-enc__q"><span class="pill">Cap. ${q.cap}</span><b>${esc(q.n)}</b><span class="mut sm">${q.cant > 1 ? '× ' + fmt(q.cant) + ' · ' : ''}${esc(q.rec)}</span></div>`).join('')}</div>` });
    const mzDr = m => openDrawer({ kind: 'Mazmorra', title: m.n, art: ico(m.ic, null, 1), wide: true, sub: m.rank ? `<span class="mz__rank">Rango ${m.rank} o más</span>` : '',
      extra: `<p style="margin:0">${esc(m.req)}</p>${m.tropa.map(t => `<div class="mz-mob"><div class="mz-mob__h"><b>${esc(t.n)}</b><span class="mut sm">♥ ${fmt(t.vida)} · ⚔ ${fmt(t.dano)} · 🛡 ${fmt(t.armadura)}</span></div>${t.drops.length ? `<div class="mz-mob__d">${t.drops.map(d => `<span class="mz-drop">${ico(d.ic)}<span><b>${esc(d.n)}</b><small>${d.q && d.q !== '1' ? '× ' + esc(d.q) + ' · ' : ''}${fmt(d.p)} %</small></span></span>`).join('')}</div>` : '<p class="mut sm" style="margin:0">No suelta botín propio.</p>'}</div>`).join('')}` });
    $$('.mz', el).forEach(a => {
      const m = zona(a.dataset.mz);
      $$('.mz__cofre', a).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const c = m.cofres.find(x => x.r === b.dataset.cofre);
        openPremios({ kind: 'Mazmorra · ' + m.n, title: 'Cofre ' + c.r.toLowerCase(), ic: 'chest', color: RAR_C[c.r], lista: c.lista.map(f => ({ ...f, r: undefined })), sub: 'Cada objeto sale con su propia probabilidad: un cofre puede traer varios.' }); }));
      const be = $('.mz__enc', a); if (be) be.addEventListener('click', e => { e.stopPropagation(); encDr(m); });
      if (m.tropa.length) { a.style.cursor = 'pointer'; a.addEventListener('click', () => mzDr(m)); }
    });
    // Dosa 02/11: tiendas con iconos, no como texto: objeto con su icono y nombre original, coste en fichas de material
    const chips = c => `<div class="shop__coste">${c.map(([ic, q, n]) => `<span class="shop__mat" title="${esc(n)}">${ico(ic)}<b>×${fmt(q)}</b><small>${esc(n)}</small></span>`).join('')}</div>`;
    const tienda = (lista, extra) => lista.map((o, i) => { const f = o.f; BYID.m.set(String(BYID.m.size), f);
      return `<article class="shop glass"><div class="shop__h"><span class="slot shop__slot" data-tip="m:${BYID.m.size - 1}">${f.img ? `<span class="ic lg"><img alt="" src="${f.img}"></span>` : ico(f.ic, null, 1)}${f.q ? `<b class="pz__q">${esc(f.q)}</b>` : ''}</span>
        <div><b class="shop__n" style="${f.c ? `color:${f.c}` : ''}">${f.nh ? rt(f.nh) : esc(f.n)}</b>${extra ? extra(o) : ''}</div></div>${chips(o.coste)}</article>`; }).join('');
    BYID.m = new Map();
    $('#td', el).innerHTML = tienda(T.darian || [], o => `<span class="shop__tag">${esc(o.cat)}</span>`);
    $('#tn', el).innerHTML = tienda(T.nerea || [], o => `${o.req ? `<span class="shop__tag req">${esc(o.req)}</span>` : ''}${o.limite ? `<span class="shop__tag">Solo ${o.limite} vez</span>` : ''}`);
    $('#ta', el).innerHTML = (T.alquimista || []).map(o => `<article class="shop glass"><div class="shop__h"><span class="slot shop__slot">${ico(o.efectos ? 'potion' : 'enchanted_book', null, 1)}</span>
      <div><b class="shop__n">${esc(o.n)}</b>${o.dur ? `<span class="shop__tag">${fmt(o.dur)} min</span>` : ''}</div></div>
      ${o.efectos ? `<div class="shop__efs">${efes(o.efectos).split(', ').map(e => `<span>${esc(e)}</span>`).join('')}</div>` : ''}
      ${chips([['gold_ingot', o.dinero, 'Dinero'], ...o.coste])}</article>`).join('');
    hydrate($('#td', el)); hydrate($('#tn', el)); hydrate($('#ta', el));
    table($('#tb', el), [{ k: 'mob', l: 'Mob', render: (r, re) => `<span class="row">${mobFace(r)}<b>${hl(r.mob, re)}</b></span>` }, { k: 'vida', l: 'Vida', t: 'bar' }, { k: 'dano', l: 'Daño', t: 'num' }, { k: 'armadura', l: 'Armadura', t: 'num' }, { k: 'habilidades', l: 'Habilidades', t: 'num' }, { k: 'fichero', l: 'Grupo' }], D.jefes, { filters: ['fichero'], sort: 'vida', name: 'mazmorras' });
  },
  mascotas(el) {
    el.innerHTML = head('mascotas', 'Mascotas', `${D.mascotas.length} mascotas de CombatPets. Fuente según las cajas; las demás se capturan.`, [['Mascotas', D.mascotas.length], ['Capturables', D.mascotas.filter(m => m.capturable === 'Sí').length]]) + '<div id="tb" class="rv"></div>' + fichas('mascotas');
    table($('#tb', el), [{ k: 'mascota', l: 'Mascota', render: (r, re) => `<span class="row">${ico(r.icon)}<b>${hl(r.mascota, re)}</b></span>` }, { k: 'vida', l: 'Vida', t: 'bar' }, { k: 'dano', l: 'Daño', t: 'num' }, { k: 'capturable', l: 'Capturable' }, { k: 'fuente', l: 'De dónde sale' }], D.mascotas, { filters: ['capturable'], sort: 'vida', name: 'mascotas' });
  },
  tags(el) {
    const cats = [...new Set(D.tags.map(t => t.categoria))];
    el.innerHTML = head('tags', 'Tags', `Los ${D.tags.length} tags del plugin Tags y cómo se consiguen.`, [['Tags', D.tags.length], ['Categorías', cats.length]]) + '<div id="tb" class="rv"></div>';
    table($('#tb', el), [{ k: 'd', l: 'Así se ve', render: r => `<span class="tagmc">${rt(r.d) || esc(r.tag)}</span>` }, { k: 'tag', l: 'Nombre', render: (r, re) => `<b>${hl(r.tag, re)}</b>` }, { k: 'categoria', l: 'Categoría' }, { k: 'fuente', l: 'Cómo se consigue' }], D.tags, { filters: ['categoria'], name: 'tags' });
  },
  economia(el) {
    const src = [['Rankup (20 rangos)', 9400000], ['Misiones de una vez', 7500000], ['Diaria Monarch (30 días)', 4830000], ['Playtime (99 niveles)', 3916500], ['AuraSkills (11 habilidades al 100)', 2310000], ['Pase S2 premium', 1896000], ['Pase S2 gratis', 851000], ['Votos (30 días)', 540000], ['Diaria Aeris (30 días)', 330000]];
    const m = Math.max(...src.map(s => s[1]));
    el.innerHTML = head('economia', 'Economía y MobCoins', 'Dónde nace el dinero, dónde muere y cuánto vale cada cosa en MobCoins.', [['Artículos en /shop', D.shop.length], ['Pagos de Jobs', D.jobs.length], ['Tiendas de MC', new Set(D.mc_tiendas.map(t => t.tienda)).size]]) +
      sect('De dónde sale el dinero', `<div class="glass rv"><div class="hbars">${src.map(([n, v], i) => `<div class="hb" style="--i:${i}"><span>${n}</span><div class="tr"><i style="--w:${v / m}"></i></div><b>${fmt(v)}</b></div>`).join('')}<div class="hb"><span>Jobs (pago por acción)</span><div class="tr"><i style="--w:0"></i></div><a href="#economia" data-jobs style="color:var(--az);font:400 10px var(--f-px);text-transform:uppercase;text-align:right">Sin tope · ver tabla ↓</a></div><div class="hb-total"><span>Si sumas todas las fuentes (los Jobs no entran: dependen de lo que trabajes)</span><b>${fmt(src.reduce((a, s) => a + s[1], 0))}</b></div></div></div>`, '01') +
      sect('MobCoins por mob', '<div id="mc" class="rv"></div>', '02') + sect('Tiendas de MobCoins', '<div id="mt" class="rv"></div>', '03') + sect('/shop: compra y venta', '<div id="sh" class="rv"></div>', '04') + sect('Jobs: pago por acción (nivel 1)', '<div id="jb" class="rv"></div>', '05') + fichas('economia');
    table($('#mc', el), [{ k: 'mob', l: 'Mob', render: (r, re) => `<span class="row">${eggOf(r.mob)}<b>${hl(mobName(r.mob), re)}</b></span>` }, { k: 'prob', l: 'Prob.', t: 'num', u: ' %' }, { k: 'cantidad', l: 'Cantidad' }, { k: 'media', l: 'Media por muerte', t: 'bar' }], D.mc_drops, { sort: 'media', name: 'mobcoins' });
    table($('#mt', el), [{ k: 'tienda', l: 'Tienda' }, { k: 'articulo', l: 'Artículo', render: (r, re) => `<b>${hl(r.articulo, re)}</b>` }, { k: 'precio', l: 'Precio (MC)', t: 'bar' }, { k: 'stock', l: 'Stock', t: 'num' }, { k: 'limite', l: 'Límite por jugador', t: 'num' }], D.mc_tiendas, { filters: ['tienda'], sort: 'precio', name: 'tiendas-mc' });
    table($('#sh', el), [{ k: 'seccion', l: 'Sección' }, { k: 'articulo', l: 'Artículo' }, { k: 'compra', l: 'Compra', t: 'num' }, { k: 'venta', l: 'Venta', t: 'bar' }], D.shop, { filters: ['seccion'], sort: 'venta', name: 'shop' });
    $('[data-jobs]', el).addEventListener('click', e => { e.preventDefault(); $('#jb', el).closest('.sect').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    table($('#jb', el), [{ k: 'oficio', l: 'Oficio' }, { k: 'accion', l: 'Acción' }, { k: 'objetivo', l: 'Objetivo', render: (r, re) => hl(sentence(r.objetivo), re) }, { k: 'dinero', l: 'Dinero', t: 'bar' }, { k: 'exp', l: 'XP', t: 'num' }], D.jobs, { filters: ['oficio', 'accion'], sort: 'dinero', name: 'jobs' });
  },
  progresion(el) {
    el.innerHTML = head('progresion', 'Rankup, playtime y misiones', 'Lo que se gana subiendo de rango, jugando horas y haciendo misiones.', [['Rankups', D.rankup.length], ['Niveles de playtime', D.playtime.length], ['Misiones', D.misiones.length]]) +
      sect('Playtime: horas por nivel', '<div class="glass chart" id="ch"></div>', '01', 'Pasa el ratón por la curva para ver cada nivel.') + sect('Los 20 rankups', '<div id="rk" class="rv"></div>', '02') + sect('Playtime nivel a nivel', '<div id="pt" class="rv"></div>', '03') + sect('Misiones', '<div id="ms" class="rv"></div>', '04') + fichas('progresion');
    chartPlaytime($('#ch', el));
    table($('#rk', el), [{ k: 'rango', l: 'Rango', t: 'num' }, { k: 'requisitos', l: 'Requisitos', t: 'num' }, { k: 'horas', l: 'Horas mín.', t: 'num' }, { k: 'dinero', l: 'Dinero', t: 'bar' }, { k: 'mobcoins', l: 'MobCoins', t: 'num' }, { k: 'exp', l: 'XP', t: 'num' }, { k: 'extras', l: 'Extras' }], D.rankup, { sort: 'rango', dir: 1, name: 'rankup' });
    table($('#pt', el), [{ k: 'nivel', l: 'Nivel', t: 'num' }, { k: 'horas', l: 'Horas', t: 'num' }, { k: 'dinero', l: 'Dinero', t: 'bar' }, { k: 'mobcoins', l: 'MobCoins', t: 'num' }, { k: 'exp', l: 'Niveles de XP', t: 'num' }, { k: 'extras', l: 'Extras' }], D.playtime, { sort: 'nivel', dir: 1, name: 'playtime' });
    table($('#ms', el), [{ k: 'categoria', l: 'Categoría' }, { k: 'mision', l: 'Misión' }, { k: 'objetivo', l: 'Objetivo', render: (r, re) => hl(sentence(r.objetivo), re) }, { k: 'dinero', l: 'Dinero', t: 'bar' }, { k: 'niveles', l: 'Niveles', t: 'num' }, { k: 'mobcoins', l: 'MobCoins', t: 'num' }], D.misiones, { filters: ['categoria'], sort: 'dinero', name: 'misiones' });
  },
  rangos(el) {
    const R = [['Precio', '—', '15 $', '20 $', '25 $', '42,99 $'], ['Homes', '1', '5', '10', '15', '30'], ['Protecciones', '1', '4', '10', '10', '20'], ['Minions', '5', '10', '20', '∞', '∞'], ['Subastas', '1', '5', '10', '20', '20'], ['Bóvedas /pv', '1', '4', '5', '6', '15'], ['Warps personales', '—', '3', '4', '5', '5'], ['Trabajos a la vez', '—', '5', '8', '12', '12'], ['XP de habilidades', '—', '—', '+20 %', '+35 %', '+50 %'], ['Recompensa diaria', '1.000 $', '11.000 $', '36.000 $', '86.000 $', '161.000 $'], ['Kit semanal (poder del set)', '—', '3.120', '3.760', '4.400', '5.080'], ['Fly · autosell · TP sin espera', '—', '✔', '✔', '✔', '✔'], ['Conservar inventario*', '—', '✔', '✔', '✔', '✔'], ['Conservar EXP', '—', '—', '—', '✔', '✔'], ['/itemname, /sit', '—', '—', '✔', '✔', '✔'], ['/hat, /ptime, /lay', '—', '—', '—', '✔', '✔'], ['Efectos RIP', '—', '10', '20', '32', '42'], ['Glow', '—', '16 colores', '16', '16 + parpadeo', '+ arcoíris']];
    const H = ['Sin rango', 'Aeris', 'Astral', 'Eternal', 'Monarch'];
    const cellv = c => c === '✔' ? '<span class="yes" aria-label="Sí">✔</span>' : c === '—' ? '<span class="dash" aria-label="No">—</span>' : esc(c);
    el.innerHTML = head('rangos', 'Rangos VIP', PUB ? 'Lo que da cada rango en el servidor.' : '', [['Rangos', 4], ['Beneficios comparados', R.length - 1]]) +
      `<div class="mx-wrap rv"><table class="mx"><thead><tr><th scope="col">Beneficio</th>${H.map((h, i) => `<th scope="col" data-c="${i + 1}"${i === 4 ? ' class="hl"' : ''}><div class="rk"><b>${h}</b><small>${R[0][i + 1]}</small></div></th>`).join('')}</tr></thead><tbody>${R.slice(1).map(r => `<tr>${r.map((c, i) => i ? `<td data-c="${i}"${i === 5 ? ' class="hl"' : ''}>${cellv(c)}</td>` : `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` + fichas('rangos');
    const t = $('.mx', el);
    t.addEventListener('mouseover', e => { const c = e.target.closest('[data-c]'); $$('.colhov', t).forEach(x => x.classList.remove('colhov')); if (c) $$(`[data-c="${c.dataset.c}"]`, t).forEach(x => x.classList.add('colhov')); });
    t.addEventListener('mouseleave', () => $$('.colhov', t).forEach(x => x.classList.remove('colhov')));
  },
  combate(el) {
    const rows = [['Zombi', 3, .25, .24, .12], ['Élite de horda (zombi ×1,8)', 5.4, .49, .47, .22], ['Esqueleto', 4, .35, .33, .16], ['Creeper a bocajarro', 43, 9.75, 8.42, 1.72], ['Piglin / wither del Nether', 5, .45, .43, .2], ['Élite del Nether', 9, .94, .88, .36], ['Ahogado de la Marea (pesca)', 14, '2,4*', '2,4*', '2,4*'], ['Zombi en Dungeons', 4.5, .4, .38, .18]];
    const heat = v => typeof v !== 'number' ? '' : ` style="background:color-mix(in srgb,var(--tc-s) ${(Math.min(.5, v / 20 * .5 + .03) * 100).toFixed(1)}%,transparent)"`;
    el.innerHTML = head('combate', 'Dificultad y hordas', 'Cuánto pega cada cosa con cada armadura. Overworld en Normal, Nether en Fácil, Dungeons en Difícil.', [['Overworld', 'Normal'], ['Nether', 'Fácil'], ['Dungeons', 'Difícil']]) +
      `<div class="rv"><div class="tw" style="max-height:none"><table><thead><tr><th style="cursor:default">Golpe</th><th class="num" style="cursor:default">Sin armadura</th><th class="num" style="cursor:default">Diamante Prot IV</th><th class="num" style="cursor:default">Netherita Prot IV</th><th class="num" style="cursor:default">Armadura al tope</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td class="num"${heat(c)}><b>${fmt(c)}</b></td>` : `<td><b>${esc(c)}</b></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <p class="note rv">Daño que llega al jugador (20 de vida = 10 corazones). El color se intensifica cuanto más pega. * La pesca extrema quita como mínimo el 12 % de tu vida por golpe.</p>` + fichas('combate');
  },
  calamity(el) {
    const sets = D.armaduras.filter(s => s.origen === 'Calamity').sort((a, b) => b.poder - a.poder);
    const ESEN = [['iron_chestplate', 'Si mueres, lo pierdes todo', 'Lo que llevas encima se queda en Calamity. Solo vale lo que sacas vivo y le vendes a Oren.'],
      ['netherite_hoe', 'No te quedes quieto', '10 minutos sin moverte y viene la Parca, un jefe de nivel Dios.'],
      ['end_crystal', 'Eclipse: 02, 08, 14 y 20 h', '20 minutos de noche: mobs 10 niveles más fuertes y el doble de Esencias.'],
      ['white_wool', 'Armisticio cada 12 horas', '2 horas de tregua: nadie puede hacer daño a otro jugador.']];
    el.innerHTML = head('calamity', 'Calamity', 'El mundo hardcore de Ederus: se entra por el portal del spawn, se junta botín y se vuelve vivo para venderlo. Aquí tienes todo, por temas.', [['Temas', '…'], ['Sets de Calamity', sets.length], ['Minijefes', 6]]) +
      `<div class="calx-ess rv">${ESEN.map(([i, t, d]) => `<div class="calx-ess__i">${ico(i)}<div><b>${t}</b><span>${d}</span></div></div>`).join('')}</div>` +
      '<nav class="calx-nav" aria-label="Categorías de Calamity"></nav><div id="calx" class="calx"><p class="mut">Cargando la guía de Calamity…</p></div>';
    const setsHtml = sets.length ? `<h3 class="calx-sub">Los sets de Calamity</h3><div class="cards">${sets.map((s, i) => `<button type="button" class="cc glass spot rv" style="--d:${(i % 4) * 60}ms;text-align:left;cursor:pointer;color:inherit;font:inherit" data-set="${esc(s.id)}"><h3>${ico(s.icon, s.dye)}${esc(s.nombre)}<span class="rank"><span class="pill tier-${s.tier}">${s.tier}</span></span></h3><div class="mlabel"><span>Poder</span><b>${fmt(s.poder)}</b></div><div class="meter az"><i style="--w:${s.poder / mxA().poder}"></i></div><div class="kv"><span>Armadura</span><span>${fmt(s.armadura)}</span><span>Dureza</span><span>${fmt(s.dureza)}</span><span>Vida extra</span><span>${fmt(s.vida)}</span></div></button>`).join('')}</div>` : '';
    cargarCalamity().then(C => {
      $('.stats .chip b', el).textContent = C.temas.length;
      $('.calx-nav', el).innerHTML = C.cats.map((c, i) => `<button type="button" class="tg plain" data-cat="${c.id}"><small>${pad(i + 1)}</small>${esc(c.t)}</button>`).join('');
      $('#calx', el).innerHTML = C.cats.map((c, i) => `<section class="sect calx-cat" id="calx-${c.id}"><div class="sect__h rv"><h2><small>${pad(i + 1)}</small>${esc(c.t)}</h2><p>${esc(c.d)}</p></div>${c.id === 'antes' ? npcGaleria(C) : ''}<div class="calx-grid">${C.temas.filter(t => t.cat === c.id && t.id !== 'quien-es-quien').map((t, k) => `<article class="ct glass spot rv" style="--d:${(k % 3) * 60}ms" data-tema="${t.id}"><div class="ct__h">${ico(t.ic)}<h3>${esc(t.t)}</h3></div>${t.intro ? `<p>${esc(t.intro)}</p>` : ''}${t.puntos.length ? `<ul>${t.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}<button type="button" class="ct__more">Ver todo${t.mas ? ` · ${t.mas + t.puntos.length} en total` : ''} <span aria-hidden="true">→</span></button></article>`).join('')}</div>${c.id === 'mejorar' ? setsHtml : ''}</section>`).join('');
      hydrate(el); reveal(el);
      $$('.ct', el).forEach(a => a.addEventListener('click', () => calTema(a.dataset.tema)));
      $$('.npc', el).forEach(a => a.addEventListener('click', () => calNpc(a.dataset.npc)));
      $$('[data-set]', el).forEach(b => b.addEventListener('click', () => setDetail(sets.find(s => s.id === b.dataset.set))));
      $$('.calx-nav [data-cat]', el).forEach(b => b.addEventListener('click', () => calCat(b.dataset.cat)));
      const m = /^#calamity\/([a-z0-9-]+)/.exec(location.hash); if (m) calTema(m[1]);
    }, () => { $('#calx', el).innerHTML = '<p class="note">No se ha podido cargar la guía de Calamity. Recarga la página.</p>'; });
  },
  pesca(el) {
    const P = D.pesca, TCOL = { Común: 'D', 'Poco común': 'C', Raro: 'B', Épico: 'A', Legendario: 'S', Mítico: 'EX', Inmortal: 'EX' };
    const pc = v => fmt(v) + ' %';
    const PUNT = { fish: 'Pez', common: 'Caja común', uncommon: 'Caja poco común', rare: 'Caja rara', epic: 'Caja épica', legendary: 'Caja legendaria', mythic: 'Caja mítica' };
    el.innerHTML = head('pesca', 'Pesca', 'La pesca de Ederus: cada captura trae una caja con premio. Qué sale, con qué probabilidad, qué cañas y carnadas compensan y lo que suma tu rango.', [['Peces', P.peces.length], ['Cañas', P.canas.length], ['Rarezas de caja', P.tiers.length]]) +
      sect('Qué caja te sale', `<div class="pz-zona" role="group" aria-label="Zona de pesca"><button type="button" class="pz-z on" data-z="normal" aria-pressed="true">${ico('fishing_rod', null, 1)}<span><b>Pesca normal</b><small>Spawn y zonas normales</small></span></button><button type="button" class="pz-z cal" data-z="calamity" aria-pressed="false">${ico('goat_horn', null, 1)}<span><b>Pesca de Calamity</b><small>Siempre extrema · caja Inmortal</small></span></button></div><p class="mut sm pz-zona-txt"></p><div class="cards" id="pzcards"></div>`, '01', 'Probabilidad de cada rareza sin boosts. Toca una caja para ver todos sus premios.') +
      sect('Todos los premios', '<div id="tbp" class="rv"></div>', '02', 'La columna «Por captura» ya junta la probabilidad de la caja y la del premio dentro de ella.') +
      sect('Cañas', `<div class="cards">${P.canas.map((c, i) => `<div class="cc glass spot rv" style="--d:${i * 60}ms"><h3>${ico('fishing_rod')}${esc(c.n)}</h3><div class="kv"><span>Precio</span><span>${fmt(c.precio)} MC</span><span>Más cajas</span><span>+${fmt(c.cajas)} %</span><span>Suerte de rareza</span><span>+${fmt(c.suerte)} %</span><span>Pican antes</span><span>${fmt(c.mordida)} %</span></div></div>`).join('')}</div>`, '03', 'Se compran con MobCoins en la tienda de pesca.') +
      sect('Carnadas y funda', `<div class="cards">${P.carnadas.map((c, i) => `<div class="cc glass spot rv" style="--d:${i * 60}ms"><h3>${ico('spider_eye')}${esc(c.n)}</h3><div class="kv"><span>Precio</span><span>${fmt(c.precio)} MC</span><span>Usos por compra</span><span>${fmt(c.usos)} (máx. ${fmt(c.max)})</span><span>Más cajas</span><span>+${fmt(c.cajas)} %</span><span>Suerte de rareza</span><span>+${fmt(c.suerte)} %</span></div></div>`).join('')}<div class="cc glass spot rv"><h3>${ico('turtle_scute')}Funda anti-mordidas</h3><div class="kv"><span>Precio</span><span>${fmt(P.funda.precio)} MC</span><span>Protege</span><span>${fmt(P.funda.usos)} percances</span></div><p class="mut sm">Evita que un percance se lleve o se coma tu caña.</p></div></div>`, '04') +
      sect('Lo que suma tu rango', '<div id="tbr" class="rv"></div>', '05', 'Bonos de pesca de cada rango VIP. No se suman entre sí: cuenta el más alto que tengas.') +
      sect('Eventos de pesca', `<div class="cards">${P.eventos.map((e, i) => `<div class="cc glass spot rv" style="--d:${i * 60}ms"><h3>${esc(e.n)}</h3><div class="kv">${e.cajas ? `<span>Más cajas</span><span>+${fmt(e.cajas)} %</span>` : ''}${e.suerte ? `<span>Suerte de rareza</span><span>+${fmt(e.suerte)} %</span>` : ''}${e.mordida ? `<span>Pican antes</span><span>${fmt(e.mordida)} %</span>` : ''}${e.doble ? `<span>Premio doble</span><span>${fmt(e.doble)} %</span>` : ''}</div></div>`).join('')}</div>`, '06', 'Los activa el staff y se anuncian en el chat.') +
      sect('Peces', '<div id="tbf" class="rv"></div>', '07', 'Talla y precio de venta: el precio sube con el peso de cada pez.') +
      sect('Pesca extrema', `<p class="note rv">Hay zonas de pesca extrema, como la del spawn de Calamity: la decide la zona, no el jugador. Dan un ${fmt(P.extrema.cajas)} % más de cajas y más suerte, pero el ${fmt(P.extrema.percance)} % de las capturas trae un percance (y un ${fmt(P.extrema.golpe)} %, un golpe de suerte). Lo que puede salir del agua: ${P.extrema.mobs.map(m => `<b>${esc(m.n)}</b> (${fmt(m.vida)} de vida, pega ${fmt(m.dano)}${m.golpe ? ` y te quita como mínimo el ${m.golpe} % de la vida` : ''})`).join(' y ')}. Los sets de la Marea y la Funda reducen el riesgo. Todo el detalle en <a href="#calamity/la-pesca-de-calamity">la pesca de Calamity</a>.</p><div id="tbx" class="rv"></div>`, '08') +
      sect('Torneos', `<div class="cards"><div class="cc glass spot rv"><h3>Puntos por captura</h3><div class="kv">${Object.entries(P.torneos.puntos).map(([k, v]) => `<span>${esc(PUNT[k] || k)}</span><span>${fmt(v)}</span>`).join('')}</div></div><div class="cc glass spot rv"><h3>Premios</h3><div class="kv">${Object.entries(P.torneos.premios).map(([k, v]) => `<span>${esc(k)}.º</span><span>${esc(v)}</span>`).join('')}</div></div></div>`, '09') +
      sect('Los cambios de Carpa', `<div class="cards">${P.carpa.map((c, i) => `<div class="cc glass spot rv" style="--d:${i * 50}ms"><h3>${esc(c.da)}</h3><div class="kv"><span>Pide</span><span>${esc(c.pide)}</span></div></div>`).join('')}</div>`, '10', 'Carpa, en el spawn de Calamity, mejora la Marea Celeste a Sangrienta.');
    // Dosa 02/11: elegir entre la pesca normal y la de Calamity (zona extrema del spawn de Calamity)
    const ZONA = { normal: { tiers: P.tiers, n: 'normal', txt: 'En el spawn y en el resto de zonas normales.' },
      calamity: { tiers: P.calamity, n: 'de Calamity', txt: 'En la zona de pesca del spawn de Calamity, junto a Carpa. Siempre es extrema: mejores premios, pero el 60 % de las capturas trae un percance. La caja Inmortal solo sale con la Marea Sangrienta completa.' } };
    let zona = 'normal';
    const pintaZona = () => {
      const Z = ZONA[zona], T = Z.tiers, top = Math.max(...T.filter(t => !t.marea).map(t => t.pct));
      $('.pz-zona-txt', el).textContent = Z.txt;
      $('#pzcards', el).innerHTML = T.map((t, i) => `<button type="button" class="cc glass spot pzcard pzcaja is-in" data-tier="${t.id}" style="--cj:${t.c || 'var(--az)'}"><h3><span>${t.nh ? rt(t.nh) : esc(t.n)}</span><span class="rank"><span class="pill pzcaja__pct">${pc(t.pct)}</span></span></h3><div class="meter"><i style="--w:${Math.max(.02, t.pct / top)};background:var(--cj)"></i></div><div class="kv">${(t.lista || []).slice(0, 4).map(p => `<span>${esc(p.n)}</span><span>${pc(p.p)}</span>`).join('')}</div>${t.marea ? '<p class="mut sm" style="margin:0">Solo con la Marea Sangrienta completa puesta.</p>' : ''}<span class="ct__more">Ver los ${(t.lista || []).length} premios <span aria-hidden="true">→</span></span></button>`).join('');
      hydrate($('#pzcards', el));
      $$('.pzcard', el).forEach(b => b.addEventListener('click', () => { const t = T.find(x => x.id === b.dataset.tier);
        openPremios({ kind: `Pesca ${Z.n} · caja ${t.n.toLowerCase()}`, title: 'Caja ' + t.n, ic: 'fishing_rod', color: t.c || TC[TCOL[t.n] || 'D'], lista: t.lista, link: `pesca/${zona === 'calamity' ? 'calamity-' : ''}${t.id}`,
          sub: `<span class="pill" style="background:${t.c};color:#0b0a16">${pc(t.pct)}</span> de las capturas sin boosts${t.marea ? ', con la Marea Sangrienta completa' : ''}`, extra: f => `${fmt(Math.round(f.p * t.pct) / 100)} %` }); }));
      const tb = $('#tbp', el); tb.innerHTML = '';
      table(tb, [{ k: 'n', l: 'Premio' }, { k: 'caja', l: 'Caja' }, { k: 't', l: 'Tipo' }, { k: 'p', l: 'En su caja (%)', t: 'num' }, { k: 'real', l: 'Por captura (%)', t: 'num' }], T.flatMap(t => (t.lista || []).map(p => ({ n: p.n, t: p.t, p: p.p, caja: t.n, real: Math.round(p.p * t.pct) / 100 }))), { filters: ['caja', 't'], sort: 'real', name: 'pesca-premios-' + zona });
    };
    $$('.pz-zona button', el).forEach(b => b.addEventListener('click', () => { zona = b.dataset.z; $$('.pz-zona button', el).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); pintaZona(); }));
    pintaZona();
    el.pescaZona = z => { const b = $(`.pz-zona [data-z="${z}"]`, el); if (b) b.click(); };
    table($('#tbr', el), [{ k: 'rango', l: 'Rango' }, { k: 'cajas', l: 'Más cajas (%)', t: 'num' }, { k: 'suerte', l: 'Suerte (%)', t: 'num' }, { k: 'mordida', l: 'Pican antes (%)', t: 'num' }, { k: 'doble', l: 'Premio doble (%)', t: 'num' }, { k: 'talla', l: 'Peces más grandes (%)', t: 'num' }, { k: 'venta', l: 'Venta (%)', t: 'num' }, { k: 'percances', l: 'Menos percances (%)', t: 'num' }], P.rangos, { name: 'pesca-rangos' });
    table($('#tbf', el), [{ k: 'n', l: 'Pez' }, { k: 'rareza', l: 'Rareza' }, { k: 'zona', l: 'Dónde' }, { k: 'min', l: 'Talla mín. (cm)', t: 'num' }, { k: 'max', l: 'Talla máx. (cm)', t: 'num' }, { k: 'base', l: 'Precio base', t: 'num' }, { k: 'kg', l: 'Por kg', t: 'num' }], P.peces, { filters: ['rareza', 'zona'], sort: 'kg', name: 'pesca-peces' });
    table($('#tbx', el), [{ k: 'n', l: 'Percance' }, { k: 'pct', l: 'De los percances (%)', t: 'num' }], P.extrema.percances, { sort: 'pct', name: 'pesca-percances' });
  },
  mundo(el) {
    const C = { Piedra: 'var(--min-piedra)', Hierro: 'var(--min-hierro)', Carbón: 'var(--min-carbon)', Oro: 'var(--min-oro)', Redstone: 'var(--min-redstone)', Lapislázuli: 'var(--min-lapis)', Diamante: 'var(--min-diamante)', Esmeralda: 'var(--min-esmeralda)', Escombros: 'var(--min-escombros)' };
    el.innerHTML = head('mundo', 'Mundo y servicios', 'Minions, protecciones, minas, spawners y otros servicios.', [['Minas', D.minas.length], ['Minions', D.minions.length]]) +
      sect('Minas (lo que sale al picar)', `<div class="cards">${D.minas.map((m, n) => `<div class="cc glass spot rv" style="--d:${n * 80}ms"><h3>${esc(m.mina)}</h3><div class="mlabel"><span>Se rellena cada</span><b>${esc(m.reinicio)}</b></div><div class="stack">${Object.entries(m.comp).map(([k, v], i) => `<span style="--w:${v}%;--i:${i};background:${C[k]}" title="${k} ${fmt(v)} %">${v >= 6 ? fmt(Math.round(v)) + '%' : ''}</span>`).join('')}</div><div class="kv">${Object.entries(m.comp).map(([k, v]) => `<span>${k}</span><span>${fmt(v)} %</span>`).join('')}</div></div>`).join('')}</div><div class="legend rv">${Object.entries(C).map(([k, v]) => `<span><b style="background:${v}"></b>${k}</span>`).join('')}</div>`, '01') +
      sect('Minions: coste de subir al nivel 10', '<div id="mn" class="rv"></div>', '02') +
      sect('Protecciones', `<div class="cards">${[['16×16', '20.000', 'yellow_glazed_terracotta'], ['32×32', '60.000', 'lime_glazed_terracotta'], ['64×64', '120.000', 'light_blue_glazed_terracotta'], ['128×128', 'solo web', 'magenta_glazed_terracotta'], ['256×256', 'solo web', 'red_glazed_terracotta']].map(([s, p, i], n) => `<div class="cc glass spot rv" style="--d:${n * 60}ms"><h3>${s}</h3><div class="kv"><span>Precio</span><span>${p}</span></div></div>`).join('')}</div>`, '03') + fichas('mundo');
    table($('#mn', el), [{ k: 'minion', l: 'Minion' }, { k: 'n1', l: 'Nivel 1' }, { k: 'n10', l: 'Nivel 10' }, { k: 'coste', l: 'Coste total', t: 'bar' }], D.minions, { sort: 'coste', name: 'minions' });
  },
};

// ---------- gráfico de playtime con tooltip
function chartPlaytime(box) {
  const P = D.playtime, W = 960, H = 280, L = 52, R = 18, T = 18, Bm = 34;
  const mx = Math.max(...P.map(p => p.horas || 0)), x = i => L + i * (W - L - R) / (P.length - 1), y = h => H - Bm - (h / mx) * (H - Bm - T);
  const pts = P.map((p, i) => [x(i), y(p.horas || 0)]);
  const d = 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' L');
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  box.innerHTML = `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Horas necesarias por nivel de playtime" style="--len:${Math.ceil(len)}">
    <defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" style="stop-color:var(--graf-a)"/><stop offset=".7" style="stop-color:var(--graf-b)"/><stop offset="1" style="stop-color:var(--graf-c)"/></linearGradient>
    <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--az);stop-opacity:.32"/><stop offset="1" style="stop-color:var(--az);stop-opacity:0"/></linearGradient></defs>
    <g class="gl">${[0, .25, .5, .75, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(mx * f)}" y2="${y(mx * f)}"/>`).join('')}</g>
    <g>${[0, .25, .5, .75, 1].map(f => `<text x="${L - 10}" y="${y(mx * f) + 4}" text-anchor="end">${Math.round(mx * f)} h</text>`).join('')}${[1, 25, 50, 75, P.length].map(n => `<text x="${x(n - 1)}" y="${H - 10}" text-anchor="middle">nv ${P[n - 1] ? P[n - 1].nivel : n}</text>`).join('')}</g>
    <path class="ar" d="${d} L${x(P.length - 1)},${H - Bm} L${L},${H - Bm} Z" fill="url(#ag)"/>
    <path class="ln" d="${d}"/>
    <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="5" style="fill:var(--graf-c)"><animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite"/></circle>
    <g class="cross"><line class="cx" y1="${T}" y2="${H - Bm}" style="stroke:var(--graf-guia);stroke-opacity:.4" stroke-dasharray="3 4"/><circle class="cd" r="6" style="fill:var(--graf-fondo);stroke:var(--graf-b)" stroke-width="2.5"/></g>
    <rect class="hit" x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent"/></svg><div class="ctip"></div></div>`;
  const svg = $('svg', box), tip = $('.ctip', box), cx = $('.cx', box), cd = $('.cd', box), wrap = $('.chart-wrap', box);
  const move = e => {
    const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
    const i = Math.max(0, Math.min(P.length - 1, Math.round((px - L) / (W - L - R) * (P.length - 1)))), p = P[i];
    cx.setAttribute('x1', pts[i][0]); cx.setAttribute('x2', pts[i][0]); cd.setAttribute('cx', pts[i][0]); cd.setAttribute('cy', pts[i][1]);
    tip.innerHTML = `<b>Nivel ${p.nivel}</b><div><span>Horas</span><span>${fmt(p.horas)}</span></div><div><span>Dinero</span><span>${fmt(p.dinero)}</span></div><div><span>MobCoins</span><span>${fmt(p.mobcoins)}</span></div><div><span>Niveles de XP</span><span>${fmt(p.exp)}</span></div>${p.extras ? `<div><span>Extras</span><span>${esc(p.extras)}</span></div>` : ''}`;
    const wr = wrap.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, tpx = pts[i][0] / W * wr.width, tpy = pts[i][1] / H * wr.height;
    // Dosa 02/11: que el recuadro no se salga de la gráfica (arriba del todo se pone debajo del punto; en los bordes, hacia dentro)
    tip.style.left = Math.max(tw / 2 + 8, Math.min(wr.width - tw / 2 - 8, tpx)) + 'px'; tip.style.top = tpy + 'px';
    tip.style.transform = tpy - th - 14 < 0 ? 'translate(-50%, 16px)' : 'translate(-50%, calc(-100% - 14px))';
  };
  svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move);
}

// ---------- tooltip de Minecraft
const mctip = document.createElement('div'); mctip.className = 'mctip'; mctip.setAttribute('aria-hidden', 'true'); document.body.appendChild(mctip);
const BYID = { a: new Map(D.armaduras.map(x => [String(x.id), x])), w: new Map(D.armas.map(x => [String(x.id), x])), n: new Map(D.anomalias.map(x => [String(x.id), x])) };
const r = (k, v) => `<span class="r"><span>${k}</span><b>${v}</b></span>`;
const TIPF = {
  a: s => `<span class="t" style="color:${TC[s.tier]}">${esc(s.nombre)}</span><span class="sub">${esc(s.origen)}</span>${r('Poder', fmt(s.poder))}${r('Armadura', '+' + fmt(s.armadura))}${r('Dureza', '+' + fmt(s.dureza))}${r('Vida extra', '+' + fmt(s.vida))}<span class="l">Tier ${s.tier} · clic para ver la ficha</span>`,
  w: a => `<span class="t" style="color:${TC[a.tier]}">${esc(a.nombre)}</span><span class="sub">${esc(a.clase)} · ${esc(a.origen)}</span>${r('Daño', fmt(a.dano))}${r('Crítico', a.critico + ' %')}${r('Daño crítico', fmt(a.max))}${r('Poder', fmt(a.poder))}<span class="l">Tier ${a.tier} · clic para ver la ficha</span>`,
  n: a => `<span class="t" style="color:${TC[a.tier]}">${esc(a.nombre)}</span><span class="sub">${esc(a.clase)} · ${esc(a.bioma || '')}</span>${r('Vida', fmt(a.vida))}${r('Daño medio', fmt(Math.round(a.dano_real)))}${r('Habilidades', fmt(a.habilidades))}${r('MobCoins', fmt(a.mobcoins))}<span class="l">Tier ${a.tier} · clic para ver la ficha</span>`
};
let tipEl = null;
TIPF.e = x => `<span class="t" style="color:${AE_C[x.tn] || TC[x.tier]}">${esc(x.nombre)}</span><span class="sub">${esc(x.tn)} · ${esc(x.para || '')}</span>${x.desc ? `<span class="pt-lh" style="color:var(--mc-7)">${esc(x.desc)}</span>` : ''}${r('Niveles', fmt(x.niveles))}${x.efecto ? `<span class="pt-h">Al nivel máximo</span><span class="pt-in">${esc(x.efecto)}</span>` : ''}<span class="l">Clic para ver cada libro</span>`;
TIPF.p = f => premioTip(f);
TIPF.m = f => premioTip({ ...f, p: undefined });
const placeTip = e => { const w = mctip.offsetWidth, h = mctip.offsetHeight; let x = e.clientX + 18, y = e.clientY - 12; if (x + w > innerWidth - 8) x = e.clientX - w - 18; if (y + h > innerHeight - 8) y = innerHeight - h - 8; mctip.style.transform = `translate(${x}px,${Math.max(8, y)}px)`; };
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return; const t = e.target.closest && e.target.closest('[data-tip]');
  if (t === tipEl) return; tipEl = t; if (!t) { mctip.classList.remove('on'); return; }
  const [k, ...rest] = t.dataset.tip.split(':'), it = BYID[k] && BYID[k].get(rest.join(':'));
  if (!it) { mctip.classList.remove('on'); return; }
  mctip.innerHTML = TIPF[k](it); mctip.classList.add('on'); placeTip(e);
});
document.addEventListener('pointermove', e => { if (tipEl) placeTip(e); }, { passive: true });
document.addEventListener('pointerdown', () => { mctip.classList.remove('on'); tipEl = null; });
addEventListener('scroll', () => { if (tipEl) { mctip.classList.remove('on'); tipEl = null; } }, { passive: true });

// ---------- router
const built = {}; let current = null;
function show(id) {
  if (!B[id]) id = 'inicio';
  if (current === id) return;
  const first = current === null;
  const run = () => {
    $$('.view', main).forEach(v => { const on = v.id === 'v-' + id; v.classList.toggle('on', on); if (!on) v.classList.remove('ent'); });
    if (!built[id]) { const v = document.createElement('section'); v.className = 'view on'; v.id = 'v-' + id; v.setAttribute('aria-label', VI[id].t); main.appendChild(v); B[id](v); v.insertAdjacentHTML('beforeend', footer()); hydrate(v); built[id] = v; }
    const v = built[id]; v.classList.remove('ent');
    requestAnimationFrame(() => requestAnimationFrame(() => v.classList.add('ent')));
    reveal(v);
    $$('a', nav).forEach(a => { const on = a.dataset.v === id; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = id === 'inicio' ? 'EDERUSDEX | EDERUS' : VI[id].t + ' · EDERUSDEX | EDERUS';
  };
  current = id;
  run();  // sin startViewTransition: la «foto» de la página entera en cada cambio de vista era lo que más pesaba
}
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [path, q] = h.split('--'); const [v, id] = path.split('/');
  closeDrawer(); show(v || 'inicio'); closeNav();
  if (id && PZOPEN[v]) setTimeout(() => PZOPEN[v](id), first ? 300 : 120);
  if (id && FIND[v]) { const [list, fn] = FIND[v]; const it = list().find(x => String(x.id) === id); if (it) setTimeout(() => fn(it), first ? 300 : 120); }
  if (q) setTimeout(() => { const tb = built[v] && $('#tb', built[v]); if (tb && tb.setFilter) { tb.setFilter(q); tb.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, 220);
  first = false;
}
let first = true;
window.addEventListener('hashchange', route);

// ---------- menú móvil
const mb = $('#mbtn');
const closeNav = () => { nav.classList.remove('show'); mb.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
mb.addEventListener('click', () => { const s = nav.classList.toggle('show'); mb.setAttribute('aria-expanded', s); document.body.style.overflow = s ? 'hidden' : ''; });
nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });

// ---------- buscador global (paleta)
const IDX = [...D.armaduras.map(s => ({ t: s.nombre, s: 'Armadura · ' + s.origen + ' · ' + NF.format(s.poder), v: 'tl-armaduras/' + s.id, i: ico(s.icon, s.dye), g: 'Armaduras', w: 6 })),
  ...D.armas.map(a => ({ t: a.nombre, s: 'Arma · ' + a.clase + ' · ' + NF.format(a.poder), v: 'tl-armas/' + a.id, i: ico(a.icon), g: 'Armas', w: 5 })),
  ...D.anomalias.map(a => ({ t: a.nombre, s: 'Anomalía · ' + a.clase, v: 'tl-anomalias/' + a.id, i: face(a), g: 'Anomalías', w: 6 })),
  ...D.premios.map(p => ({ t: p.premio, s: 'Premio · Caja ' + p.caja + ' · ' + NF.format(p.pct) + ' %', v: 'cajas', i: tag('Caja'), f: p.premio, g: 'Premios', w: 2 })),
  ...D.encantamientos.map(e => ({ t: e.nombre, s: 'Encantamiento · ' + e.tier + ' · ' + e.para, v: 'encantamientos', i: tag('Enc'), f: e.nombre, g: 'Encantamientos', w: 3 })),
  ...D.jefes.map(j => ({ t: j.mob, s: 'Mob de mazmorra · ' + NF.format(j.vida) + ' de vida', v: 'mazmorras', i: mobFace(j), f: j.mob, g: 'Mazmorras', w: 3 })),
  ...D.mascotas.map(m => ({ t: m.mascota, s: 'Mascota · ' + (m.fuente || ''), v: 'mascotas', i: ico(m.icon), f: m.mascota, g: 'Mascotas', w: 2 })),
  ...D.tags.map(t => ({ t: t.tag, s: 'Tag · ' + t.categoria, v: 'tags', i: tag('Tag'), f: t.tag, g: 'Tags', w: 1 })),
  ...D.mc_tiendas.map(t => ({ t: t.articulo, s: t.tienda + ' · ' + NF.format(t.precio) + ' MC', v: 'economia', i: tag('MC'), f: t.articulo, g: 'Tiendas de MobCoins', w: 1 })),
  ...VIEWS.map(v => ({ t: v.t, s: 'Sección' + (v.d ? ' · ' + v.d : ''), v: v.id, i: ico(v.ic), g: 'Secciones', w: 9 }))].map(e => ({ ...e, n: norm(e.t + ' ' + e.s), nt: norm(e.t) }));
const pal = $('#pal'), q = $('#q'), res = $('#res'); let hits = [], sel = 0, palBack = null;
function openPal(pre = '') { palBack = document.activeElement; pal.classList.add('on'); q.value = pre; search(); setTimeout(() => q.focus(), 30); }
function closePal() { pal.classList.remove('on'); if (palBack && palBack.focus) palBack.focus({ preventScroll: true }); }
function search() {
  const v = norm(q.value.trim()); sel = 0;
  if (v.length < 2) {
    const sug = ['Veyra', 'Llave Legendaria', 'Vampiro', 'Monarch', 'Quimera', 'Elytra'];
    hits = IDX.filter(e => e.g === 'Secciones');
    res.innerHTML = `<div class="pal__grp">Prueba con</div><div class="pal__sug">${sug.map(s => `<button type="button" class="tg plain" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="pal__grp">Secciones</div>` + hits.map((h, i) => item(h, i)).join('');
    hydrate(res); mark(); return;
  }
  const ts = v.split(/\s+/), re = mkRe(ts[0]);
  hits = IDX.filter(e => ts.every(t => e.n.includes(t))).map(e => ({ e, sc: (e.nt === v ? 100 : 0) + (e.nt.startsWith(ts[0]) ? 30 : 0) + (e.nt.includes(v) ? 10 : 0) + e.w })).sort((a, b) => b.sc - a.sc).slice(0, 50).map(x => x.e);
  if (!hits.length) { res.innerHTML = `<div class="pal__empty">Sin resultados para “${esc(q.value)}”. Prueba con otra palabra.</div>`; return; }
  const groups = []; hits.forEach(h => { let g = groups.find(x => x.g === h.g); if (!g) groups.push(g = { g: h.g, l: [] }); g.l.push(h); });
  hits = groups.flatMap(g => g.l);
  let i = 0; res.innerHTML = groups.map(g => `<div class="pal__grp">${esc(g.g)} · ${g.l.length}</div>` + g.l.map(h => item(h, i++, re)).join('')).join('');
  hydrate(res); mark();
}
const item = (h, i, re) => `<a role="option" data-i="${i}" href="#${h.v}">${h.i}<span><b>${hl(h.t, re)}</b><small>${esc(h.s)}</small></span><span class="go">Abrir ↵</span></a>`;
function mark() { $$('a[data-i]', res).forEach((a, i) => { a.classList.toggle('sel', i === sel); a.setAttribute('aria-selected', i === sel); if (i === sel) a.scrollIntoView({ block: 'nearest' }); }); }
function pick(h) {
  closePal(); if (!h) return;
  const [view] = h.v.split('/');
  if (location.hash.slice(1) === h.v) route(); else location.hash = h.v;
  if (h.f) setTimeout(() => { const tb = built[view] && $('#tb', built[view]); if (tb && tb.setFilter) { tb.setFilter(h.f); tb.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, 180);
}
q.addEventListener('input', search);
q.addEventListener('keydown', e => {
  const n = $$('a[data-i]', res).length;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (n) { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; mark(); } }
  if (e.key === 'Enter') { e.preventDefault(); pick(hits[sel]); }
});
res.addEventListener('click', e => {
  const s = e.target.closest('[data-s]'); if (s) { q.value = s.dataset.s; search(); q.focus(); return; }
  const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); pick(hits[+a.dataset.i]);
});
res.addEventListener('mousemove', e => { const a = e.target.closest('a[data-i]'); if (a && +a.dataset.i !== sel) { sel = +a.dataset.i; mark(); } });
pal.addEventListener('click', e => { if (e.target === pal) closePal(); });
$('#qbtn').addEventListener('click', () => openPal());
$('#kbdk').textContent = MAC ? '⌘ K' : 'Ctrl K';
document.addEventListener('click', e => { if (e.target.closest('[data-open-search]')) { e.preventDefault(); openPal(); } });

// ---------- teclado global
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('on') ? closePal() : openPal(); return; }
  if (e.key === 'Escape') { if (pal.classList.contains('on')) closePal(); else if (cmpEl.classList.contains('on')) closeCmp(); else if (dr.classList.contains('on')) closeDrawer(); else closeNav(); return; }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openPal(); }
});

// ---------- scroll: progreso + volver arriba
const prog = $('#prog'), totop = $('#totop'); let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { const m = document.documentElement.scrollHeight - innerHeight; prog.style.setProperty('--p', m > 0 ? (scrollY / m).toFixed(4) : 0); totop.classList.toggle('on', scrollY > 700); ticking = false; });
}, { passive: true });
totop.addEventListener('click', () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

// ---------- arranque
route();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));
})();
