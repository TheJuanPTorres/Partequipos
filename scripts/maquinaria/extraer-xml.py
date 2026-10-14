# Extrae del XML de exportación de WordPress las FICHAS de maquinaria nueva
# (`/maquinaria-pesada/maquinaria-pesada-nueva/marcas/<marca>/<tipo>/<ficha>/`),
# que son páginas de Elementor, para `importar-fichas.ts`.
#
# De cada ficha lee la sección principal visible en escritorio (la misma regla
# que el extractor de repuestos, en `scripts/wordpress/elementor.py`): galería,
# títulos, textos (especificaciones y descripción) y botones. Las fichas de la
# maquetación ANTIGUA (28 de 80) llevan las especificaciones y el botón del PDF
# en secciones de debajo: de ahí se toma solo el primer texto tras un título
# «Especificaciones» y el primer botón «Ficha técnica» con un PDF. Lo demás de debajo (otros
# equipos, llamadas a WhatsApp, formularios, plantillas comunes) no se lee.
# Ver docs/fichas-nuevas-importacion.md.
#
# La exportación completa contiene DATOS PERSONALES (usuarios y comentarios con
# correo e IP): este script NO los lee, y la salida no los lleva. Ni el XML ni la
# salida van al repositorio: la salida se guarda en Desktop\partequipos-cierre\.
#
# Uso:  python -I scripts/maquinaria/extraer-xml.py <exportacion.xml> <salida.json>
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import WP, ajustes, arbol_elementor, recorrer, ruta_de, seccion_principal, tipo_de, widgets  # noqa: E402

fichero, salida = sys.argv[1], sys.argv[2]
RAIZ = "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/"

fichas = []


def al_pagina(el):
    ruta = ruta_de(el)
    if not (ruta.startswith(RAIZ) and el.findtext(WP + "status") == "publish"):
        return
    segmentos = [x for x in ruta[len(RAIZ):].split("/") if x]
    if len(segmentos) != 3:
        return  # marcas (1) y tipos (2) no son fichas
    arbol = arbol_elementor(el)
    principal = seccion_principal(arbol)
    titulos, textos, galeria, imagenes, botones = [], [], [], [], []
    for w in widgets([principal] if principal else []):
        s, t = ajustes(w), tipo_de(w)
        if t == "heading":
            titulos.append(s.get("title") or "")
        elif t == "text-editor":
            textos.append(s.get("editor") or "")
        elif t == "image-carousel":
            galeria += [int(i["id"]) for i in s.get("carousel") or [] if isinstance(i, dict) and i.get("id")]
        elif t == "image" and isinstance(s.get("image"), dict) and s["image"].get("id"):
            imagenes.append(int(s["image"]["id"]))
        elif t == "button":
            botones.append({"texto": s.get("text") or "", "url": (s.get("link") or {}).get("url") or ""})
    # Fuera de la sección principal: el texto que sigue a «Especificaciones» y los botones a un PDF.
    especificaciones_fuera, tras_titulo = None, False
    resto = [e for e in arbol if e is not principal]
    for w in widgets(resto):
        s, t = ajustes(w), tipo_de(w)
        if t == "heading" and "especificaciones" in (s.get("title") or "").lower():
            tras_titulo = True
        elif t == "text-editor" and tras_titulo and especificaciones_fuera is None:
            especificaciones_fuera = s.get("editor") or ""
        elif (
            t == "button"
            and not any(b["url"].lower().endswith(".pdf") for b in botones)
            and "ficha" in (s.get("text") or "").lower()
            and ((s.get("link") or {}).get("url") or "").lower().endswith(".pdf")
        ):
            # Solo el primer botón «Ficha técnica»: algunos bloques comunes de debajo enlazan
            # hasta 19 PDF de otros equipos.
            botones.append({"texto": s.get("text") or "", "url": s["link"]["url"]})
    fichas.append({
        "idWp": int(el.findtext(WP + "post_id")),
        "ruta": ruta,
        "titulo": el.findtext("title") or "",
        "segmentos": segmentos,
        "titulos": titulos,
        "textos": textos,
        "galeria": galeria,
        "imagenes": imagenes,
        "botones": botones,
        "especificacionesFuera": especificaciones_fuera,
    })


adjuntos = recorrer(fichero, al_pagina)

for f in fichas:
    # Un id sin adjunto en la exportación sale con `url` vacía: el importador lo omite y avisa.
    f["galeria"] = [{"idWp": i, **adjuntos.get(i, {"url": None, "alt": ""})} for i in f["galeria"]]
    f["imagenes"] = [{"idWp": i, **adjuntos.get(i, {"url": None, "alt": ""})} for i in f["imagenes"]]
fichas.sort(key=lambda f: f["ruta"])
json.dump({"fuente": fichero.replace("\\", "/").split("/")[-1], "fichas": fichas},
          open(salida, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("fichas publicadas:", len(fichas),
      "· con galería:", sum(1 for f in fichas if f["galeria"]),
      "· fotos de galería:", sum(len(f["galeria"]) for f in fichas),
      "· con botón:", sum(1 for f in fichas if f["botones"]))
