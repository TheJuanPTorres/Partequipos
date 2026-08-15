/**
 * Política de contraseñas del panel.
 *
 * Payload **no trae** longitud mínima configurable: revisado el tipo
 * `IncomingAuthType` de la versión instalada (3.86), que expone
 * `tokenExpiration`, `maxLoginAttempts`, `lockTime`, `forgotPassword`… pero nada
 * sobre la fuerza de la contraseña. Así que se valida aquí.
 *
 * Función PURA para poder probar cada regla sin levantar Payload.
 *
 * CRITERIO. Se sigue la línea del NIST SP 800-63B: **la longitud es lo que
 * importa**, y las reglas de composición (una mayúscula, un símbolo…) empujan a
 * la gente hacia contraseñas predecibles del tipo `Partequipos2026!`. Por eso:
 *
 *   - mínimo 12 caracteres (el NIST recomienda 8; se sube porque esto da acceso
 *     al CMS entero y a los datos personales de `solicitudes`);
 *   - se rechazan las contraseñas obvias y las que contienen el nombre del
 *     proyecto o el propio correo;
 *   - NO se exige mezcla de mayúsculas, dígitos y símbolos.
 */

export const LONGITUD_MINIMA = 12;
/** Tope alto, solo para evitar cargas absurdas al hashear. */
export const LONGITUD_MAXIMA = 200;

/**
 * Contraseñas que no se aceptan nunca, en minúsculas y sin tildes.
 * No pretende ser un diccionario: cubre lo que alguien pondría con prisa.
 */
const PROHIBIDAS = [
  "contrasena",
  "contraseña",
  "password",
  "123456789012",
  "qwertyuiopas",
  "administrador",
  "partequipos",
];

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Valida una contraseña. Devuelve el mensaje de error o `null` si es válida.
 *
 * @param correo  si se pasa, se rechaza que la contraseña lo contenga
 */
export function validarPassword(password: unknown, correo?: string | null): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "La contraseña es obligatoria.";
  }

  if (password.length < LONGITUD_MINIMA) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres (tiene ${password.length}).`;
  }

  if (password.length > LONGITUD_MAXIMA) {
    return `La contraseña no puede pasar de ${LONGITUD_MAXIMA} caracteres.`;
  }

  // Solo espacios, o un único carácter repetido: cumple la longitud y no vale nada.
  if (password.trim().length < LONGITUD_MINIMA) {
    return "La contraseña no puede ser casi toda espacios.";
  }
  if (new Set(password).size < 5) {
    return "La contraseña repite demasiado los mismos caracteres.";
  }

  const plana = normalizar(password);

  for (const mala of PROHIBIDAS) {
    if (plana.includes(mala)) {
      return `La contraseña no puede contener «${mala}»: es de las primeras que se prueban.`;
    }
  }

  if (correo) {
    const usuario = normalizar(correo).split("@")[0] ?? "";
    if (usuario.length >= 3 && plana.includes(usuario)) {
      return "La contraseña no puede contener tu dirección de correo.";
    }
  }

  return null;
}
