# Extrae del XML de exportación de WordPress el catálogo de REPUESTOS (marcas,
# tipos y modelos), que vive en páginas de Elementor bajo
# /repuestos-maquinaria-pesada-colombia/, para `importar-repuestos.ts`.
#
# De cada página lee SOLO la sección principal visible en escritorio (la
# primera sección que no está oculta en escritorio y lleva un título): sus
# títulos, su texto y sus imágenes. Lo oculto en escritorio (la versión móvil,
# los logos ocultos en los tres tamaños) y los bloques comunes (plantillas
# incrustadas, llamada a WhatsApp, lista «Repuestos disponibles para…») no se
# leen. Ver docs/repuestos-importacion.md.
#
# La exportación completa contiene DATOS PERSONALES (usuarios y comentarios con
# correo e IP): este script NO lee autores, usuarios ni comentarios, y la salida
# no los lleva. Ni el XML ni la salida van al repositorio: la salida se guarda en
# Desktop\partequipos-cierre\.
#
# Uso:  python -I scripts/repuestos/extraer-xml.py <exportacion.xml> <salida.json>
import json
import os
import re
import sys

# Lectura común de Elementor (compartida con las fichas de maquinaria nueva).
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import WP, ajustes, arbol_elementor, recorrer, ruta_de, seccion_principal, tipo_de, widgets  # noqa: E402

fichero, salida = sys.argv[1], sys.argv[2]
RAIZ = "/repuestos-maquinaria-pesada-colombia/"
MARCAS = "repuestos-maquinaria-pesada-marcas"

paginas = []


def al_pagina(el):
    ruta = ruta_de(el)
    if not (ruta.startswith(RAIZ) and el.findtext(WP + "status") == "publish"):
        return
    principal = seccion_principal(arbol_elementor(el))
    titulos, textos, imagenes = [], [], []
    for w in widgets([principal] if principal else []):
        s, t = ajustes(w), tipo_de(w)
        if t == "heading":
            titulos.append(s.get("title") or "")
        elif t == "text-editor":
            textos.append(s.get("editor") or "")
        elif t == "image" and isinstance(s.get("image"), dict) and s["image"].get("id"):
            imagenes.append(int(s["image"]["id"]))
    segmentos = [x for x in ruta[len(RAIZ):].split("/") if x]
    paginas.append({
        "idWp": int(el.findtext(WP + "post_id")),
        "ruta": ruta,
        # El título de la página: es el <title> que hoy publica el sitio.
        "titulo": el.findtext("title") or "",
        # Tras «repuestos-maquinaria-pesada-marcas»: marca, tipo, modelo (y a veces uno más).
        "segmentos": segmentos[1:] if segmentos[:1] == [MARCAS] else None,
        "titulos": titulos,
        "texto": "\n".join(textos),
        "imagenes": imagenes,
    })


adjuntos = recorrer(fichero, al_pagina)

for p in paginas:
    # Una imagen sin adjunto en la exportación sale con `url` vacía: el importador la omite y avisa.
    p["fotos"] = [{"idWp": i, **adjuntos.get(i, {"url": None, "alt": ""})} for i in p.pop("imagenes")]
paginas.sort(key=lambda p: p["ruta"])
json.dump({"fuente": fichero.replace("\\", "/").split("/")[-1], "paginas": paginas},
          open(salida, "w", encoding="utf8"), ensure_ascii=False, indent=1)
por_nivel = {}
for p in paginas:
    n = len(p["segmentos"]) if p["segmentos"] is not None else "fuera de marcas"
    por_nivel[n] = por_nivel.get(n, 0) + 1
print("páginas publicadas:", len(paginas), "· por nivel (1 marca, 2 tipo, 3 modelo):", por_nivel,
      "· con foto:", sum(1 for p in paginas if p["fotos"]))
