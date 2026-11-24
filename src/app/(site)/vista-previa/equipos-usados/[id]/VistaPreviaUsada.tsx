"use client";

import { useLivePreview } from "@payloadcms/live-preview-react";
import type { ReactNode } from "react";

import { FichaProducto } from "@/components/ficha/FichaProducto";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { ImagenLista } from "@/lib/utils/relations";
import { piezasFichaUsada, type Categoria } from "@/lib/vistaPrevia/fichaUsada";
import type { EquiposUsado } from "@/payload-types";

/*
 * «use client»: la vista previa en vivo recibe del panel, por `postMessage`, lo que el editor
 * va escribiendo (`useLivePreview`), y la ficha se vuelve a pintar con esos datos sin guardar.
 * Es el único componente que importa `@payloadcms/live-preview-react` (ver la página).
 */

type Props = {
  inicial: EquiposUsado;
  categoria: Categoria;
  origen: string;
  empresa: { telefono?: string | null; whatsapp: string };
  telefono: { etiqueta: string; href: string | null } | null;
  imagenContacto: ImagenLista | null;
  contactoEsFoto: boolean;
  formulario: ConfigFormulario;
  contacto: ReactNode;
};

export function VistaPreviaUsada({
  inicial,
  categoria,
  origen,
  empresa,
  telefono,
  imagenContacto,
  contactoEsFoto,
  formulario,
  contacto,
}: Props) {
  // depth 1: fotos, PDF, marca y categoría pobladas, como en la página publicada.
  const { data } = useLivePreview<EquiposUsado>({
    initialData: inicial,
    serverURL: origen,
    depth: 1,
  });
  const p = piezasFichaUsada(data, categoria, empresa, (ruta) => `${origen}${ruta}/`);

  return (
    <FichaProducto
      nombre={p.nombre}
      urlFicha={`${origen}${p.ruta}/`}
      migas={p.migas}
      fotos={p.fotos}
      datos={p.datos}
      experto={p.experto}
      logo={null}
      cuerpo={p.parrafos.map((t, i) => (
        <p key={`${i}-${t}`}>{t}</p>
      ))}
      especificaciones={[]}
      pdf={p.pdf}
      tituloOtras="Otras unidades de esta categoría"
      textoVerMas="Ver unidad"
      otras={[]}
      imagenContacto={imagenContacto}
      contactoEsFoto={contactoEsFoto}
      jsonLd={null}
      formulario={formulario}
      telefono={telefono}
      contacto={contacto}
    />
  );
}
