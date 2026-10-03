import { ValidationError } from "payload";
import type { CollectionBeforeValidateHook, CollectionSlug, PayloadRequest } from "payload";

/**
 * Guardarraíl: la marca elegida tiene que ser la marca del tipo elegido.
 *
 * EL PROBLEMA. Modelos de repuesto y equipos nuevos guardan `marca` Y `tipo`,
 * y el tipo ya pertenece a una marca: la marca está desnormalizada para las
 * consultas y las migas. El desplegable de tipos se filtra por la marca, pero
 * solo si la marca se elige ANTES; cambiarla después deja el tipo viejo. Nada
 * lo comprobaba, y el resultado no da error en ninguna parte: la ficha sale con
 * las migas y el JSON-LD de una marca y la URL de otra.
 *
 * Se corta al guardar, en `beforeValidate`, para que el editor vea el mensaje
 * junto al campo «Tipo de equipo» (§10.15: en `beforeChange` la validación ya
 * habría pasado). Es un hook de colección, así que también corre en la API
 * local de los scripts de importación, que ya resuelven el tipo dentro de su
 * marca y por tanto no se ven afectados.
 */

type Relacion = number | string | { id: number | string } | null | undefined;

/** Una relación llega como id o, con `depth`, como documento. */
export function idDeRelacion(valor: Relacion): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "object") return String(valor.id);
  return String(valor);
}

/**
 * Núcleo de la comprobación, sin Payload de por medio.
 *
 * Devuelve el mensaje de error, o `null` si todo cuadra. Si falta la marca o el
 * tipo no hay nada que comprobar: de eso se encarga `required`.
 */
export function comprobarMarcaDelTipo(
  marcaElegida: Relacion,
  marcaDelTipo: Relacion,
  nombreDelTipo: string,
): string | null {
  const elegida = idDeRelacion(marcaElegida);
  const delTipo = idDeRelacion(marcaDelTipo);
  if (!elegida || !delTipo) return null;
  if (elegida === delTipo) return null;
  return (
    `El tipo «${nombreDelTipo}» es de otra marca. ` +
    "Elige un tipo de la marca seleccionada, o cambia la marca."
  );
}

/**
 * Construye el hook para una colección concreta.
 *
 * @param coleccionDeTipos  colección de la relación `tipo`
 */
export function marcaDelTipoCoincide(
  coleccionDeTipos: CollectionSlug,
): CollectionBeforeValidateHook {
  return async ({ data, originalDoc, req }) => {
    if (!data) return data;
    // En una actualización parcial puede llegar solo uno de los dos campos: el
    // otro es el que ya estaba guardado.
    const marca = ("marca" in data ? data.marca : originalDoc?.marca) as Relacion;
    const tipo = ("tipo" in data ? data.tipo : originalDoc?.tipo) as Relacion;

    const idTipo = idDeRelacion(tipo);
    if (!idDeRelacion(marca) || !idTipo) return data;

    const documento = (await (req as PayloadRequest).payload.findByID({
      collection: coleccionDeTipos,
      id: idTipo,
      depth: 0,
      disableErrors: true,
      req,
    })) as { marca?: Relacion; nombre?: string } | null;
    // Un tipo inexistente lo rechaza la propia relación; aquí no se duplica.
    if (!documento) return data;

    const error = comprobarMarcaDelTipo(marca, documento.marca, documento.nombre ?? idTipo);
    if (error) {
      throw new ValidationError({ errors: [{ path: "tipo", message: error }] });
    }
    return data;
  };
}
