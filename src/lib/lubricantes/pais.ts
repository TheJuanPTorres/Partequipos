/**
 * PAÍS DE ORIGEN de una marca de lubricantes (2026-11-04, dirección: Eni de Italia y Dispel de
 * Colombia, cada una con su bandera en el desplegable «Lubricantes» del menú). Lista cerrada:
 * Italia, Colombia y los países de las marcas de lubricantes más frecuentes. Cada valor tiene su
 * bandera dibujada en `components/marca/Bandera.tsx`; la prueba exige que no falte ninguna.
 *
 * El valor es el código ISO 3166-1 alfa-2 en minúscula (es lo que se guarda en la base).
 */
export const PAISES = [
  { valor: "it", nombre: "Italia" },
  { valor: "co", nombre: "Colombia" },
  { valor: "de", nombre: "Alemania" },
  { valor: "us", nombre: "Estados Unidos" },
  { valor: "gb", nombre: "Reino Unido" },
  { valor: "nl", nombre: "Países Bajos" },
  { valor: "fr", nombre: "Francia" },
  { valor: "es", nombre: "España" },
  { valor: "jp", nombre: "Japón" },
  { valor: "kr", nombre: "Corea del Sur" },
  { valor: "cn", nombre: "China" },
  { valor: "br", nombre: "Brasil" },
] as const;

export type CodigoPais = (typeof PAISES)[number]["valor"];

/** Las opciones del campo del panel, en el orden de la lista. */
export const OPCIONES_PAIS = PAISES.map((p) => ({ label: p.nombre, value: p.valor }));

/** El país de un valor guardado, o `null` si está vacío o no es de la lista. */
export function paisDe(
  valor: string | null | undefined,
): { codigo: CodigoPais; nombre: string } | null {
  const p = PAISES.find((x) => x.valor === valor);
  return p ? { codigo: p.valor, nombre: p.nombre } : null;
}
