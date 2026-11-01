#!/usr/bin/env python3
"""Copia los datos de un index.html generado por build_doc.py a assets/data.js.

El diseño (index.html, assets/docmetry.css y assets/docmetry.js) ya no se toca
al regenerar: solo cambian los datos.

Uso:
    python build_doc.py --publico          # genera el index.html de siempre
    python tools/actualizar_datos.py ruta/al/index.html_generado

Si no se pasa ruta, busca un index.html "antiguo" (con `const D=` dentro).
"""
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "data.js"


def extraer(texto: str, nombre: str):
    marca = f"const {nombre}="
    i = texto.find(marca)
    if i < 0:
        return None
    i += len(marca)
    valor, _ = json.JSONDecoder().raw_decode(texto[i:])
    return valor


def main() -> None:
    origen = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / "index.html"
    texto = origen.read_text(encoding="utf-8")
    datos = extraer(texto, "D")
    if datos is None:
        sys.exit(f"No encuentro `const D=` en {origen}. Pasa el index.html que genera build_doc.py.")
    fichas = extraer(texto, "FICHAS") or {}
    salida = (
        "/* Datos del Survival de Ederus. Generado con tools/actualizar_datos.py: no editar a mano. */\n"
        "window.D=" + json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + ";\n"
        "window.FICHAS=" + json.dumps(fichas, ensure_ascii=False, separators=(",", ":")) + ";\n"
    )
    DESTINO.write_text(salida, encoding="utf-8")
    print(f"OK · {DESTINO.relative_to(RAIZ)} ({len(salida) // 1024} KB) · " +
          ", ".join(f"{k}: {len(v)}" for k, v in datos.items() if isinstance(v, list)))


if __name__ == "__main__":
    main()
