# Extrae del XML de exportación de WordPress el CONTENIDO REAL de la home y de
# Nosotros con el que se sustituye la copia de demostración de ux-9 (§10.38),
# para `importar.ts`. Estudio y decisiones de dirección:
# `docs/contenido-real-portada.md`.
#
# Qué lee, todo de lo VISIBLE de la web original:
# - la home (página 51812): títulos y botones de las secciones;
# - Nosotros (344): título, párrafo, botón y cifras;
# - «NUESTRAS sedes» (plantilla 35576, la pinta /contactanos/): ciudades,
#   líneas, direcciones, teléfonos y coordenadas de su enlace de Google Maps;
# - «Repuestos maquinaria pesada - Categorías» (40343, la pinta la home):
#   título y enlace de cada categoría;
# - las meta descripciones (Yoast) de la home, Nosotros y los índices de
#   maquinaria nueva, usada y repuestos;
# - los adjuntos elegidos en `IMAGENES` (URL y texto alternativo).
#
# La exportación completa contiene DATOS PERSONALES (usuarios y comentarios con
# correo e IP): este script NO los lee, y la salida no los lleva. Ni el XML ni la
# salida van al repositorio: la salida se guarda en Desktop\partequipos-cierre\.
#
# Uso:  python -I scripts/contenido-real/extraer-xml.py <exportacion.xml> <salida.json>
import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "wordpress"))
from elementor import BASE_UPLOADS, WP, ajustes, ruta_de, tipo_de  # noqa: E402

fichero, salida = sys.argv[1], sys.argv[2]

ID_HOME, ID_NOSOTROS, ID_SEDES, ID_CATEGORIAS = "51812", "344", "35576", "40343"
RUTAS_META = {
    "nueva": "/maquinaria-pesada/maquinaria-pesada-nueva/",
    "usada": "/maquinaria-pesada/maquinaria-pesada-usada/",
    "repuestos": "/repuestos-maquinaria-pesada-colombia/",
}

