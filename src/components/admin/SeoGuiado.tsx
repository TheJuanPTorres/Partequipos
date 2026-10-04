"use client";

import { useDocumentInfo, useFormFields, useLivePreviewContext } from "@payloadcms/ui";
import { useEffect, useState } from "react";

import { seoConfig } from "@/lib/seo/config";
import { RECOMENDADO, recortarDescripcion } from "@/lib/seo/porDefecto";
import { SEO_POR_COLECCION, estadoLongitud, type Nombres } from "@/lib/seo/seoPanel";

/**
 * SEO guiado, al final de «Buscadores y redes sociales» (campo `ui`, sin
 * columna en la base). Enseña, mientras se escribe:
 *
 * - cómo se verá la página en Google, con lo que usará DE VERDAD el sitio:
 *   lo escrito aquí o, si está vacío, lo mismo que pone su `generateMetadata`
 *   (las plantillas son las de `src/lib/seo/porDefecto.ts`, compartidas);
 * - un contador de caracteres para el título y la descripción, con la
 *   longitud recomendada;
 * - qué se usa si cada campo se deja vacío, y qué imagen gana a la social.
 *
 * Los nombres de marca o tipo de un título por defecto se piden a la API REST
 * del propio panel (lectura pública), como hace el resto del panel.
 */

const ETIQUETA_CAMPO = { descripcion: "Descripción", entradilla: "Entradilla" } as const;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function idDe(valor: unknown): string | null {
  if (valor && typeof valor === "object" && "id" in valor)
    return String((valor as { id: unknown }).id);
  if (typeof valor === "number" || typeof valor === "string") return String(valor);
  return null;
}

function Contador({ largo, rango }: { largo: number; rango: { min?: number; max: number } }) {
  const estado = estadoLongitud(largo, rango);
  const consejo = {
    vacio: "vacío: se usa el valor por defecto",
    corto: `corto: mejor desde ${rango.min}`,
    bien: "bien",
    largo: `largo: más de ${rango.max}`,
  }[estado];
  return (
    <span className={`pq-seo__contador pq-seo__contador--${estado}`}>
      {largo} caracteres · {consejo}
    </span>
  );
}

export default function SeoGuiado() {
  const { collectionSlug } = useDocumentInfo();
  const { previewURL } = useLivePreviewContext();
  const regla = collectionSlug ? SEO_POR_COLECCION[collectionSlug] : undefined;

  const valores = useFormFields(([campos]) => ({
    metaTitle: texto(campos["seo.metaTitle"]?.value),
    metaDescription: texto(campos["seo.metaDescription"]?.value),
    nombre: texto(campos[regla?.campoNombre ?? "nombre"]?.value),
    base: texto(campos[regla?.campoDescripcion ?? "descripcion"]?.value),
    marca: idDe(campos.marca?.value),
    tipo: idDe(campos.tipo?.value),
  }));

  // Nombre de la marca que entra en el título por defecto. Se guarda con el
  // id al que corresponde: si el editor cambia la marca, el nombre viejo deja
  // de valer sin tener que borrarlo.
  const [marcaCargada, setMarcaCargada] = useState<{ id: string; nombre: string | null }>();
  const coleccionMarca = regla?.relaciones?.marca;
  const idMarca = valores.marca;
  useEffect(() => {
    if (!coleccionMarca || !idMarca) return;
    let vigente = true;
    fetch(`/api/${coleccionMarca}/${idMarca}?depth=0`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { nombre?: string } | null) => {
        if (vigente) setMarcaCargada({ id: idMarca, nombre: d?.nombre ?? null });
      })
      .catch(() => {
        if (vigente) setMarcaCargada({ id: idMarca, nombre: null });
      });
    return () => {
      vigente = false;
    };
  }, [coleccionMarca, idMarca]);
  const nombres: Nombres =
    marcaCargada && marcaCargada.id === idMarca ? { marca: marcaCargada.nombre } : {};

  if (!regla) {
    return (
      <p className="pq-seo__nota">
        Hoy esta colección no tiene página propia en el sitio: estos campos se guardan, pero no
        salen en Google.
      </p>
    );
  }

  const tituloPorDefecto = valores.nombre ? regla.titulo(valores.nombre, nombres) : null;
  const titulo = valores.metaTitle.trim() || tituloPorDefecto || "";
  const descripcionPorDefecto = valores.base.trim()
    ? recortarDescripcion(valores.base)
    : seoConfig.defaultDescription;
  const descripcion = recortarDescripcion(valores.metaDescription.trim() || descripcionPorDefecto);

  const dominio = (process.env.NEXT_PUBLIC_SERVER_URL ?? "https://partequipos.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const migas = (previewURL ?? "").split("/").filter(Boolean).join(" › ");

  return (
    <div className="pq-seo">
      <p className="pq-seo__titulo-seccion">Así se verá en Google</p>
      <div className="pq-seo__google" aria-label="Vista aproximada del resultado en Google">
        <span className="pq-seo__url">
          {dominio}
          {migas ? ` › ${migas}` : ""}
        </span>
        <span className="pq-seo__google-titulo">{titulo || "(sin título todavía)"}</span>
        <span className="pq-seo__google-descripcion">{descripcion}</span>
      </div>

      <ul className="pq-seo__lista">
        <li>
          <strong>Título para buscadores:</strong>{" "}
          <Contador largo={valores.metaTitle.trim().length} rango={RECOMENDADO.titulo} />
          <br />
          Recomendado: hasta {RECOMENDADO.titulo.max} caracteres; Google corta lo que pase. No se le
          añade nada: si quieres «Partequipos», escríbelo.
          <br />
          Si lo dejas vacío: «{tituloPorDefecto ?? "el nombre, cuando lo escribas"}».
        </li>
        <li>
          <strong>Descripción para buscadores:</strong>{" "}
          <Contador largo={valores.metaDescription.trim().length} rango={RECOMENDADO.descripcion} />
          <br />
          Recomendado: entre {RECOMENDADO.descripcion.min} y {RECOMENDADO.descripcion.max}{" "}
          caracteres; a partir de {RECOMENDADO.descripcion.max} se corta con «…».
          <br />
          Si la dejas vacía:{" "}
          {valores.base.trim()
            ? `el texto de «${ETIQUETA_CAMPO[regla.campoDescripcion]}»`
            : `el texto general del sitio («${seoConfig.defaultDescription}»)`}
          .
        </li>
        <li>
          <strong>Imagen al compartir en redes:</strong>{" "}
          {regla.imagen ? `${regla.imagen} Esta, solo si no hay.` : "Se usa esta."} Si no hay
          ninguna, el logo de Partequipos.
        </li>
      </ul>
    </div>
  );
}
