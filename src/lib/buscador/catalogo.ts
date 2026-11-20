import config from "@payload-config";
import { getPayload } from "payload";

import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { soloPublicado } from "@/lib/borradores";
import { rutas } from "@/lib/routes";
import {
  conEquipoVisible,
  conProductoVisible,
  MARCA_VISIBLE,
  DE_MARCA_VISIBLE,
} from "@/lib/nueva/visibilidad";
import type {
  Articulo,
  CategoriasLubricante,
  CategoriasMaquinaria,
  Pagina,
  CategoriasTecnica,
  MarcasLubricante,
  Sede,
} from "@/payload-types";

import type { DocBusqueda } from "./motor";

/**
 * EL CATÁLOGO COMO DOCUMENTOS DE BÚSQUEDA (2026-11-18): todo lo publicado que un visitante puede
 * querer encontrar, con su dirección y los textos por los que se busca. API local de Payload
 * (CLAUDE.md §3.2), solo lo visible (`visibilidad.ts`: marcas ocultas, «Mostrar en la web»).
 *
 * Lo llama `servidor.ts`, que guarda el resultado en la caché de datos (`datos:busqueda`) y lo
 * regenera cuando un gancho del panel invalida esa etiqueta.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";
const unir = (...partes: (string | null | undefined)[]) =>
  partes.map(texto).filter(Boolean).join(" · ");

type MediaMin = { id: number; url?: string | null; width?: number | null; height?: number | null };

const referencia = <T extends { id: number }>(
  rel: number | T | null | undefined,
  mapa: Map<number, T>,
): T | null => (typeof rel === "number" ? (mapa.get(rel) ?? null) : (rel ?? null));

const porId = <T extends { id: number }>(docs: T[]) => new Map(docs.map((d) => [d.id, d]));

/** Las filas de la ficha técnica («Potencia neta 122 kW») como un solo texto. */
function specs(filas: { etiqueta: string; valor: string }[] | null | undefined): string {
  return (filas ?? []).map((f) => `${f.etiqueta} ${f.valor}`).join(" ");
}

