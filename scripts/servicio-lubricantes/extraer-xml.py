"""
EXTRACTOR DE SERVICIO TÉCNICO Y LUBRICANTES ENI desde la exportación XML de
WordPress (solo lectura).

    python -I scripts/servicio-lubricantes/extraer-xml.py <exportación.xml> [salida.json]

Lee SOLO el árbol de Elementor de seis páginas publicadas: /servicio-tecnico/,
/lubricantes/lubricantes-eni/ y sus 4 subpáginas. NO lee usuarios, autores
ni comentarios (la exportación los tiene, con correos e IP): esos elementos se
saltan sin abrirlos.

Escribe un JSON FUERA del repositorio (por defecto en
Desktop/partequipos-diseno/wordpress/servicio-lubricantes/contenido.json) con
los textos, los nombres y grados de los productos y las URL de sus fotos y
PDF. Lo lee `importar.ts`.

Reglas de la réplica (CLAUDE.md §9, «Decisiones estándar»):
- Lo oculto en los tres tamaños no existe: se salta.
- Los textos van TAL CUAL, con sus erratas y mayúsculas (decisión del cliente,
  2026-10-18); la lista para el cliente las recoge.
- Una ficha técnica que es la de OTRO producto no se copia (`erratas`; dirección,
  confirmado el 2026-10-18).
- Las fotos de licencia dudosa llevan `dudosa: true`, como lista. Desde el
  2026-10-17 van a todos los destinos (decisión del cliente, CLAUDE.md §10.38).
"""

import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

WP = "{http://wordpress.org/export/1.2/}"
SUBIDAS = "https://partequipos.com/wp-content/uploads/"

PAGINAS = {
    "/servicio-tecnico/": "servicio",
    "/lubricantes/lubricantes-eni/": "lubricantes",
    "/lubricantes/lubricantes-eni/auto-liviano/": "auto-liviano",
    "/lubricantes/lubricantes-eni/auto-pesado/": "auto-pesado",
    "/lubricantes/lubricantes-eni/engranajes/": "engranajes",
    "/lubricantes/lubricantes-eni/motos-scooter/": "motos-scooter",
}

# Fotos de licencia dudosa: de banco o de terceros por su nombre y procedencia
# (miniaturas de YouTube, imágenes de Twitter, prensa, Freepik, DeviantArt) y
# el banner oficial de Hitachi. Solo se marcan: desde el 2026-10-17 se importan
# en todos los destinos (decisión del cliente: su contenido, su responsabilidad).
DUDOSAS = {
    "2022/04/sddefault.jpg",
    "2022/04/retroexcavadora_icononzo.jpeg",
    "2022/04/maxresdefault.jpg",
    "2022/04/file_20190509084119.webp",
    "2022/04/DrHXe6_V4AArIYs.jpg",
    "2022/04/DrHXdijV4AABxjP.jpg",
    "2022/04/9-1030x771-1.jpg",
    "2024/04/Hitachi-Construction-Machinery-Excavator-Category-banner-07-2023.webp",
    "2024/03/driving-green-neon-color-motorcycle-road-dusk-time-scaled.jpg",
    "2024/03/front-view-black-luxury-sedan-road-scaled.jpg",
    "2024/03/engranaje_png_by_turnlastsong_d80aede-fullview.png",
}

# Títulos de sección y de grupo de las páginas de lubricantes, TAL CUAL
# (decisión del cliente, 2026-10-18: con sus mayúsculas y la errata
# «mOTO & SCOOTER»). Sirven para reconocer los títulos de grupo.
GRUPOS = {
    "AUTO LIVIANO",
    "AUTO PESADO/DIESEL",
    "mOTO & SCOOTER",
    "REFRIGERACIÓN",
    "TRANSMISIONES",
    "INDUSTRIALES",
    "ENGRANAJES",
    "COMPRESORES",
    "TÉRMICOS",
    "HIDRÁULICOS",
    "OSO",
    "ARNICA",
    "COMPLEMENTARIOS",
    "REFRIGERANTE",
    "LÍQUIDO DE FRENOS",
}

