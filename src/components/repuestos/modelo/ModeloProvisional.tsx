import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import type { ImagenLista } from "@/lib/utils/relations";
import type { CategoriaMarca } from "@/lib/repuestos/marca";
import type { VistaModelo } from "@/lib/repuestos/modelo";

/*
 * La página de modelo de repuestos PROVISIONAL (dirección, 2026-10-19): en el
 * sitio publicado solo van diseños de Andrés, así que mientras no llegue el
 * suyo la página enseña el contenido de WordPress de forma sencilla, en el
 * estilo de antes del #267. Se elige en el global «Páginas de marca de
 * repuestos» → «Diseño de las páginas de modelo».
 */
export function ModeloProvisional({
  migas,
  vista,
  descripcion,
  imagenes,
  categorias,
  marca,
  tipo,
  codigo,
  ayuda,
  contacto,
}: {
  migas: { nombre: string; path: string }[];
  vista: VistaModelo;
  descripcion: string;
  imagenes: ImagenLista[];
  categorias: CategoriaMarca[];
  marca: { nombre: string; href: string };
  tipo: { nombre: string; href: string };
  codigo: string;
  /** La tarjeta «Estamos aquí para ayudarlo» de WordPress, en sencillo. */
  ayuda: {
    titulo: string;
    texto: string;
    boton: string;
    href: string | null;
    foto: ImagenLista | null;
  };
  contacto: {
    titulo: string;
    origen: string;
    siteKey: string | null;
    whatsapp?: { href: string; etiqueta: string };
    modelo: { id: number; nombre: string };
    textoBoton: string;
  };
}) {
  return (
    <>
      <Breadcrumbs items={migas} />

      {vista.antetitulo ? (
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          {vista.antetitulo}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold text-gray-900">{vista.titulo}</h1>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600">
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">Marca:</dt>
          <dd>
            <Link href={marca.href} className="underline hover:text-gray-900">
              {marca.nombre}
            </Link>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">Tipo de equipo:</dt>
          <dd>
            <Link href={tipo.href} className="underline hover:text-gray-900">
              {tipo.nombre}
            </Link>
          </dd>
        </div>
        {codigo ? (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-900">Código:</dt>
            <dd>{codigo}</dd>
          </div>
        ) : null}
      </dl>

      {descripcion ? (
        <p className="mt-6 max-w-2xl whitespace-pre-line text-gray-700">{descripcion}</p>
      ) : null}

      {imagenes.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Imágenes">
          {imagenes.map((img, i) => (
            <li key={img.url} className="rounded-lg border border-gray-200 p-3">
              <Image
                src={img.url}
                alt={img.alt}
                width={img.width}
                height={img.height}
                // La primera foto es el LCP: carga inmediata y prioridad alta (#264).
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                sizes="(min-width: 896px) 400px, (min-width: 640px) 48vw, 92vw"
                className="h-auto w-full object-contain"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {vista.piezas.length > 0 || categorias.length > 0 ? (
        <section className="mt-10" aria-labelledby="modelo-disponibles">
          <h2 id="modelo-disponibles" className="text-xl font-medium text-gray-900">
            {vista.disponibles}
          </h2>
          {vista.piezas.length > 0 ? (
            <ul className="mt-4 list-disc columns-1 gap-8 pl-5 text-gray-700 sm:columns-2">
              {vista.piezas.map((p, i) => (
                <li key={`${i}-${p}`}>{p}</li>
              ))}
            </ul>
          ) : null}
          {categorias.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
              {categorias.map((c) => (
                <li key={c.id}>
                  {c.href ? (
                    <Link href={c.href} className="underline hover:text-gray-900">
                      {c.nombre}
                    </Link>
                  ) : (
                    c.nombre
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {ayuda.titulo && ayuda.href ? (
        <section
          className="mt-10 flex flex-col gap-4 rounded-lg border border-gray-200 p-6 sm:flex-row sm:items-center"
          aria-labelledby="modelo-ayuda"
        >
          {ayuda.foto ? (
            <Image
              src={ayuda.foto.url}
              alt={ayuda.foto.alt}
              width={ayuda.foto.width}
              height={ayuda.foto.height}
              sizes="(min-width: 640px) 240px, 92vw"
              className="h-auto w-full rounded sm:w-60"
            />
          ) : null}
          <div>
            <h2 id="modelo-ayuda" className="text-xl font-medium text-gray-900">
              {ayuda.titulo}
            </h2>
            {ayuda.texto ? <p className="mt-1 text-gray-700">{ayuda.texto}</p> : null}
            <a
              href={ayuda.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block underline hover:text-gray-900"
            >
              {ayuda.boton}
            </a>
          </div>
        </section>
      ) : null}

      {/* Solicitud del repuesto con el modelo preseleccionado; con «Ciudad», sin n.º de documento (Ley 1581). */}
      <FormularioSolicitud
        tipo="repuesto"
        origen={contacto.origen}
        siteKey={contacto.siteKey}
        whatsapp={contacto.whatsapp}
        referencia={{
          tipo: "modelos-repuesto",
          id: contacto.modelo.id,
          texto: contacto.modelo.nombre,
        }}
        titulo={contacto.titulo}
        textoBoton={contacto.textoBoton}
        conCiudad
        etiquetaMensaje="¿En qué estás interesado?"
      />

      <nav
        className="mt-10 border-t border-gray-200 pt-6 text-sm"
        aria-label="Navegación de catálogo"
      >
        <Link href={tipo.href} className="underline hover:text-gray-900">
          ← Ver todos los modelos de {tipo.nombre.trim()} {marca.nombre}
        </Link>
      </nav>
    </>
  );
}
