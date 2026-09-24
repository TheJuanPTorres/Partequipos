/**
 * Siembra o retira la PORTADA DE PRUEBA en el PREVIEW, con las fotos de Andrés
 * (ux-9): la diapositiva del hero y, desde la fase D, las secciones 2 y 3.
 * Sirve para medir el LCP tras cada fase (CLAUDE.md §10.3 p.14) y para
 * enseñarle la portada. Lógica y guardián: `src/lib/portada/heroPrueba.ts`.
 *
 * Uso (las DOS variables del preview, explícitas):
 *
 *   DATABASE_URI="<pooled de la rama preview>" BLOB_READ_WRITE_TOKEN="<token del Blob del preview>" \
 *     npm run preview:hero-prueba -- sembrar
 *   … npm run preview:hero-prueba -- retirar
 *
 * - SOLO preview: se niega ANTES de conectar si la base o el Blob no son los del
 *   preview. `payload run` carga `.env.local`, cuyo Blob es el de PRODUCCIÓN.
 * - Idempotente: lo que ya existe no se duplica.
 * - Punto focal en el centro (50/50), como en el diseño.
 * - NO PISA DATOS: a una marca solo se le pone foto o logo de prueba si no
 *   tenía; la máquina de la sección 3, igual. Los equipos de prueba son
 *   registros NUEVOS, marcados en su descripción.
 * - `retirar`: quita PRIMERO lo que apunta a las imágenes (diapositiva, equipos,
 *   relaciones de marcas y portada) y DESPUÉS las imágenes, y comprueba que los
 *   ficheros desaparecen del Blob.
 * - La sección 3 necesita la migración de la fase D en el preview: sembrar
 *   DESPUÉS de que el despliegue de la rama haya migrado.
 *
 * NO REFRESCA LA PORTADA DEL PREVIEW: el script corre fuera de Next y su
 * `revalidatePath` no llega al despliegue (§10.6). Al acabar, guardar la portada
 * en el panel del preview (sin cambios) o redesplegar.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import {
  DIAPOSITIVA_PRUEBA,
  EQUIPOS_PRUEBA,
  FOCAL_PRUEBA,
  IMAGENES_PRUEBA,
  IMAGENES_SECCIONES,
  MARCA_PRUEBA,
  esDiapositivaDePrueba,
  esEquipoDePrueba,
  puedeTocarHeroDePrueba,
  sinDiapositivasDePrueba,
} from "../../src/lib/portada/heroPrueba";
import { SLUG_EXCAVADORAS } from "../../src/lib/portada/secciones";
import { SLUG_PORTADA } from "../../src/lib/queries/getPaginas";

const modo = process.argv[process.argv.length - 1];
if (modo !== "sembrar" && modo !== "retirar") {
  console.error("[hero-prueba] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[hero-prueba] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}

// Un script de datos no toca el esquema (CLAUDE.md §10.9).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[hero-prueba] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Imagen = { fichero: string; alt: string; paleta?: boolean };
const TODAS: Imagen[] = [...IMAGENES_PRUEBA, ...IMAGENES_SECCIONES];

/** Busca el fichero bajo Desktop/partequipos-diseno/assets (el kit viene en subcarpetas). */
function rutaDeFichero(nombre: string): string {
  const base =
    process.env.HERO_PRUEBA_ASSETS ??
    path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets");
  const pendientes = [base];
  while (pendientes.length) {
    const dir = pendientes.pop()!;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pendientes.push(p);
      else if (e.name === nombre) return p;
    }
  }
  throw new Error(`no encuentro ${nombre} bajo ${base}`);
}

/**
 * Registros de prueba de `media`, por su texto alternativo (lleva la marca y es
 * único por imagen). No por nombre de fichero: si el Blob ya tuviera uno con
 * ese nombre, Payload lo renombraría y la siguiente siembra lo duplicaría.
 */
async function mediaDePrueba() {
  const r = await payload.find({
    collection: "media",
    where: { alt: { like: MARCA_PRUEBA } },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  });
  return r.docs.filter((m) => TODAS.some((i) => i.alt === m.alt));
}

