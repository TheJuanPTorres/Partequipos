import { APIError, type CollectionBeforeOperationHook } from "payload";

/**
 * Rechaza subidas cuyo CONTENIDO no es JPEG, PNG o WebP, con un mensaje en
 * español.
 *
 * POR QUÉ EXISTE, si `upload.mimeTypes` ya valida en el servidor: el mensaje de
 * Payload está **cableado en inglés** («Invalid MIME type: image/gif.»,
 * `payload/dist/uploads/checkFileRestrictions.js`), sin pasar por su i18n. El
 * panel está en español (CLAUDE.md §5) y quien sube imágenes es el editor del
 * cliente, no un desarrollador.
 *
 * SE MIRA EL CONTENIDO, NO LA EXTENSIÓN NI EL TIPO DECLARADO. Renombrar un GIF
 * a `.png` cambia las dos cosas, y el fichero seguiría siendo un GIF. Payload
 * también lo detecta por contenido —comprobado en el preview: un GIF renombrado
 * a `.png` da «Invalid MIME type: image/gif.»—, así que esto NO sustituye su
 * validación: se adelanta para dar el mensaje en español, y la de Payload queda
 * detrás como red.
 *
 * Los formatos permitidos son los del sitio, y la lista viva está en
 * `Media.upload.mimeTypes`; aquí van sus firmas.
 */
const FIRMAS: { comprobar: (b: Buffer) => boolean; nombre: string }[] = [
  {
    nombre: "JPEG",
    comprobar: (b) => b.length > 2 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    nombre: "PNG",
    comprobar: (b) =>
      b.length > 7 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    // RIFF....WEBP
    nombre: "WebP",
    comprobar: (b) =>
      b.length > 11 &&
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export const formatoDeImagenPermitido: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") {
    return args;
  }

  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data) || file.data.length === 0) {
    return args;
  }

  if (FIRMAS.some(({ comprobar }) => comprobar(file.data))) {
    return args;
  }

  /*
   * 400 y no 500: es un dato de entrada incorrecto, no un fallo del servidor
   * (CLAUDE.md §8: no exponer trazas al usuario final).
   */
  throw new APIError(
    `«${file.name}» no es una imagen JPEG, PNG ni WebP. El sitio solo publica esos tres formatos; ` +
      `conviértela y vuelve a subirla. Si el nombre acaba en .jpg o .png pero el contenido es de otro ` +
      `formato, también se rechaza.`,
    400,
  );
};
