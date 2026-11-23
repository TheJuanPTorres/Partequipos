"use client";

import { useFormFields } from "@payloadcms/ui";

import { pareceDePrueba } from "@/lib/panel/avisos";

import { Aviso } from "./Aviso";

/**
 * Aviso en vivo arriba de la ficha (equipos nuevos y usados, modelos de repuesto) cuando el nombre
 * empieza por «test» o «prueba» (tanda 21, tarea 8): parece un dato de prueba y, guardado, sale en
 * la web. NO bloquea el guardado. Campo `ui`: no guarda nada.
 */
export default function AvisoNombreDePrueba() {
  const nombre = useFormFields(([campos]) => campos?.nombre?.value);
  if (!pareceDePrueba(nombre)) return null;
  return (
    <Aviso titulo="El nombre parece de una prueba." tono="aviso">
      <p>
        Si guardas, sale en la web con este nombre. Las pruebas se hacen en el entorno de pruebas,
        no aquí. Puedes guardar igualmente.
      </p>
    </Aviso>
  );
}