# Productos cuyo botón «FICHA TÉCNICA» abre el PDF de OTRO producto (revisado
# a mano, PDF por PDF). Mejor sin ficha que con una equivocada.
FICHAS_AJENAS = {
    ("I-RIDE RACING", "10W-60"),  # abre la de I-SIGMA PERFORMANCE E7 15W-40
    ("MULTITECH", "CT PLUS 10W"),  # abre la de MULTITECH JD/F 10W-30
}

erratas = []


def texto(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def subida(url):
    """La ruta dentro de uploads (`2024/03/x.png`), o None si no es del sitio."""
    if not url or not url.startswith(SUBIDAS):
        return None
    return url[len(SUBIDAS):]


def fichero(url, alt):
    ruta = subida(url)
    if not ruta:
        return None
    return {"url": SUBIDAS + ruta, "alt": alt, "dudosa": ruta in DUDOSAS}


def oculto(s):
    return all(s.get(k) for k in ("hide_desktop", "hide_tablet", "hide_mobile"))


def leer_paginas(ruta_xml):
    paginas = {}
    for _, el in ET.iterparse(ruta_xml, events=("end",)):
        # Usuarios, autores y comentarios: fuera sin leerlos.
        if el.tag in (WP + "author", WP + "comment"):
            el.clear()
            continue
        if el.tag != "item":
            continue
        enlace = re.sub(r"^https?://[^/]+", "", el.findtext("link") or "")
        if (
            enlace in PAGINAS
            and el.findtext(WP + "post_type") == "page"
            and el.findtext(WP + "status") == "publish"
        ):
            for meta in el.findall(WP + "postmeta"):
                if meta.findtext(WP + "meta_key") == "_elementor_data":
                    paginas[PAGINAS[enlace]] = json.loads(meta.findtext(WP + "meta_value") or "[]")
        el.clear()
    falta = set(PAGINAS.values()) - set(paginas)
    if falta:
        sys.exit(f"faltan páginas en el XML: {sorted(falta)}")
    return paginas


def recorrer(nodos, visita):
    """Recorre en orden los elementos visibles (lo oculto en los tres tamaños no existe)."""
    for n in nodos:
        s = n.get("settings") or {}
        if oculto(s):
            continue
        visita(n, s)
        recorrer(n.get("elements") or [], visita)


def secuencia(nodos):
    """Los widgets visibles en orden, reducidos a lo que importa."""
    out = []

    def visita(n, s):
        w = n.get("widgetType")
        if w == "heading":
            # Como lo PINTA WordPress: con la transformación de mayúsculas de su
            # tipografía («¿Tuviste un» con `uppercase` → «¿TUVISTE UN»).
            t = texto(s.get("title"))
            modo = s.get("typography_text_transform")
            out.append(("H", t.upper() if modo == "uppercase" else t.lower() if modo == "lowercase" else t))
        elif w == "button":
            enlace = s.get("link") if isinstance(s.get("link"), dict) else {}
            out.append(("B", texto(s.get("text")), enlace.get("url", "")))
        elif w == "image":
            out.append(("I", (s.get("image") or {}).get("url", "")))
        elif w == "image-carousel":
            fotos = s.get("carousel") or []
            out.append(("I", fotos[0].get("url", "") if fotos else ""))
        elif w == "text-editor":
            out.append(("T", s.get("editor") or ""))

    recorrer(nodos, visita)
    return out


# ---------------------------------------------------------------- Lubricantes


def productos_de(slug, nodos):
    """Productos de una subpágina: foto, nombre, grado y ficha, con su grupo."""
    sec = secuencia(nodos)
    productos = []
    seccion = None
    sub = None
    entradilla = None
    i = 0
    while i < len(sec):
        e = sec[i]
        if e[0] == "T" and entradilla is None:
            entradilla = texto(e[1])
        # Producto: foto, nombre, grado y el botón «FICHA TÉCNICA».
        if (
            e[0] == "I"
            and i + 3 < len(sec)
            and sec[i + 1][0] == "H"
            and sec[i + 2][0] == "H"
            and sec[i + 3][0] == "B"
            and "FICHA" in sec[i + 3][1].upper()
        ):
            nombre, grado, pdf = sec[i + 1][1], sec[i + 2][1], sec[i + 3][2]
            ficha = SUBIDAS + subida(pdf) if subida(pdf) else None
            if ficha and (nombre, grado) in FICHAS_AJENAS:
                erratas.append(
                    f"{slug}: «{nombre} {grado}» enlaza la ficha de otro producto "
                    f"({ficha.rsplit('/', 1)[-1]}); no se copia"
                )
                ficha = None
            if not ficha:
                erratas.append(f"{slug}: «{nombre} {grado}» sin ficha técnica")
            grupo = None
            if seccion and sub:
                grupo = f"{seccion} · {sub}"
            elif seccion:
                grupo = seccion
            productos.append(
                {
                    "nombre": nombre,
                    "grado": grado,
                    "grupo": grupo,
                    "imagen": fichero(e[1], f"Envase de lubricante Eni {nombre} {grado}"),
                    "ficha": ficha,
                }
            )
            i += 4
            continue
        if e[0] == "H":
            siguiente = sec[i + 1] if i + 1 < len(sec) else None
            nombre = e[1]
            # Título de sección: le sigue «COTIZAR» (a veces tras «VER TODOS»).
            botones = [x for x in sec[i + 1 : i + 3] if x[0] == "B"]
            if siguiente and siguiente[0] == "B" and any("COTIZAR" in b[1].upper() for b in botones):
                seccion, sub = nombre, None
            elif e[1] in GRUPOS:
                sub = nombre
        i += 1
    # En las páginas de una sola sección el grupo sobra: es la propia línea.
    if len({p["grupo"] for p in productos}) == 1:
        for p in productos:
            p["grupo"] = None
    return productos, entradilla


def lubricantes(paginas):
    sec = secuencia(paginas["lubricantes"])
    texto_marca = next(texto(e[1]) for e in sec if e[0] == "T")
    logo = next(e[1] for e in sec if e[0] == "I")
    cabecera = paginas["lubricantes"][0].get("settings", {}).get("background_image", {}).get("url")

    # Las 4 tarjetas de la página principal: título y foto de fondo.
    tarjetas = {}

    def visita(n, s):
        if n.get("widgetType") == "call-to-action":
            enlace = (s.get("link") or {}).get("url", "")
            slug = enlace.rstrip("/").rsplit("/", 1)[-1]
            tarjetas[slug] = fichero((s.get("bg_image") or {}).get("url"), "")

    recorrer(paginas["lubricantes"], visita)

    categorias = []
    for slug in ("auto-liviano", "auto-pesado", "engranajes", "motos-scooter"):
        productos, entradilla = productos_de(slug, paginas[slug])
        # Engranajes y motos repiten el texto de la marca: no es suyo.
        if entradilla and entradilla[:60].lower() == texto_marca[:60].lower():
            entradilla = None
        categorias.append(
            {
                "slug": slug,
                "entradilla": entradilla,
                "imagen": tarjetas.get(slug),
                "productos": productos,
            }
        )
    return {
        "texto": texto_marca,
        "logo": fichero(logo, "Logo de Eni"),
        "cabecera": fichero(cabecera, ""),
        "categorias": categorias,
    }


# ----------------------------------------------------------- Servicio técnico


def servicio(paginas):
    nodos = paginas["servicio"]
    por_ancla = {}
    for n in nodos:
        s = n.get("settings") or {}
        ancla = s.get("_element_id") or s.get("css_id")
        if ancla:
            por_ancla[ancla] = n
    for ancla in ("taller", "alistamiento", "posventa", "Siniestros"):
        if ancla not in por_ancla:
            sys.exit(f"falta la sección #{ancla} en el XML")

    def textos(n):
        return [e for e in secuencia([n]) if e[0] in ("H", "T")]

    def imagen(n):
        return next((e[1] for e in secuencia([n]) if e[0] == "I"), None)

    cabecera = nodos[0].get("settings") or {}

    taller = textos(por_ancla["taller"])
    alistamiento = textos(por_ancla["alistamiento"])
    posventa = textos(por_ancla["posventa"])
    siniestros = textos(por_ancla["Siniestros"])

    # La galería de siniestros.
    galeria = []

    def visita(n, s):
        if n.get("widgetType") == "gallery":
            for g in s.get("gallery") or []:
                galeria.append(g.get("url"))

    recorrer([por_ancla["Siniestros"]], visita)

    # El vídeo de YouTube del canal del cliente y el póster del vídeo alojado.
    youtube, poster = None, None

    def videos(n, s):
        nonlocal youtube, poster
        if n.get("widgetType") != "video":
            return
        # Sin `video_type`, Elementor usa YouTube (su valor por defecto).
        if s.get("video_type") == "hosted":
            poster = (s.get("poster") or {}).get("url")
        elif s.get("youtube_url"):
            youtube = s.get("youtube_url")

    recorrer(nodos, videos)
    if not youtube:
        sys.exit("falta el vídeo de YouTube de alistamiento")

    return {
        "cabecera": {
            "video": SUBIDAS + subida((cabecera.get("background_video_link") or "")),
            "imagen": fichero(
                (cabecera.get("background_image") or {}).get("url"),
                "Taller de servicio técnico de Partequipos",
            ),
        },
        "taller": {
            "antetitulo": taller[0][1],
            "titulo": taller[1][1],
            "parrafos": [texto(taller[2][1])],
            "destacado": taller[3][1],
            "imagen": fichero(
                imagen(por_ancla["taller"]),
                "Técnico de Partequipos trabajando en una máquina en el taller",
            ),
        },
        "alistamiento": {
            "titulo": alistamiento[0][1],
            "parrafos": [texto(alistamiento[1][1]), alistamiento[2][1]],
            "youtube": youtube,
            "miniatura": fichero(poster, "Alistamiento de maquinaria en el taller de Partequipos"),
        },
        "posventa": {
            "titulo": posventa[0][1],
            "parrafos": [texto(p) for p in re.findall(r"<p>(.*?)</p>", posventa[1][1], re.S)],
            "imagen": fichero(
                imagen(por_ancla["posventa"])
                or (por_ancla["posventa"].get("settings") or {}).get("background_image", {}).get("url"),
                "Excavadora Hitachi trabajando en obra",
            ),
        },
        "siniestros": {
            "titulo": f"{siniestros[0][1]} {siniestros[1][1]}",
            "intro": texto(siniestros[2][1]),
            "apartados": [
                {
                    "etiqueta": texto(re.search(r"<strong>(.*?)</strong>", t[1]).group(1)).rstrip(":"),
                    "texto": texto(re.sub(r"<ul>.*?</ul>", "", t[1], flags=re.S)),
                }
                for t in siniestros[3:6]
            ],
            "aseguradoras": "Trabajamos con las principales aseguradoras",
            "galeria": [
                fichero(u, f"Maquinaria amarilla accidentada ({i + 1} de {len(galeria)})")
                for i, u in enumerate(galeria)
            ],
        },
    }


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    salida = (
        sys.argv[2]
        if len(sys.argv) > 2
        else os.path.join(
            os.path.expanduser("~"),
            "Desktop",
            "partequipos-diseno",
            "wordpress",
            "servicio-lubricantes",
            "contenido.json",
        )
    )
    paginas = leer_paginas(sys.argv[1])
    datos = {
        "servicio": servicio(paginas),
        "lubricantes": lubricantes(paginas),
        "erratas": erratas,
    }
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    lub = datos["lubricantes"]["categorias"]
    print(f"[extraer] productos: {sum(len(c['productos']) for c in lub)} en {len(lub)} líneas")
    print(f"[extraer] galería de siniestros: {len(datos['servicio']['siniestros']['galeria'])} fotos")
    print(f"[extraer] erratas anotadas: {len(erratas)}")
    print(f"[extraer] escrito: {salida}")


if __name__ == "__main__":
    main()