export async function cargarDocumentos(): Promise<DocBusqueda[]> {
  const payload = await getPayload({ config });
  // Sin profundidad: una consulta por colección y las relaciones se resuelven aquí con mapas (con
  // `depth: 1` cada equipo traía sus fotos, su marca y su tipo, y la primera búsqueda tardaba ~3 s).
  const todo = { depth: 0, limit: 0, pagination: false } as const;

  const [
    nuevos,
    usados,
    modelos,
    marcas,
    tipos,
    categorias,
    lubMarcas,
    lubCats,
    articulos,
    sedes,
    marcasNueva,
    categoriasNueva,
    categoriasUsada,
    paginas,
    tiposNueva,
    marcasUsadas,
    mediaDocs,
  ] = await Promise.all([
    payload.find({ collection: "equipos-nuevos", where: conEquipoVisible(), ...todo }),
    payload.find({
      collection: "equipos-usados",
      where: conProductoVisible({ disponible: { equals: true } }),
      ...todo,
    }),
    payload.find({ collection: "modelos-repuesto", where: conProductoVisible(), ...todo }),
    payload.find({ collection: "marcas", ...todo }),
    payload.find({ collection: "tipos-equipo", ...todo }),
    payload.find({ collection: "categorias-tecnicas", ...todo }),
    payload.find({ collection: "marcas-lubricante", ...todo }),
    payload.find({ collection: "categorias-lubricante", ...todo }),
    payload.find({ collection: "articulos", where: soloPublicado(), ...todo, depth: 0 }),
    payload.find({ collection: "sedes", ...todo, depth: 0 }),
    payload.find({ collection: "marcas-maquinaria", where: MARCA_VISIBLE, ...todo }),
    payload.find({ collection: "categorias-maquinaria", ...todo }),
    payload.find({ collection: "categorias-usada", ...todo }),
    payload.find({ collection: "paginas", ...todo, depth: 0 }),
    payload.find({ collection: "tipos-maquinaria", where: DE_MARCA_VISIBLE, ...todo }),
    payload.find({ collection: "marcas-usada", ...todo }),
    payload.find({
      collection: "media",
      ...todo,
      select: { url: true, filename: true, width: true, height: true },
    }),
  ]);

  const mMarca = porId(marcas.docs);
  const mTipoEquipo = porId(tipos.docs);
  const mMarcaNueva = porId(marcasNueva.docs);
  const mTipoNueva = porId(tiposNueva.docs);
  const mCategoriaUsada = porId(categoriasUsada.docs);
  const mMarcaUsada = porId(marcasUsadas.docs);
  const mLubMarca = porId(lubMarcas.docs);
  const media = porId(mediaDocs.docs as MediaMin[]);
  const imagen = (m: number | MediaMin | null | undefined) => {
    const doc = referencia(m, media);
    return doc?.url && doc.width && doc.height
      ? { url: doc.url, width: doc.width, height: doc.height }
      : null;
  };

  const docs: DocBusqueda[] = [];

  for (const e of nuevos.docs) {
    const marca = referencia(e.marca, mMarcaNueva);
    const tipo = referencia(e.tipo, mTipoNueva);
    if (!marca || !tipo) continue;
    docs.push({
      id: `nueva-${e.id}`,
      clase: "nueva",
      titulo: e.nombre,
      href: `${rutas.equipoNuevo(marca.slug, tipo.slug, e.slug)}/`,
      detalle: unir("Maquinaria nueva", marca.nombre, tipo.nombre),
      marca: marca.nombre,
      tipo: tipo.nombre,
      imagen: imagen((e.imagenes ?? [])[0]) ?? imagen(tipo.imagen) ?? imagen(marca.logo),
      campos: {
        titulo: e.nombre,
        codigo: e.codigo ?? undefined,
        marca: marca.nombre,
        tipo: tipo.nombre,
        descripcion: texto(e.entradilla),
        specs: specs(e.fichaTecnica),
      },
    });
  }

  for (const u of usados.docs) {
    const categoria = referencia(u.categoria, mCategoriaUsada);
    if (!categoria) continue;
    const marca = texto(referencia(u.marcaUsada, mMarcaUsada)?.nombre) || texto(u.marca);
    docs.push({
      id: `usada-${u.id}`,
      clase: "usada",
      titulo: u.nombre,
      href: `${u.slug ? rutas.unidadUsada(categoria.slug, u.slug) : rutas.categoriaUsada(categoria.slug)}/`,
      detalle: unir("Maquinaria usada", categoria.nombre, u.anio ? String(u.anio) : ""),
      marca: marca || undefined,
      tipo: categoria.nombre,
      imagen: imagen((u.imagenes ?? [])[0]) ?? imagen(categoria.imagen),
      campos: {
        titulo: u.nombre,
        codigo: u.modelo ?? undefined,
        marca,
        tipo: categoria.nombre,
        descripcion: unir(u.descripcionCorta, u.descripcion, u.motor, u.ubicacion),
        specs: unir(u.anio ? String(u.anio) : "", u.horometro ? `${u.horometro} horas` : ""),
      },
    });
  }

  for (const m of modelos.docs) {
    const marca = referencia(m.marca, mMarca);
    const tipo = referencia(m.tipo, mTipoEquipo);
    if (!marca || !tipo) continue;
    docs.push({
      id: `modelo-${m.id}`,
      clase: "modelo",
      titulo: m.nombre,
      href: `${rutas.modelo(marca.slug, segmentoDeTipo(tipo), m.slug)}/`,
      detalle: unir("Repuestos", marca.nombre, tipo.nombre),
      marca: marca.nombre,
      tipo: tipo.nombre,
      imagen: imagen((m.imagenes ?? [])[0]) ?? imagen(tipo.imagen) ?? imagen(marca.logo),
      campos: {
        titulo: m.nombre,
        codigo: unir(m.codigo, m.serie) || undefined,
        marca: marca.nombre,
        tipo: tipo.nombre,
        descripcion: texto(m.descripcion),
      },
    });
  }

  for (const m of marcas.docs) {
    docs.push({
      id: `repuestos-marca-${m.id}`,
      clase: "marca",
      titulo: `Repuestos para maquinaria pesada ${m.nombre}`,
      href: `${rutas.marca(m.slug)}/`,
      detalle: unir("Repuestos", m.nombre),
      marca: m.nombre,
      imagen: imagen(m.logo),
      campos: {
        titulo: `Repuestos para maquinaria pesada ${m.nombre}`,
        marca: m.nombre,
        descripcion: texto(m.descripcion),
      },
    });
  }

  for (const m of marcasNueva.docs) {
    docs.push({
      id: `nueva-marca-${m.id}`,
      clase: "marca",
      titulo: `Maquinaria pesada ${m.nombre}`,
      href: `${rutas.marcaMaquinaria(m.slug)}/`,
      detalle: unir("Maquinaria nueva", m.nombre),
      marca: m.nombre,
      imagen: imagen(m.logo),
      campos: {
        titulo: `Maquinaria pesada ${m.nombre}`,
        marca: m.nombre,
        descripcion: texto(m.descripcion),
      },
    });
  }

  for (const c of categoriasNueva.docs as CategoriasMaquinaria[]) {
    docs.push({
      id: `nueva-categoria-${c.id}`,
      clase: "categoria",
      titulo: `${c.nombre} nuevas`,
      href: `${rutas.categoriaNueva(c.slug)}/`,
      detalle: "Maquinaria nueva",
      tipo: c.nombre,
      campos: { titulo: `${c.nombre} nuevas`, tipo: c.nombre },
    });
  }

  for (const c of categoriasUsada.docs) {
    docs.push({
      id: `usada-categoria-${c.id}`,
      clase: "categoria",
      titulo: `${c.nombre} usadas`,
      href: `${rutas.categoriaUsada(c.slug)}/`,
      detalle: "Maquinaria usada",
      tipo: c.nombre,
      campos: { titulo: `${c.nombre} usadas`, tipo: c.nombre },
    });
  }

  for (const p of paginas.docs as Pagina[]) {
    // La portada no es un resultado; el resto (servicio técnico, garantías, nosotros…) sí.
    if (p.slug === "inicio" || p.tipoPagina === "portada") continue;
    docs.push({
      id: `pagina-${p.id}`,
      clase: /servicio|taller|mantenimiento|garantia|financiaci/i.test(p.slug)
        ? "servicio"
        : "pagina",
      titulo: p.titulo,
      href: `/${p.slug}/`,
      detalle: p.tipoPagina === "legal" ? "Información legal" : "Información",
      campos: { titulo: p.titulo, descripcion: texto(p.entradilla) },
    });
  }

  for (const t of tipos.docs) {
    const marca = referencia(t.marca, mMarca);
    if (!marca) continue;
    docs.push({
      id: `repuestos-tipo-${t.id}`,
      clase: "repuestos",
      titulo: `Repuestos ${t.nombre} ${marca.nombre}`,
      href: `${rutas.tipo(marca.slug, segmentoDeTipo(t))}/`,
      detalle: unir("Repuestos", marca.nombre, t.nombre),
      marca: marca.nombre,
      tipo: t.nombre,
      imagen: imagen(t.imagen) ?? imagen(marca.logo),
      campos: {
        titulo: `Repuestos ${t.nombre} ${marca.nombre}`,
        marca: marca.nombre,
        tipo: t.nombre,
        descripcion: texto(t.descripcion),
      },
    });
  }

  for (const c of categorias.docs as CategoriasTecnica[]) {
    docs.push({
      id: `categoria-${c.id}`,
      clase: "categoria",
      titulo: c.nombre,
      href: `${rutas.categoriaRepuestos(c.slug)}/`,
      detalle: "Categoría de repuestos",
      imagen: imagen(c.imagen),
      campos: { titulo: c.nombre, descripcion: texto(c.descripcion) },
    });
  }

  for (const m of lubMarcas.docs as MarcasLubricante[]) {
    if (m.destino === "externo") continue;
    docs.push({
      id: `lubricante-marca-${m.id}`,
      clase: "lubricante",
      titulo: m.nombre,
      href: `${rutas.marcaLubricante(m.slug)}/`,
      detalle: "Lubricantes",
      marca: m.nombre,
      imagen: imagen(m.logo),
      campos: {
        titulo: m.nombre,
        marca: m.nombre,
        descripcion: `lubricantes aceite ${texto(m.entradilla)}`,
      },
    });
  }
  for (const c of lubCats.docs as CategoriasLubricante[]) {
    const marca = referencia(c.marca, mLubMarca);
    if (!marca || marca.destino === "externo") continue;
    docs.push({
      id: `lubricante-${c.id}`,
      clase: "lubricante",
      titulo: `${c.nombre} ${marca.nombre}`,
      href: `${rutas.categoriaLubricante(marca.slug, c.slug)}/`,
      detalle: unir("Lubricantes", marca.nombre),
      marca: marca.nombre,
      imagen: imagen(c.imagen) ?? imagen(marca.logo),
      campos: {
        titulo: `${c.nombre} ${marca.nombre}`,
        marca: marca.nombre,
        descripcion: `lubricantes aceite ${texto(c.entradilla)}`,
      },
    });
  }

  for (const a of articulos.docs as Articulo[]) {
    docs.push({
      id: `blog-${a.id}`,
      clase: "blog",
      titulo: a.titulo,
      href: `${rutas.articulo(a.slug)}/`,
      detalle: "Noticias",
      imagen: imagen(a.imagenDestacada),
      campos: { titulo: a.titulo, descripcion: texto(a.entradilla) },
    });
  }

  for (const s of sedes.docs as Sede[]) {
    docs.push({
      id: `sede-${s.id}`,
      clase: "sede",
      titulo: `Sede ${s.nombre}`,
      href: "/nosotros/#sedes",
      detalle: unir("Sede", s.ciudad, s.departamento),
      imagen: imagen(s.foto),
      campos: { titulo: `Sede ${s.nombre}`, descripcion: unir(s.ciudad, s.departamento) },
    });
  }

  return docs;
}
