# «Kit de marca» en las páginas de marca de maquinaria nueva

Diseño del cliente («Kit de marca») para `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/<marca>/`.
Se elige por marca con «Diseño de la página» → «Kit de marca» en el panel; hasta entonces, ninguna
marca cambia.

## Fase 1: Case (PR #353)

Cabecera partida con foto de fondo, placa con el logo, píldora de navegación que sale cuando la
cabecera deja la pantalla, cinta continua de equipos y una sección por tipo con su render recortado
y, si el cliente da permiso, el emblema (águila Old Abe) de fondo. Imágenes por marca y por tipo
desde el panel; el emblema tiene su propia casilla, apagada por defecto en producción.
Siembra: `scripts/marca-kit/marca-kit.ts` (`runbook-marca-kit-case.md`).

## Fase 2: Dynapac, Hitachi y Yanmar

Mismos componentes con **sus datos**. Desde el 2026-10-26 el cliente entregó los kits de las tres
marcas (foto de fondo, emblema, logo y renders) y dio permiso para los tres emblemas, que van
ACTIVADOS. El mismo script de Case los siembra: `marca-kit.ts <modo> <destino> <marca>` con
`hitachi`, `yanmar` o `dynapac` (`runbook-marca-kit-fase2.md`). Respaldos del diseño donde no hay
render (la miniexcavadora de Hitachi, y los tipos sin kit): la «Imagen de la tarjeta» del tipo y, si
tampoco, la primera foto de sus equipos. El color de la marca sale del campo «Color de la marca»
(`--acento`) y el texto se pone en negro o blanco según el contraste (`--tinta`).

### Tipos «paraguas» de Dynapac

«Pavimentadoras» y «Compactadores» agrupan otros tipos (`subtipos`) y no tienen equipos propios.
Como solo se pinta una sección por tipo **con equipos directos**, no generan sección, ni entrada en
la cinta ni en la píldora: sus equipos salen en las secciones de sus subtipos (Pavimentadora, Reglas;
Compactador de suelo, de llantas y de doble rodillo). Sus páginas de tipo siguen listándolos por
grupos como hasta ahora.

### Qué trae cada kit

| Marca   | Renders                                                 | Foto de fondo | Emblema     |
| ------- | ------------------------------------------------------- | ------------- | ----------- |
| Dynapac | 5 (doble rodillo, llantas, suelo, pavimentadora, regla) | 834 × 862     | rinoceronte |
| Hitachi | 1 (excavadora; la miniexcavadora usa el respaldo)       | sí            | Ojo Hitachi |
| Yanmar  | 1 (miniexcavadora)                                      | sí            | libélula    |

Los renders se emparejan con su tipo por dirección (los 7 casaron en el preview). Los logos del
kit son transparentes; no se usan: el sitio conserva los suyos.
