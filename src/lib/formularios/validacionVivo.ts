/**
 * VALIDACIÓN EN VIVO de los formularios de solicitud (t8, fase 2, 2026-11-25): al salir de un campo
 * se avisa de lo evidente (vacío, correo mal escrito, mensaje corto) sin esperar al envío. Es
 * cortesía: el servidor valida de verdad (`solicitud.ts`, Zod) y con los MISMOS textos. No importa
 * Zod, que no debe viajar al navegador (`clienteSinZod.test.ts`).
 *
 * Devuelve el mensaje de error o `null` si el valor está bien (o si el campo no se revisa aquí).
 */
/** Los campos que se revisan al salir de ellos. */
export const CAMPOS_EN_VIVO = ["nombre", "correo", "mensaje"] as const;

export function errorEnVivo(campo: string, valor: string): string | null {
  const v = valor.trim();
  switch (campo) {
    case "nombre":
      if (v.length === 0) return "Escribe tu nombre.";
      return v.length < 2 ? "El nombre es demasiado corto." : null;
    case "correo":
      if (v.length === 0) return "Escribe tu correo.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Ese correo no parece válido.";
    case "mensaje":
      if (v.length === 0) return "Escribe tu mensaje.";
      return v.length < 10 ? "Cuéntanos un poco más: al menos 10 caracteres." : null;
    default:
      return null;
  }
}
