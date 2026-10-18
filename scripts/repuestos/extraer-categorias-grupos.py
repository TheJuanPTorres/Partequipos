# Extrae del XML de exportación de WordPress el «QUÉ INCLUYE» de las 10 categorías
# técnicas de repuestos: los grupos de cada página de categoría (nombre, foto y la
# lista de productos que despliega «VER MÁS»), para `importar-grupos-categorias.ts`.
# Estudio y decisiones: `docs/repuestos-importacion.md` §8.
#
# Qué lee, de lo VISIBLE de la web original: cada tarjeta es una columna con un
# carrusel de imágenes (se toma la primera), un título, el botón «VER MÁS» y una
# lista de iconos (clase `SPARE-texto`, oculta hasta pulsar el botón). Se saltan
# las secciones y columnas ocultas en escritorio (copias antiguas de la misma
# tarjeta) y las repetidas por su clase `seccionNNN`.
#
# La exportación completa contiene DATOS PERSONALES (usuarios y comentarios con
# correo e IP): este script NO los lee (usa `recorrer` de `scripts/wordpress`), y la
# salida no los lleva. Ni el XML ni la salida van al repositorio: la salida se guarda
# en Desktop\partequipos-cierre\.
#
# Uso:  python -I scripts/repuestos/extraer-categorias-grupos.py <exportacion.xml> <salida.json>
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import ajustes, arbol_elementor, recorrer, ruta_de, tipo_de  # noqa: E402

fichero, salida = sys.argv[1], sys.argv[2]

RAIZ = "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/"
CATEGORIAS = [
    "tren-de-rodaje-para-maquinaria-pesada",
    "filtracion-para-maquinaria-pesada",
    "herramienta-de-corte-gets-para-maquinaria-pesada",
    "lubricantes-para-maquinaria-pesada",
    "llantas-y-rines-para-maquinaria-pesada",
    "miscelaneos-para-maquinaria-pesada",
    "componentes-mayores-para-maquinaria-pesada",
    "motor-diesel-para-maquinaria-pesada",
    "transmision-para-maquinaria-pesada",
    "componentes-hidraulicos-para-maquinaria-pesada",
]


def limpio(t):
    t = html.unescape(re.sub(r"<[^>]+>", " ", t or ""))
    return re.sub(r"\s+", " ", t).strip()


def oculto(e):
    s = ajustes(e)
    return bool(s.get("hide_desktop"))


def columnas(nodos, oculto_arriba=False):
    """Las columnas con su estado: (columna, oculta en escritorio)."""
    for e in nodos:
        if not isinstance(e, dict):
            continue
        o = oculto_arriba or oculto(e)
        if e.get("elType") == "column":
            yield e, o
        yield from columnas(e.get("elements") or [], o)


paginas = {}


def al_pagina(el):
    if (el.findtext("{http://wordpress.org/export/1.2/}status") or "") != "publish":
        return
    r = ruta_de(el)
    if r.startswith(RAIZ):
        slug = r[len(RAIZ):].strip("/")
        if slug in CATEGORIAS:
            paginas[slug] = arbol_elementor(el)


recorrer(fichero, al_pagina)
faltan = [c for c in CATEGORIAS if c not in paginas]
if faltan:
    sys.exit(f"✗ no están en el XML: {faltan}")

salida_cat, avisos = [], []
for slug in CATEGORIAS:
    visibles, ocultos = [], []
    vistos = set()
    # Primero lo visible (si una tarjeta está dos veces, manda la que se ve); después lo que
    # WordPress tiene oculto, que se importa con «mostrar» desmarcado (cliente, 2026-10-18).
    cols = list(columnas(paginas[slug]))
    for pasada_oculta in (False, True):
        for c, oc in cols:
            if oc != pasada_oculta:
                continue
            ws = [w for w in c.get("elements") or [] if isinstance(w, dict)]
            lista = next((w for w in ws if tipo_de(w) == "icon-list" and "SPARE-texto" in str(ajustes(w).get("_css_classes", ""))), None)
            titulo = next((w for w in ws if tipo_de(w) == "heading"), None)
            carrusel = next((w for w in ws if tipo_de(w) == "image-carousel"), None)
            if not (lista and titulo and carrusel):
                continue
            clave = ajustes(lista).get("_css_classes")
            if clave in vistos:
                continue
            vistos.add(clave)
            productos = [limpio(it.get("text")) for it in ajustes(lista).get("icon_list") or []]
            productos = [t for t in productos if t]
            imgs = ajustes(carrusel).get("carousel") or []
            url = (imgs[0].get("url") if imgs else "") or ""
            nombre = limpio(ajustes(titulo).get("title"))
            if not url or not productos:
                avisos.append(f"{slug}: «{nombre}» sin {'imagen' if not url else 'productos'}; se salta")
                continue
            # TAL CUAL está en WordPress (decisión del cliente): nombre y lista sin corregir.
            g = {"nombre": nombre, "mostrar": not pasada_oculta, "imagen": {"url": url, "alt": nombre}, "productos": productos}
            (ocultos if pasada_oculta else visibles).append(g)
            if pasada_oculta:
                avisos.append(f"{slug}: «{nombre}» está oculto en WordPress; se importa con «Mostrar en la web» desmarcado")
    salida_cat.append({"slug": slug, "grupos": visibles + ocultos})

with open(salida, "w", encoding="utf-8") as f:
    json.dump({"categorias": salida_cat, "avisos": avisos}, f, ensure_ascii=False, indent=1)
for c in salida_cat:
    print(c["slug"], len(c["grupos"]), "grupos ·", sum(len(g["productos"]) for g in c["grupos"]), "productos")
for a in avisos:
    print("AVISO", a)
