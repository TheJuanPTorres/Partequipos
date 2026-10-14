# Lectura común de las páginas de Elementor de la exportación XML de WordPress.
# La usan los extractores de repuestos (`scripts/repuestos/extraer-xml.py`) y de
# las fichas de maquinaria nueva (`scripts/maquinaria/extraer-xml.py`).
#
# Nada de aquí lee autores, usuarios ni comentarios: la exportación los trae
# con correo e IP, y ninguna salida debe llevarlos.
import json
import re
import xml.etree.ElementTree as ET

WP = "{http://wordpress.org/export/1.2/}"
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


def adjunto(el):
    """(id, {url, alt}) de un ítem `attachment`, o None si no lleva fichero."""
    meta = {pm.findtext(WP + "meta_key"): pm.findtext(WP + "meta_value") for pm in el.findall(WP + "postmeta")}
    archivo = meta.get("_wp_attached_file")
    if not archivo:
        return None
    # La exportación no trae el tipo MIME de estos adjuntos: el importador lo deduce de la extensión.
    return int(el.findtext(WP + "post_id")), {"url": BASE_UPLOADS + archivo, "alt": meta.get("_wp_attachment_image_alt") or ""}


def ruta_de(el):
    """La ruta pública de un ítem, sin el dominio."""
    return re.sub(r"^https?://[^/]+", "", el.findtext("link") or "")


def arbol_elementor(el):
    """El árbol de Elementor de una página (lista vacía si no tiene o no se puede leer)."""
    for pm in el.findall(WP + "postmeta"):
        if pm.findtext(WP + "meta_key") == "_elementor_data":
            try:
                return json.loads(pm.findtext(WP + "meta_value") or "[]")
            except ValueError:
                return []
    return []


def recorrer(fichero, alPagina):
    """Recorre la exportación: devuelve los adjuntos {id: {url, alt}} y llama a
    `alPagina(el)` con cada ítem `page`. Salta los autores sin leerlos."""
    adjuntos = {}
    for _, el in ET.iterparse(fichero, events=("end",)):
        if el.tag == WP + "author":
            el.clear()
            continue
        if el.tag != "item":
            continue
        tipo = el.findtext(WP + "post_type") or ""
        if tipo == "attachment":
            a = adjunto(el)
            if a:
                adjuntos[a[0]] = a[1]
        elif tipo == "page":
            alPagina(el)
        el.clear()
    return adjuntos
