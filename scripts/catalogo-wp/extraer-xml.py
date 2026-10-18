# Extrae del XML de exportación de WordPress las TARJETAS SUELTAS del catálogo
# que no tienen página propia, para `importar.ts` (2026-10-18, decisión del
# cliente: «se migra TODO aunque esté mal», tras la auditoría de estructura).
# Detalle: docs/catalogo-wp-tal-cual.md.
#
# Cuatro páginas, solo lo VISIBLE (lo oculto en los tres tamaños no existe):
# - 674 `…/nueva/cargadores/`: cargadores CASE W20F, 621E y 821E;
# - 825 `…/nueva/compactadores/`: vibrocompactadores Ammann (6);
# - 1054 `…/usada/bulldozer/`: bulldozers usados D3C y D39PX-21;
# - 1462 y 1483 `…/marcas/aditamentos/excavadoras/` y `…/minicargadores/`: el
#   catálogo de aditamentos de 2022 (el importador solo crea los que no están
#   en el de 2025).
#
# Cada tarjeta es una columna con un carrusel (o una imagen), los títulos (marca
# y modelo), una lista de datos y, en nueva, el botón «FICHA TÉCNICA».
#
# El NÚMERO DE SERIE no sale de aquí: las líneas «Serial» se descartan al
# leerlas. Tampoco se leen autores ni comentarios. Ni el XML ni la salida van al
# repositorio.
#
# Uso:  python -I scripts/catalogo-wp/extraer-xml.py <exportacion.xml> <salida.json>
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import WP, ajustes, arbol_elementor, recorrer, tipo_de  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
fichero, salida = sys.argv[1], sys.argv[2]

NUEVOS = {"674": "cargadores", "825": "compactadores"}
USADOS = {"1054": "bulldozer"}
ADITAMENTOS_2022 = {"1462": "excavadoras", "1483": "minicargadores"}
IDS = set(NUEVOS) | set(USADOS) | set(ADITAMENTOS_2022)

paginas = {}


def al_pagina(el):
    pid = el.findtext(WP + "post_id")
    if pid in IDS:
        paginas[pid] = {
            "enlace": el.findtext("link") or "",
            "fechaGmt": el.findtext(WP + "post_date_gmt") or "",
            "arbol": arbol_elementor(el),
        }


adjuntos = recorrer(fichero, al_pagina)
faltan = IDS - set(paginas)
if faltan:
    sys.exit(f"faltan páginas en la exportación: {sorted(faltan)}")


def oculto(e):
    s = ajustes(e)
    return bool(s.get("hide_desktop") and s.get("hide_tablet") and s.get("hide_mobile"))


def texto(valor):
    sin = re.sub(r"<br\s*/?>", " ", valor or "", flags=re.I)
    sin = re.sub(r"<[^>]+>", "", sin)
    return re.sub(r"\s+", " ", html.unescape(sin)).strip()


def columnas(nodos):
    """Columnas visibles con widgets propios, en orden (también las anidadas)."""
    for e in nodos:
        if not isinstance(e, dict) or oculto(e):
            continue
        if e.get("elType") == "column":
            yield e
        yield from columnas(e.get("elements") or [])


def widgets_propios(col):
    return [w for w in col.get("elements") or [] if isinstance(w, dict) and w.get("elType") == "widget" and not oculto(w)]


def foto(aid):
    aid = int(aid)
    return {"idWp": aid, **adjuntos[aid]} if aid in adjuntos else None


def tarjetas(pid):
    """Las columnas con foto y al menos dos títulos (rótulo y modelo)."""
    for col in columnas(paginas[pid]["arbol"]):
        ws = widgets_propios(col)
        fotos = []
        for w in ws:
            s = ajustes(w)
            if tipo_de(w) == "image-carousel":
                fotos += [f for f in (foto(i["id"]) for i in s.get("carousel") or [] if i.get("id")) if f]
            elif tipo_de(w) == "image" and isinstance(s.get("image"), dict) and s["image"].get("id"):
                fotos += [f for f in [foto(s["image"]["id"])] if f]
        titulos = [t for t in (texto(ajustes(w).get("title")) for w in ws if tipo_de(w) == "heading") if t]
        if not fotos or len(titulos) < 2:
            continue
        lineas = []
        for w in ws:
            if tipo_de(w) == "icon-list":
                for item in ajustes(w).get("icon_list") or []:
                    linea = texto(item.get("text"))
                    # El serial nunca sale de aquí (dirección, 2026-10-07).
                    if linea and not re.match(r"serial\b", linea, re.I):
                        lineas.append(linea)
        pdf = next(
            (
                (ajustes(w).get("link") or {}).get("url")
                for w in ws
                if tipo_de(w) == "button"
                and "ficha" in texto(ajustes(w).get("text")).lower()
                and ((ajustes(w).get("link") or {}).get("url") or "").lower().endswith(".pdf")
            ),
            None,
        )
        yield {"rotulo": titulos[0], "modelo": titulos[1], "datos": lineas, "fotos": fotos, "pdf": pdf}


datos = {"fuente": os.path.basename(fichero), "nuevos": [], "usados": [], "aditamentos2022": []}
for pid, categoria in NUEVOS.items():
    for t in tarjetas(pid):
        datos["nuevos"].append({"pagina": int(pid), "categoria": categoria, **t})
for pid, categoria in USADOS.items():
    for t in tarjetas(pid):
        # Sin página propia en WordPress: se identifican por su primera foto.
        datos["usados"].append(
            {"pagina": int(pid), "idWp": t["fotos"][0]["idWp"], "categoria": categoria,
             "enlace": paginas[pid]["enlace"], "fechaGmt": paginas[pid]["fechaGmt"], **t}
        )
for pid, tipo in ADITAMENTOS_2022.items():
    for t in tarjetas(pid):
        datos["aditamentos2022"].append({"pagina": int(pid), "tipo": tipo, "titulo": t["modelo"], "fotos": t["fotos"]})

with open(salida, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)
print(
    f"nuevos: {len(datos['nuevos'])} · usados: {len(datos['usados'])} · aditamentos de 2022: "
    f"{len(datos['aditamentos2022'])} · con PDF: {sum(1 for n in datos['nuevos'] if n['pdf'])}"
)