# Las imágenes elegidas (decisión de dirección, 2026-10-14): fichero de WordPress
# (ruta bajo uploads) y el texto alternativo, escrito mirando cada foto. Si WordPress
# tiene un alt aceptable se usa el suyo; si no, este.
IMAGENES = {
    "logo-hitachi": ("2024/05/1697082860-hitachi-logo.png", "Logo de Hitachi"),
    "logo-case": ("2025/03/Case-logo.png", "Logo de CASE Construction"),
    "logo-yanmar": ("2025/03/Yanmar-logo.png", "Logo de Yanmar"),
    "logo-dynapac": ("2025/12/dynapac-logo-web-205-03.jpg", "Logo de Dynapac"),
    "logo-eni": ("2022/03/Logos-Partequipos-Logo-12.jpg", "Logo de lubricantes Eni"),
    "logo-cf": ("2022/03/Logos-Partequipos-Mesa-de-trabajo-4-copia-10.jpg", "Logo de CF"),
    "marca-hitachi": ("2025/03/Hitachi-FOTOS-01-scaled.jpg", "Excavadora Hitachi trabajando en una cantera"),
    "marca-case": ("2025/03/CASE-FOTOS-01-scaled.jpg", "Retrocargadora CASE moviendo tierra en una obra"),
    "marca-yanmar": ("2025/03/Yanmar-FOTOS-01-scaled.jpg", "Miniexcavadora Yanmar en una obra"),
    "marca-dynapac": ("2025/10/Dynapac-logo-02.jpg", "Compactador de suelo Dynapac en una obra"),
    "usada": ("2025/03/USADOS-FOTOS-02-scaled.jpg", "Excavadoras usadas en un patio de maquinaria"),
    "cat-corte": ("2025/07/Conjunto-ppal-1-600x600-SEP-2025.jpg", "Baldes y dientes para maquinaria pesada"),
    "cat-llantas": ("2025/04/CATEGORIA-Llantas.jpg", "Llantas y rines para maquinaria pesada"),
    "cat-lubricantes": ("2025/04/Recurso-2-.png", "Lubricantes Eni para maquinaria pesada"),
    "cat-filtracion": ("2025/07/Aceite-600x600-1.png", "Filtros para maquinaria pesada"),
    "compania": ("2024/08/case-construction-equipment-range.jpg", "Maquinaria CASE trabajando en una cantera"),
    "nosotros-cabecera": ("2024/04/Cattura-1.jpg", "Excavadora Hitachi trabajando en una obra"),
    "nosotros-mapa": (
        "2025/05/Mapa-Sedes-2025-Isa_Mesa-de-trabajo-1-scaled.png",
        "Mapa de Colombia con las sedes de Partequipos: Barranquilla, Montería, Antioquia "
        "(Caucasia, Guarne y Medellín), Bucaramanga, Istmina, Cali, Ibagué y Bogotá, "
        "y las filiales de Miami y Lima",
    ),
    "nosotros-franja": ("2022/02/Usados-garantizados-Partequipos-1.jpg", "Excavadora Hitachi y otras máquinas en un patio"),
    "tarjeta-nueva": ("2025/03/Hitachi-FOTOS-02-scaled.jpg", "Excavadora Hitachi nueva en una obra"),
    "tarjeta-usada": ("2025/03/USADOS-FOTOS-scaled.jpg", "Bulldozer usado sobre un acopio de material"),
    "tarjeta-repuestos": ("2025/07/Tren-de-RODAJE-SEP-2025.jpg", "Repuestos de tren de rodaje para maquinaria pesada"),
}
# Las 4 categorías técnicas de la sección 5: su imagen (la de la plantilla 40343) y,
# porque la retirada de la copia de demostración los devuelve a vacío, su orden
# en la portada y su icono (los de hoy en el preview; son del diseño, no de WordPress).
CATEGORIAS = {
    "herramienta-de-corte-gets-para-maquinaria-pesada": ("cat-corte", 1, "corte"),
    "llantas-y-rines-para-maquinaria-pesada": ("cat-llantas", 2, "llanta"),
    "lubricantes-para-maquinaria-pesada": ("cat-lubricantes", 3, "lubricante"),
    "filtracion-para-maquinaria-pesada": ("cat-filtracion", 4, "filtro"),
}
# Sección 2: las 4 marcas de WordPress, en su orden.
MARCAS = [("hitachi", "logo-hitachi", "marca-hitachi"), ("case-construction", "logo-case", "marca-case"),
          ("yanmar", "logo-yanmar", "marca-yanmar"), ("dynapac", "logo-dynapac", "marca-dynapac")]
# La página de cada marca en WordPress: de ahí sale la descripción de su tarjeta.
RUTAS_MARCAS = {s: f"/maquinaria-pesada/maquinaria-pesada-nueva/marcas/{s}/" for s, _, _ in MARCAS}
NOMBRES_MARCAS = {"hitachi": "Hitachi", "case-construction": "CASE", "yanmar": "Yanmar", "dynapac": "Dynapac"}
# Sección 4: los 6 logos de «Nuestras Marcas», en su orden.
LOGOS = [("Hitachi", "logo-hitachi"), ("CASE", "logo-case"), ("Dynapac", "logo-dynapac"),
         ("Yanmar", "logo-yanmar"), ("Eni", "logo-eni"), ("CF", "logo-cf")]
