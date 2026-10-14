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
import re
import sys
import xml.etree.ElementTree as ET

fichero, salida = sys.argv[1], sys.argv[2]
WP = "{http://wordpress.org/export/1.2/}"
RAIZ = "/repuestos-maquinaria-pesada-colombia/"
MARCAS = "repuestos-maquinaria-pesada-marcas"
BASE_UPLOADS = "https://partequipos.com/wp-content/uploads/"


def ajustes(e):
    s = e.get("settings")
    return s if isinstance(s, dict) else {}


def tipo_de(e):
    return e.get("widgetType") or e.get("elType")


def widgets(nodos):
    """Todos los widgets de un árbol, en orden, saltando lo oculto en escritorio."""
    for e in nodos:
        if not isinstance(e, dict) or ajustes(e).get("hide_desktop"):
            continue
        if e.get("elType") == "widget":
            yield e
        yield from widgets(e.get("elements") or [])


def seccion_principal(arbol):
    """La primera sección de primer nivel visible en escritorio que lleva un título."""
    for e in arbol:
        if not isinstance(e, dict) or ajustes(e).get("hide_desktop"):
            continue
        if any(tipo_de(w) == "heading" for w in widgets(e.get("elements") or [])):
            return e
    return None


paginas, adjuntos = [], {}
for _, el in ET.iterparse(fichero, events=("end",)):
    if el.tag == WP + "author":
        el.clear()
        continue
    if el.tag != "item":
        continue
    tipo = el.findtext(WP + "post_type") or ""
    if tipo == "attachment":
        meta = {pm.findtext(WP + "meta_key"): pm.findtext(WP + "meta_value") for pm in el.findall(WP + "postmeta")}
        archivo = meta.get("_wp_attached_file")
        if archivo:
            adjuntos[int(el.findtext(WP + "post_id"))] = {
                "url": BASE_UPLOADS + archivo,
                # La exportación no trae el tipo MIME de estos adjuntos: el importador lo deduce de la extensión.
                "alt": meta.get("_wp_attachment_image_alt") or "",
            }
    elif tipo == "page":
        enlace = el.findtext("link") or ""
        ruta = re.sub(r"^https?://[^/]+", "", enlace)
        if ruta.startswith(RAIZ) and el.findtext(WP + "status") == "publish":
            datos = ""
            for pm in el.findall(WP + "postmeta"):
                if pm.findtext(WP + "meta_key") == "_elementor_data":
                    datos = pm.findtext(WP + "meta_value") or ""
            try:
                arbol = json.loads(datos) if datos else []
            except ValueError:
                arbol = []
            principal = seccion_principal(arbol)
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
    el.clear()

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
