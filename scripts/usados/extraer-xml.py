# Extrae del XML de exportación de WordPress SOLO las unidades de maquinaria
# usada (tipo «maquinaria») y sus fotos, para `importar-usados.ts`.
#
# La exportación completa contiene DATOS PERSONALES (usuarios y comentarios con
# correo e IP): este script NO lee autores, usuarios ni comentarios, y la salida
# no los lleva. Ni el XML ni la salida van al repositorio: la salida se guarda en
# Desktop\partequipos-cierre\ (docs/usados-importacion.md).
#
# Uso:  python -I scripts/usados/extraer-xml.py <exportacion.xml> <salida.json>
import json
import sys
import xml.etree.ElementTree as ET

fichero, salida = sys.argv[1], sys.argv[2]
WP = "{http://wordpress.org/export/1.2/}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}"
CAMPOS = ("referencia", "peso", "horas", "serial", "descripcionequipo")
BASE_UPLOADS = "https://partequipos.com/wp-content/uploads/"

unidades, fotos, borradores = [], {}, 0
for _, el in ET.iterparse(fichero, events=("end",)):
    if el.tag == WP + "author":
        el.clear()
        continue
    if el.tag != "item":
        continue
    tipo = el.findtext(WP + "post_type") or ""
    if tipo == "maquinaria":
        if el.findtext(WP + "status") != "publish":
            borradores += 1
        else:
            meta = {}
            for pm in el.findall(WP + "postmeta"):
                k = pm.findtext(WP + "meta_key") or ""
                if k in CAMPOS:
                    meta[k] = pm.findtext(WP + "meta_value") or ""
            terminos = {}
            for c in el.findall("category"):
                terminos.setdefault(c.get("domain"), []).append(c.text or "")
            primero = lambda d: (terminos.get(d) or [None])[0]
            unidades.append({
                "idWp": int(el.findtext(WP + "post_id")),
                "slug": el.findtext(WP + "post_name"),
                "enlace": el.findtext("link"),
                "categoria": primero("categorias"),
                "marca": primero("marcas"),
                "anio": primero("ano"),
                "tonelada": primero("tonelada"),
                **{k: meta.get(k, "") for k in CAMPOS},
            })
    elif tipo == "attachment":
        meta = {pm.findtext(WP + "meta_key"): pm.findtext(WP + "meta_value") for pm in el.findall(WP + "postmeta")}
        padre = int(el.findtext(WP + "post_parent") or 0)
        archivo = meta.get("_wp_attached_file")
        if padre and archivo:
            fotos.setdefault(padre, []).append({
                "idWp": int(el.findtext(WP + "post_id")),
                "url": BASE_UPLOADS + archivo,
                "alt": meta.get("_wp_attachment_image_alt") or "",
                "mime": el.findtext(WP + "post_mime_type") or "",
            })
    el.clear()

for u in unidades:
    u["fotos"] = sorted(fotos.get(u["idWp"], []), key=lambda f: f["idWp"])
json.dump({"fuente": fichero.replace("\\", "/").split("/")[-1], "unidades": unidades},
          open(salida, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("unidades publicadas:", len(unidades), "· borradores omitidos:", borradores,
      "· fotos (adjuntos):", sum(len(u["fotos"]) for u in unidades))