async function portada() {
  const r = await payload.find({
    collection: "paginas",
    where: { slug: { equals: SLUG_PORTADA } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const doc = r.docs[0];
  if (!doc) throw new Error("no existe la portada (slug «inicio») en el preview");
  return doc;
}

async function equiposDePrueba() {
  const r = await payload.find({
    collection: "equipos-usados",
    where: { descripcion: { like: MARCA_PRUEBA } },
    depth: 0,
    limit: 20,
    overrideAccess: true,
  });
  return r.docs.filter(esEquipoDePrueba);
}

/** Espera a que la URL pública responda lo esperado; la caché tarda hasta 60 s. */
async function esperarEstado(url: string, esperado: number, topeSeg = 150): Promise<number> {
  const fin = Date.now() + topeSeg * 1000;
  let estado = 0;
  while (Date.now() < fin) {
    estado = (await fetch(url, { method: "HEAD" }).catch(() => null))?.status ?? 0;
    if (estado === esperado) return estado;
    await esperar(10_000);
  }
  return estado;
}

async function subir(img: Imagen): Promise<number> {
  const ruta = rutaDeFichero(img.fichero);
  if (!img.paleta) {
    const creado = await payload.create({
      collection: "media",
      data: { alt: img.alt, ...FOCAL_PRUEBA },
      filePath: ruta,
      overrideAccess: true,
    });
    log(`${img.fichero}: subida (id ${creado.id})`);
    return creado.id;
  }
  // PNG con paleta: exacta en todo píxel visible para una imagen de ≤ 256 colores.
  const { default: sharp } = await import("sharp");
  const data = await sharp(ruta).png({ compressionLevel: 9, palette: true, effort: 10 }).toBuffer();
  const creado = await payload.create({
    collection: "media",
    data: { alt: img.alt, ...FOCAL_PRUEBA },
    file: { data, mimetype: "image/png", name: img.fichero, size: data.length },
    overrideAccess: true,
  });
  log(`${img.fichero}: subida con paleta, ${Math.round(data.length / 1024)} kB (id ${creado.id})`);
  return creado.id;
}

if (modo === "sembrar") {
  // --- Imágenes -------------------------------------------------------------
  const existentes = await mediaDePrueba();
  const idPorFichero: Record<string, number> = {};
  for (const img of TODAS) {
    const ya = existentes.find((m) => m.alt === img.alt);
    if (ya) {
      idPorFichero[img.fichero] = ya.id;
      if (ya.focalX !== FOCAL_PRUEBA.focalX || ya.focalY !== FOCAL_PRUEBA.focalY) {
        await payload.update({
          collection: "media",
          id: ya.id,
          data: { ...FOCAL_PRUEBA },
          overrideAccess: true,
        });
        log(`${img.fichero}: ya existía (id ${ya.id}); punto focal devuelto al centro`);
      } else {
        log(`${img.fichero}: ya existía (id ${ya.id}), sin cambios`);
      }
      continue;
    }
    idPorFichero[img.fichero] = await subir(img);
  }
  const idsPrueba = Object.values(idPorFichero);
  /** Vacío o ya de prueba: se puede poner la de prueba sin pisar un dato real. */
  const libreODePrueba = (rel: unknown) =>
    rel == null ||
    idsPrueba.includes(typeof rel === "object" ? (rel as { id: number }).id : (rel as number));

  // --- Sección 1: la diapositiva --------------------------------------------
  const pag = await portada();
  const diapositivas = pag.hero?.diapositivas ?? [];
  const fondo = idPorFichero[IMAGENES_PRUEBA[0].fichero]!;
  const frontal = idPorFichero[IMAGENES_PRUEBA[1].fichero]!;
  if (diapositivas.some((d) => esDiapositivaDePrueba(d, [fondo, frontal]))) {
    log("la diapositiva de prueba ya estaba en la portada: no se duplica");
  } else {
    // PRIMERA: la medición del LCP es la de la primera diapositiva.
    await payload.update({
      collection: "paginas",
      id: pag.id,
      data: {
        hero: {
          diapositivas: [
            { ...DIAPOSITIVA_PRUEBA, imagenFondo: fondo, imagenFrontal: frontal },
            ...diapositivas,
          ],
        },
      },
      overrideAccess: true,
    });
    log("diapositiva «Potencia Hitachi» añadida como PRIMERA de la portada");
  }

  // --- Sección 2: foto y logo de las marcas, SOLO si no tenían ----------------
  for (const img of IMAGENES_SECCIONES) {
    const [campo, slug] = img.papel.split(":") as [string, string | undefined];
    if ((campo !== "tarjeta" && campo !== "logo") || !slug) continue;
    const r = await payload.find({
      collection: "marcas-maquinaria",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    const marca = r.docs[0];
    if (!marca) {
      log(`marca «${slug}»: no existe en el preview; se omite`);
      continue;
    }
    const clave = campo === "tarjeta" ? "imagenTarjeta" : "logo";
    if (!libreODePrueba(marca[clave])) {
      log(`marca «${slug}»: ya tiene ${clave} propio; no se pisa`);
      continue;
    }
    await payload.update({
      collection: "marcas-maquinaria",
      id: marca.id,
      data: { [clave]: idPorFichero[img.fichero]! },
      overrideAccess: true,
    });
    log(`marca «${slug}»: ${clave} de prueba`);
  }

  // --- Sección 3: la máquina y los equipos ----------------------------------
  const maquina = IMAGENES_SECCIONES.find((i) => i.papel === "maquina")!;
  const pag3 = await portada();
  if (libreODePrueba(pag3.seccionUsada?.imagen)) {
    await payload.update({
      collection: "paginas",
      id: pag3.id,
      data: { seccionUsada: { imagen: idPorFichero[maquina.fichero]! } },
      overrideAccess: true,
    });
    log("portada: máquina de prueba en la sección 3");
  } else {
    log("portada: la sección 3 ya tiene máquina propia; no se pisa");
  }

  const cats = await payload.find({
    collection: "categorias-usada",
    where: { slug: { equals: SLUG_EXCAVADORAS } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const categoria = cats.docs[0];
  if (!categoria) {
    log(`categoría «${SLUG_EXCAVADORAS}»: no existe en el preview; sin equipos de prueba`);
  } else {
    const ya = await equiposDePrueba();
    for (const e of EQUIPOS_PRUEBA) {
      const idImagen = idPorFichero[e.imagen]!;
      const existe = ya.some((x) =>
        (x.imagenes ?? []).some((i) => (typeof i === "object" ? i.id : i) === idImagen),
      );
      if (existe) {
        log(`equipo de prueba con ${e.imagen}: ya existía`);
        continue;
      }
      const creado = await payload.create({
        collection: "equipos-usados",
        data: {
          nombre: e.nombre,
          marca: e.marca,
          modelo: e.modelo,
          pesoOperativo: e.pesoOperativo,
          potencia: e.potencia,
          motor: e.motor,
          descripcion: e.descripcion,
          categoria: categoria.id,
          imagenes: [idImagen],
          disponible: true,
        },
        overrideAccess: true,
      });
      log(`equipo de prueba creado (id ${creado.id})`);
    }
  }

  for (const m of await mediaDePrueba()) {
    const estado = await esperarEstado(m.url!, 200, 30);
    log(`Blob ${m.filename}: ${estado}`);
  }
  log("HECHO. Para verla: guarda la portada en el panel del preview (sin cambios) o redespliega.");
} else {
  const medias = await mediaDePrueba();
  const idsPrueba = medias.map((m) => m.id);
  const apunta = (rel: unknown) =>
    rel != null &&
    idsPrueba.includes(typeof rel === "object" ? (rel as { id: number }).id : (rel as number));

  // 1. PRIMERO lo que apunta a las imágenes. La diapositiva: su fondo es obligatorio.
  const pag = await portada();
  const antes = pag.hero?.diapositivas ?? [];
  const despues = sinDiapositivasDePrueba(antes, idsPrueba);
  const quitarMaquina = apunta(pag.seccionUsada?.imagen);
  if (despues.length !== antes.length || quitarMaquina) {
    await payload.update({
      collection: "paginas",
      id: pag.id,
      data: {
        hero: { diapositivas: despues },
        ...(quitarMaquina ? { seccionUsada: { imagen: null } } : {}),
      },
      overrideAccess: true,
    });
    log(
      `portada: diapositivas ${antes.length} → ${despues.length}${quitarMaquina ? "; máquina de la sección 3 quitada" : ""}`,
    );
  } else {
    log("portada: nada de prueba");
  }

  for (const e of await equiposDePrueba()) {
    await payload.delete({ collection: "equipos-usados", id: e.id, overrideAccess: true });
    log(`equipo de prueba ${e.id} borrado`);
  }

  const marcas = await payload.find({
    collection: "marcas-maquinaria",
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });
  for (const m of marcas.docs) {
    const data = {
      ...(apunta(m.imagenTarjeta) ? { imagenTarjeta: null } : {}),
      ...(apunta(m.logo) ? { logo: null } : {}),
    };
    if (Object.keys(data).length === 0) continue;
    await payload.update({
      collection: "marcas-maquinaria",
      id: m.id,
      data,
      overrideAccess: true,
    });
    log(`marca «${m.slug}»: quitado ${Object.keys(data).join(" y ")}`);
  }

  // 2. DESPUÉS las imágenes. El plugin de Blob borra el fichero al borrar el registro.
  for (const m of medias) {
    await payload.delete({ collection: "media", id: m.id, overrideAccess: true });
    log(`${m.filename}: registro ${m.id} borrado`);
  }

  // 3. Que los ficheros desaparezcan del Blob (hasta 150 s por la caché).
  let fallos = 0;
  for (const m of medias) {
    const estado = await esperarEstado(m.url!, 404);
    if (estado !== 404) fallos++;
    log(`Blob ${m.filename}: ${estado === 404 ? "404, borrado" : `SIGUE RESPONDIENDO ${estado}`}`);
  }
  if (fallos) {
    console.error(
      `[hero-prueba] ${fallos} fichero(s) siguen en el Blob tras 150 s: revisar a mano.`,
    );
    process.exit(1);
  }
  log("HECHO. Para que la portada deje de mostrarla: guárdala en el panel o redespliega.");
}
process.exit(0);
