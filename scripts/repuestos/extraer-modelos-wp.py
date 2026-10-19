# Extrae del XML de exportación de WordPress el CONTENIDO de cada página de
# MODELO de repuestos (decisión del cliente, 2026-10-17: se migra todo TAL
# CUAL, erratas incluidas), para `importar-modelos-wp.ts`:
#
#   - el antetítulo («Repuestos para Maquinaria Pesada») y el título
#     («HITACHI Excavadora ZX200»), los dos primeros títulos de la sección
#     principal visible en escritorio;
#   - el párrafo largo de esa sección (el texto, con sus saltos de párrafo);
#   - el título «repuestos disponibles para …»;
#   - la lista de piezas («- Filtros para …») y si WordPress la PINTA: visible
#     en algún tamaño (27 páginas) u oculta en los tres (el resto);
#   - las plantillas de categorías incrustadas (`[elementor-template id=…]`),
#     que dependen del tipo de máquina (43095 excavadoras y buldóceres, 43307
#     cargadores y motoniveladoras…). La 37457 es el formulario: no cuenta.
#
# La exportación completa contiene DATOS PERSONALES (usuarios y comentarios):
# este script NO lee autores, usuarios ni comentarios. Ni el XML ni la salida
# van al repositorio: la salida se guarda en Desktop\partequipos-cierre\.
#
# Uso:  python -I scripts/repuestos/extraer-modelos-wp.py <exportacion.xml> <salida.json>
import html
import json
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import WP, ajustes, arbol_elementor, recorrer, ruta_de, tipo_de  # noqa: E402

fichero, salida = sys.argv[1], sys.argv[2]
RAIZ = "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/"
FORMULARIO = "37457"


def plano(t):
    """Texto plano de un título: sin etiquetas y con los espacios normalizados."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t or ""))).strip()


def parrafos(t):
    """El texto de un editor, con un salto de línea en blanco entre párrafos."""
    t = re.sub(r"(?i)<br\s*/?>", "\n", t or "")
    t = re.sub(r"(?i)</p>\s*", "\n\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    bloques = [re.sub(r"[ \t]+", " ", b).strip() for b in re.split(r"\n\s*\n", t)]
    return "\n\n".join(b for b in bloques if b)


def oculto_en(s):
    return {k for k in ("desktop", "tablet", "mobile") if s.get(f"hide_{k}")}


def recorrer_widgets(nodos, ocultos=frozenset()):
    """(widget, tamaños en los que está oculto, heredando de sus contenedores)."""
    for n in nodos or []:
        if not isinstance(n, dict):
            continue
        oc = frozenset(ocultos | oculto_en(ajustes(n)))
        if n.get("elType") == "widget":
            yield n, oc
        else:
            yield from recorrer_widgets(n.get("elements"), oc)


TODOS = frozenset({"desktop", "tablet", "mobile"})
paginas = []


def al_pagina(el):
    ruta = ruta_de(el)
    if not ruta.startswith(RAIZ) or el.findtext(WP + "status") != "publish":
        return
    if len([x for x in ruta[len(RAIZ):].split("/") if x]) < 3:
        return
    arbol = [n for n in arbol_elementor(el) if isinstance(n, dict)]

    # Sección principal: la primera sección VISIBLE EN ESCRITORIO con dos títulos.
    antetitulo = titulo = parrafo = ""
    for seccion in arbol:
        ws = [(w, oc) for w, oc in recorrer_widgets([seccion]) if "desktop" not in oc]
        titulos = [plano(ajustes(w).get("title")) for w, _ in ws if tipo_de(w) == "heading"]
        textos = [ajustes(w).get("editor") or "" for w, _ in ws if tipo_de(w) == "text-editor"]
        textos = [t for t in textos if "elementor-template" not in t]
        if len(titulos) >= 2 and textos:
            antetitulo, titulo, parrafo = titulos[0], titulos[1], parrafos(textos[0])
            break

    disponibles = ""
    piezas, visibles = [], False
    plantillas = []
    for w, oc in recorrer_widgets(arbol):
        s, t = ajustes(w), tipo_de(w)
        if t == "heading":
            texto = plano(s.get("title"))
            if not disponibles and texto.lower().startswith("repuestos disponibles") and oc != TODOS:
                disponibles = texto
            elif texto.startswith("-"):
                piezas.append(texto)
                visibles = visibles or oc != TODOS
        elif t in ("text-editor", "shortcode", "template") and oc != TODOS:
            fuente = s.get("editor") or s.get("shortcode") or ""
            ids = re.findall(r'elementor-template id=\\?"(\d+)', fuente)
            if t == "template" and s.get("template_id"):
                ids.append(str(s.get("template_id")))
            plantillas += [i for i in ids if i != FORMULARIO]

    paginas.append(
        {
            "ruta": ruta,
            "tituloWp": el.findtext("title"),
            "antetitulo": antetitulo,
            "titulo": titulo,
            "parrafo": parrafo,
            "disponibles": disponibles,
            "piezas": piezas,
            "piezasVisibles": visibles and bool(piezas),
            "plantillas": plantillas,
        }
    )


recorrer(fichero, al_pagina)
paginas.sort(key=lambda p: p["ruta"])
with open(salida, "w", encoding="utf-8") as f:
    json.dump(paginas, f, ensure_ascii=False, indent=1)

print(f"páginas de modelo: {len(paginas)}")
print(f"  sin título: {sum(1 for p in paginas if not p['titulo'])}")
print(f"  sin párrafo: {sum(1 for p in paginas if not p['parrafo'])}")
print(f"  sin «repuestos disponibles»: {sum(1 for p in paginas if not p['disponibles'])}")
print(f"  con lista de piezas: {sum(1 for p in paginas if p['piezas'])} (visible en {sum(1 for p in paginas if p['piezasVisibles'])})")
print(f"  plantillas: {dict(Counter(','.join(p['plantillas']) or 'ninguna' for p in paginas))}")
