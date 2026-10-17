# Extrae del XML de exportación de WordPress los ADITAMENTOS, para `importar.ts`.
# Estudio y decisiones de dirección (2026-10-16): `docs/aditamentos-importacion.md`.
#
# Dos fuentes, las dos de lo VISIBLE de la web original:
# - NUEVOS: el catálogo de 2025, la página de repuestos «Aditamentos para
#   maquinaria pesada» (36750). Cada tarjeta es una columna con un carrusel de
#   una foto y un título («MARTILLO PARA MAQUINARIA PESADA»); el título de
#   sección («ADITAMENTOS para Excavadoras» / «… Minicargadores») dice el tipo.
#   La lista de cada tarjeta está oculta en los tres tamaños: no se lee.
# - USADOS: las 4 unidades de `…/marcas/aditamentos/aditamentos/` (1099), con
#   carrusel, dos títulos (categoría y modelo) y una lista de datos.
#
# El NÚMERO DE SERIE no sale de aquí: las líneas «Serial» de la lista se
# descartan al leerlas. Tampoco se leen autores ni comentarios (la exportación
# los trae con correo e IP). Ni el XML ni la salida van al repositorio.
#
# Uso:  python -I scripts/aditamentos/extraer-xml.py <exportacion.xml> <salida.json>
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import ajustes, arbol_elementor, recorrer, tipo_de  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
fichero, salida = sys.argv[1], sys.argv[2]

ID_NUEVOS, ID_USADOS = "36750", "1099"
TIPOS = {"excavadoras": "excavadoras", "minicargadores": "minicargadores"}

paginas = {}


def al_pagina(el):
    pid = el.findtext("{http://wordpress.org/export/1.2/}post_id")
    if pid in (ID_NUEVOS, ID_USADOS):
        meta = {
            pm.findtext("{http://wordpress.org/export/1.2/}meta_key"): pm.findtext("{http://wordpress.org/export/1.2/}meta_value")
            for pm in el.findall("{http://wordpress.org/export/1.2/}postmeta")
        }
        paginas[pid] = {
            "fechaGmt": el.findtext("{http://wordpress.org/export/1.2/}post_date_gmt") or "",
            "enlace": el.findtext("link") or "",
            "metadesc": meta.get("_yoast_wpseo_metadesc") or "",
            "arbol": arbol_elementor(el),
        }


adjuntos = recorrer(fichero, al_pagina)
faltan = {ID_NUEVOS, ID_USADOS} - set(paginas)
if faltan:
    sys.exit(f"faltan páginas en la exportación: {sorted(faltan)}")


def oculto(e):
    s = ajustes(e)
    return bool(s.get("hide_desktop") and s.get("hide_tablet") and s.get("hide_mobile"))


def texto(valor):
    """Texto plano de un título o una línea: sin etiquetas, entidades ni espacios de más."""
    sin = re.sub(r"<br\s*/?>", " ", valor or "", flags=re.I)
    sin = re.sub(r"<[^>]+>", "", sin)
    return re.sub(r"\s+", " ", html.unescape(sin)).strip()


def visibles(nodos):
    """Widgets visibles (no ocultos en los tres tamaños) de un árbol, en orden."""
    for e in nodos:
        if not isinstance(e, dict) or oculto(e):
            continue
        if e.get("elType") == "widget":
            yield e
        yield from visibles(e.get("elements") or [])


def columnas(nodos):
    """Columnas visibles, en orden (también las anidadas)."""
    for e in nodos:
        if not isinstance(e, dict) or oculto(e):
            continue
        if e.get("elType") == "column":
            yield e
        yield from columnas(e.get("elements") or [])


def fotos_de(w):
    fotos = []
    for item in ajustes(w).get("carousel") or []:
        aid = item.get("id")
        if aid and int(aid) in adjuntos:
            fotos.append({"idWp": int(aid), **adjuntos[int(aid)]})
    return fotos


# ---------- Nuevos (catálogo de 2025) ----------

nuevos = []
tipo = None
for col in columnas(paginas[ID_NUEVOS]["arbol"]):
    ws = [w for w in visibles(col.get("elements") or []) if tipo_de(w) in ("heading", "image-carousel")]
    titulos = [texto(ajustes(w).get("title")) for w in ws if tipo_de(w) == "heading"]
    titulos = [t for t in titulos if t]
    carrusel = next((w for w in ws if tipo_de(w) == "image-carousel"), None)
    if not carrusel:
        # Un título de sección: «ADITAMENTOS para Excavadoras».
        m = re.match(r"aditamentos para (\w+)", " ".join(titulos), re.I)
        if m and m.group(1).lower() in TIPOS:
            tipo = TIPOS[m.group(1).lower()]
        continue
    if not tipo or not titulos:
        sys.exit(f"tarjeta de nuevos sin tipo o sin título: {titulos}")
    nuevos.append({"tipo": tipo, "titulo": titulos[0], "fotos": fotos_de(carrusel)})

# ---------- Usados (las 4 unidades) ----------

usados = []
for col in columnas(paginas[ID_USADOS]["arbol"]):
    ws = list(visibles(col.get("elements") or []))
    carrusel = next((w for w in ws if tipo_de(w) == "image-carousel"), None)
    if not carrusel:
        continue
    titulos = [texto(ajustes(w).get("title")) for w in ws if tipo_de(w) == "heading"]
    lineas = []
    for w in ws:
        if tipo_de(w) == "icon-list":
            for item in ajustes(w).get("icon_list") or []:
                linea = texto(item.get("text"))
                # El serial nunca sale de aquí (dirección, 2026-10-07).
                if linea and not re.match(r"serial\b", linea, re.I):
                    lineas.append(linea)
    fotos = fotos_de(carrusel)
    if len(titulos) < 2 or not fotos:
        sys.exit(f"unidad usada incompleta: {titulos}")
    usados.append(
        {
            # Las unidades no tienen página propia en WordPress: se identifican por su primera foto.
            "idWp": fotos[0]["idWp"],
            "categoria": titulos[0],
            "modelo": titulos[1],
            "datos": lineas,
            "fotos": fotos,
        }
    )

datos = {
    "fuente": os.path.basename(fichero),
    # Las 4 unidades no tienen página propia: comparten la fecha de la página que las lista.
    "categoriaUsada": {
        "enlace": paginas[ID_USADOS]["enlace"],
        "metadesc": paginas[ID_USADOS]["metadesc"],
        "fechaGmt": paginas[ID_USADOS]["fechaGmt"],
    },
    "nuevos": nuevos,
    "usados": usados,
}
with open(salida, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)
print(
    f"nuevos: {len(nuevos)} ({sum(1 for n in nuevos if n['tipo'] == 'excavadoras')} excavadoras, "
    f"{sum(1 for n in nuevos if n['tipo'] == 'minicargadores')} minicargadores) · "
    f"usados: {len(usados)} · fotos de usados: {sum(len(u['fotos']) for u in usados)}"
)