# El vídeo de YouTube del botón de «Nuestra Compañía»: el que pinta Nosotros en WordPress.
YOUTUBE_COMPANIA = "https://www.youtube.com/watch?v=KSEQ5mQfR38"
# Departamento de cada ciudad (dato geográfico, no del cliente) y, solo para las
# sedes cuyo enlace de mapas no lleva coordenadas (enlace corto), el centro de la
# ciudad. El informe lo avisa.
DEPARTAMENTOS = {
    "Bogotá": "Bogotá D. C.", "Guarne": "Antioquia", "Medellín": "Antioquia", "Caucasia": "Antioquia",
    "Cali": "Valle del Cauca", "Barranquilla": "Atlántico", "Bucaramanga": "Santander",
    "Montería": "Córdoba", "Istmina": "Chocó", "Ibagué": "Tolima",
}
CENTRO_CIUDAD = {"Medellín": (6.2442, -75.5812), "Ibagué": (4.4389, -75.2322)}
# Como el mapa de sedes de Nosotros en WordPress: Antioquia es UNA sede (una
# estrella) con Caucasia, Guarne y Medellín; cada una va como `localidad` de su línea.
AGRUPADAS = {"Guarne": "Antioquia", "Medellín": "Antioquia", "Caucasia": "Antioquia"}
SEDE_AGRUPADA = {"Antioquia": {"ciudad": "Medellín", "departamento": "Antioquia"}}

limpio = lambda s: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def oracion(s):
    """Un texto escrito TODO EN MAYÚSCULAS en WordPress pasa a mayúscula solo al inicio
    (el diseño pone las mayúsculas por CSS donde las quiere; un lector de pantalla
    puede deletrear un texto en mayúsculas)."""
    return s[:1].upper() + s[1:].lower() if s.isupper() else s[:1].upper() + s[1:]


def todos(nodos):
    """Todos los elementos visibles en escritorio, en orden (secciones, columnas y widgets)."""
    for e in nodos:
        if not isinstance(e, dict) or ajustes(e).get("hide_desktop"):
            continue
        yield e
        yield from todos(e.get("elements") or [])


arboles, metas, adjuntos = {}, {}, {}
tituloNosotros = ""
quiero = {f for f, _ in IMAGENES.values()}
for _, el in ET.iterparse(fichero, events=("end",)):
    if el.tag == WP + "author":
        el.clear()
        continue
    if el.tag != "item":
        continue
    pid = el.findtext(WP + "post_id")
    meta = {pm.findtext(WP + "meta_key"): pm.findtext(WP + "meta_value") for pm in el.findall(WP + "postmeta")}
    tipo = el.findtext(WP + "post_type")
    if tipo == "attachment" and meta.get("_wp_attached_file") in quiero:
        adjuntos[meta["_wp_attached_file"]] = {"idWp": int(pid), "alt": meta.get("_wp_attachment_image_alt") or ""}
    if pid in (ID_HOME, ID_NOSOTROS, ID_SEDES, ID_CATEGORIAS):
        arboles[pid] = json.loads(meta.get("_elementor_data") or "[]")
        metas[pid] = meta.get("_yoast_wpseo_metadesc") or ""
        if pid == ID_NOSOTROS:
            tituloNosotros = limpio(el.findtext("title"))
    if tipo == "page" and el.findtext(WP + "status") == "publish" and ruta_de(el) in RUTAS_META.values():
        metas[ruta_de(el)] = meta.get("_yoast_wpseo_metadesc") or ""
    if tipo == "page" and el.findtext(WP + "status") == "publish" and ruta_de(el) in RUTAS_MARCAS.values():
        metas[ruta_de(el)] = meta.get("_yoast_wpseo_metadesc") or ""
        arboles[ruta_de(el)] = json.loads(meta.get("_elementor_data") or "[]")
    el.clear()

avisos = []
faltan = [f for f in quiero if f not in adjuntos]
if faltan:
    sys.exit(f"✗ adjuntos que no están en la exportación: {faltan}")
imagenes = {
    clave: {"url": BASE_UPLOADS + f, "idWp": adjuntos[f]["idWp"], "alt": alt}
    for clave, (f, alt) in IMAGENES.items()
}

