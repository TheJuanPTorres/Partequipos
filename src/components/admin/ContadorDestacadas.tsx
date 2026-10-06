"use client";

import { useFormFields } from "@payloadcms/ui";

import { contarDestacadas, MAX_DESTACADAS } from "@/lib/maquinaria/fichaTecnica";

/**
 * Contador EN VIVO de las filas «Destacar» de la ficha técnica de un equipo
 * nuevo (campo `ui`: no guarda nada ni tiene columna).
 *
 * Por qué existe (revisión en pantalla del 2026-10-06): con 5 marcadas, Payload
 * rechazaba al guardar con un aviso genérico y NO pintaba el mensaje junto a
 * las casillas, así que el editor no sabía qué quitar. Este contador lo dice
 * antes de guardar. La validación del servidor (`validarDestacarFila`) sigue
 * siendo la que manda.
 */
export default function ContadorDestacadas() {
  // Solo las casillas «Destacar» de la ficha técnica: fichaTecnica.<n>.destacar.
  const marcadas = useFormFields(([campos]) =>
    contarDestacadas(
      Object.entries(campos)
        .filter(([ruta]) => /^fichaTecnica\.\d+\.destacar$/.test(ruta))
        .map(([, campo]) => campo?.value),
    ),
  );
  const sobran = marcadas - MAX_DESTACADAS;

  return (
    <p role="status" className={`pq-destacadas${sobran > 0 ? " pq-destacadas--error" : ""}`}>
      {sobran > 0
        ? `Hay ${marcadas} filas con «Destacar» y solo caben ${MAX_DESTACADAS}: quita «Destacar» en ${sobran === 1 ? "una" : sobran}. Si no, no se podrá guardar.`
        : `Filas destacadas: ${marcadas} de ${MAX_DESTACADAS}.`}
    </p>
  );
}
