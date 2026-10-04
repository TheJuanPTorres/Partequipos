"use client";

import { Button, ExternalLinkIcon, useLivePreviewContext } from "@payloadcms/ui";

/**
 * «Ver en el sitio», con texto.
 *
 * Sustituye al `PreviewButton` de Payload, que es solo un icono con el texto en
 * `title`: un editor no técnico no sabe qué hace (visto en la revisión en
 * pantalla). La URL es la misma que calcula `admin.preview`
 * (`src/lib/panel/verEnElSitio.ts`); sin URL no se pinta nada.
 *
 * Es componente de cliente porque la URL llega por el contexto del formulario.
 */
export default function VerEnElSitio() {
  const { previewURL } = useLivePreviewContext();
  if (!previewURL) return null;
  return (
    <Button
      buttonStyle="secondary"
      className="pq-ver-en-el-sitio"
      el="anchor"
      icon={<ExternalLinkIcon />}
      iconPosition="right"
      id="preview-button"
      margin={false}
      newTab
      size="medium"
      url={previewURL}
    >
      Ver en el sitio
    </Button>
  );
}