# --- Descripción de cada marca (tarjeta de la sección 2): la meta descripción de su
# página SOLO si nombra la marca (en WordPress, la de Dynapac es la de CASE, copiada
# de plantilla); si no, el primer párrafo visible de su página que la nombra.
def descripcion_de_marca(slug):
    nombre = NOMBRES_MARCAS[slug]
    nombra = lambda t: re.search(rf"\b{re.escape(nombre)}\b", t, re.I)
    meta = re.sub(r"\s+", " ", metas.get(RUTAS_MARCAS[slug], "")).strip()
    if meta and nombra(meta):
        return meta
    for e in todos(arboles.get(RUTAS_MARCAS[slug], [])):
        for trozo in re.split(r"</p>|<br\s*/?>|</h\d>|\n", ajustes(e).get("editor") or ""):
            t = limpio(trozo)
            if len(t) >= 40 and nombra(t):
                avisos.append(f"marca {slug}: su meta descripción no la nombra; va un párrafo de su página")
                return t
    sys.exit(f"✗ marca {slug}: ni su meta descripción ni su página la nombran")


# --- Nosotros: el primer bloque visible con título, párrafo y botón; y las cifras.
w = [e for e in todos(arboles[ID_NOSOTROS])]
titulos = [limpio(ajustes(e).get("title")) for e in w if tipo_de(e) == "heading"]
parrafo = next(ajustes(e).get("editor") for e in w if tipo_de(e) == "text-editor")
boton = next(ajustes(e) for e in w if tipo_de(e) == "button")
cifras = []
for e in w:
    if tipo_de(e) != "jkit_fun_fact":
        continue
    s = ajustes(e)
    numero = (s.get("sg_content_number") or "").strip()
    if not re.fullmatch(r"\d+", numero):
        avisos.append(f"cifra de Nosotros sin número, no entra: «{s.get('sg_content_number_prefix', '')}{numero} {s.get('sg_content_title', '')}»")
        continue
    cifras.append({"prefijo": s.get("sg_content_number_prefix") or None, "numero": int(numero),
                   "sufijo": s.get("sg_content_number_suffix") or None, "etiqueta": limpio(s.get("sg_content_title"))})

# --- Home: el título sobre las tres columnas (nueva, usada, repuestos) y el de cada una.
wh = [e for e in todos(arboles[ID_HOME])]
titulosHome = [limpio(ajustes(e).get("title")) for e in wh if tipo_de(e) == "heading"]
iTarjetas = next(i for i, x in enumerate(titulosHome) if x.lower().startswith("venta de maquinaria pesada y repuestos"))
titulosColumnas = titulosHome[iTarjetas - 3 : iTarjetas]
franja = next(x for x in titulos if x.lower() == "marcas aliadas")

# --- Sedes: cada icon-box sin descripción abre una ciudad; los de debajo son sus líneas.
sedes, actual = [], None
for e in todos(arboles[ID_SEDES]):
    if tipo_de(e) != "icon-box":
        continue
    s = ajustes(e)
    titulo, desc = limpio(s.get("title_text")), limpio(s.get("description_text"))
    if not desc:
        nombre = re.sub(r"\s*\(.*\)$", "", titulo)
        actual, localidad = None, None
        if nombre in AGRUPADAS:
            grupo = AGRUPADAS[nombre]
            actual = next((s for s in sedes if s["nombre"] == grupo), None)
            if actual is None:
                actual = {"nombre": grupo, **SEDE_AGRUPADA[grupo], "lineas": [], "coordenadas": None}
                sedes.append(actual)
            localidad = nombre if nombre != actual["ciudad"] else None
        elif nombre in DEPARTAMENTOS:
            actual = {"nombre": nombre, "ciudad": nombre, "departamento": DEPARTAMENTOS[nombre], "lineas": [], "coordenadas": None}
            sedes.append(actual)
        elif titulo not in ("Call Center",):
            avisos.append(f"sede sin departamento conocido, no entra: «{titulo}»")
        continue
    if actual is None:
        continue
    tel = re.search(r"\(\d{3}\)\s*\d{3}\s*\d{2}\s*\d{2}$", desc)
    url = (s.get("link") or {}).get("url") or ""
    m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url) or re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
    # Las coordenadas de la sede, las de su propia ciudad (no las de otra localidad del grupo).
    if m and actual["coordenadas"] is None and localidad is None:
        actual["coordenadas"] = [round(float(m.group(1)), 5), round(float(m.group(2)), 5)]
    actual["lineas"].append({"linea": titulo.rstrip(":").strip(), "localidad": localidad, "direccion": desc[: tel.start()].strip() if tel else desc,
                             "telefono": tel.group(0) if tel else None})
for s in sedes:
    if s["coordenadas"] is None:
        s["coordenadas"] = list(CENTRO_CIUDAD[s["ciudad"]])
        avisos.append(f"sede {s['nombre']}: su enlace de mapas no lleva coordenadas; va el centro de la ciudad")

# --- Categorías de la sección 5: título y enlace de la plantilla 40343.
categorias = []
for e in todos(arboles[ID_CATEGORIAS]):
    if tipo_de(e) != "button":
        continue
    enlace = re.sub(r"^https?://[^/]+", "", (ajustes(e).get("link") or {}).get("url") or "")
    slug = enlace.rstrip("/").rsplit("/", 1)[-1]
    if slug in CATEGORIAS and not any(c["slug"] == slug for c in categorias):
        imagen, orden, icono = CATEGORIAS[slug]
        categorias.append({"slug": slug, "enlace": enlace, "imagen": imagen, "orden": orden, "icono": icono})
titulosCat = {}
pendiente = None
for e in todos(arboles[ID_CATEGORIAS]):
    if tipo_de(e) == "heading":
        pendiente = re.sub(r"\s*-+\s*$", "", limpio(ajustes(e).get("title")))
    elif tipo_de(e) == "button" and pendiente:
        slug = ((ajustes(e).get("link") or {}).get("url") or "").rstrip("/").rsplit("/", 1)[-1]
        titulosCat.setdefault(slug, pendiente[:1].upper() + pendiente[1:])
        pendiente = None
for c in categorias:
    c["titulo"] = oracion(titulosCat[c["slug"]])
if len(categorias) != len(CATEGORIAS):
    sys.exit(f"✗ categorías encontradas: {len(categorias)} de {len(CATEGORIAS)}")

fuente = {
    "imagenes": imagenes,
    "portada": {
        "marcas": [
            {"slug": s, "logo": l, "tarjeta": t, "orden": i + 1, "descripcion": descripcion_de_marca(s)}
            for i, (s, l, t) in enumerate(MARCAS)
        ],
        "logos": [{"nombre": n, "logo": l} for n, l in LOGOS],
        "usadaImagen": "usada",
        "categorias": categorias,
        "compania": {"imagen": "compania", "youtube": YOUTUBE_COMPANIA},
        "metaDescripcion": metas[ID_HOME],
    },
    "sedes": sedes,
    "nosotros": {
        "antetitulo": oracion(titulos[0]),
        "titulo": oracion(titulos[1]),
        "parrafoHtml": parrafo,
        "boton": {"texto": oracion(limpio(boton.get("text"))), "enlace": re.sub(r"^https?://[^/]+", "", (boton.get("link") or {}).get("url") or "")},
        "cifras": cifras,
        "cabecera": {"antetitulo": "Partequipos", "titulo": tituloNosotros},
        "franja": oracion(franja),
        "tarjetasTitulo": oracion(titulosHome[iTarjetas].replace("Maquinaria", "maquinaria")),
        "tarjetas": [
            {"clave": k, "titulo": oracion(titulosColumnas[i]), "texto": metas[RUTAS_META[k]], "imagen": f"tarjeta-{k}"}
            for i, k in enumerate(("nueva", "usada", "repuestos"))
        ],
        "metaDescripcion": re.sub(r"^Nosotros\s+", "", metas[ID_NOSOTROS]),
    },
    "avisos": avisos,
}
with open(salida, "w", encoding="utf-8") as f:
    json.dump(fuente, f, ensure_ascii=False, indent=2)
print(f"imágenes: {len(imagenes)} · sedes: {len(sedes)} · categorías: {len(categorias)} · cifras: {len(cifras)} · avisos: {len(avisos)}")
for a in avisos:
    print("  aviso:", a)
