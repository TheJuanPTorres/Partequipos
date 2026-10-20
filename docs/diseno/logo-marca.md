# Un solo logo por marca: `LogoMarca` (2026-10-20, dirección)

**La referencia** es el logo que pinta el megamenú para las marcas de **repuestos**:

- el fichero es el «Logo» de la marca, subido en el panel;
- sale con sus colores o, con «Pintar el logo en oscuro en el menú» marcada (los logos blancos del cliente), en una sola tinta oscura (`brightness(0)` al 85 %).

Ese mismo logo, con esa misma regla, sale **en todos los sitios donde aparece una marca**, y siempre sobre fondo claro.

## Cómo funciona

| Pieza                                | Qué hace                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/marca/logoMarca.ts`         | Lógica pura, con pruebas. `logoPropio`: el logo del propio registro. `logoDeMarca`: el de la marca de **repuestos** con el mismo nombre (`claveDeMarca`: sin tildes, espacios ni guiones; «Link Belt» = «Link-Belt»; si no, por el comienzo cuando solo encaja una: «CASE» = «Case Construction») o, si no hay ninguna, el suyo propio con su casilla |
| `src/lib/queries/getLogosMarca.ts`   | Los logos de las marcas de repuestos en la caché del marco (`datos:marco`). La invalidan los ganchos de `marcas`, igual que al megamenú                                                                                                                                                                                                               |
| `src/components/marca/LogoMarca.tsx` | El único componente que pinta un logo de marca: medidas reales (sin CLS), `fill` opcional y la tinta oscura por `data-oscuro`                                                                                                                                                                                                                         |

**Una marca de nueva o de usados que es la misma que una de repuestos lleva el logo de repuestos.** En los datos del preview:

| Marca                                        | Logo que lleva                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Hitachi, Case Construction y Yanmar de nueva | El de repuestos                                                                      |
| Dynapac de nueva                             | El suyo (no es marca de repuestos)                                                   |
| Ammann y Aditamentos                         | Ninguno                                                                              |
| Las 9 marcas de usados                       | No tenían logo. Las 8 que son de repuestos llevan ahora ese logo; NPK sigue sin logo |

## Inventario: dónde sale un logo de marca y de qué campo

| Dónde                                                             | Antes                                                      | Ahora                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Megamenú, repuestos                                               | `marcas.logo` + casilla                                    | Igual, por `LogoMarca`                                                                                                     |
| Megamenú, maquinaria nueva                                        | `marcas-maquinaria.logo` + casilla                         | El de repuestos si es la misma marca                                                                                       |
| Índice de marcas de repuestos (baldosas, #280)                    | `marcas.logo` en blanco o negro sobre el color de la marca | **Baldosa blanca** con `LogoMarca`                                                                                         |
| Índice de categorías y categoría técnica (placas)                 | `marcas.logo` blanco sobre placa oscura                    | **Placa blanca** con `LogoMarca`                                                                                           |
| Cabecera de marca, tipo y modelo de repuestos (cuadrado del #271) | `marcas.logo` en blanco o negro sobre el color de la marca | **Cuadrado blanco** con `LogoMarca` (la franja sigue con el color de la marca)                                             |
| Página de modelo, diseño propio (apagado)                         | Logo en blanco sobre el panel oscuro                       | Placa blanca con `LogoMarca`                                                                                               |
| Ficha de maquinaria nueva                                         | `marcas-maquinaria.logo`                                   | `logoDeMarca`                                                                                                              |
| Listado de nueva: tarjetas y filtro por marca                     | `marcas-maquinaria.logo`                                   | `logoDeMarca` (con su casilla, `logoOscuro`)                                                                               |
| Índice de marcas de nueva                                         | `marcas-maquinaria.logo`                                   | `logoDeMarca`                                                                                                              |
| Índice de usados, bloque «Marcas»                                 | `marcas-usada.logo` (vacío en todas: foto de la unidad)    | `logoDeMarca`: el de repuestos de su nombre; sin él, la foto como antes                                                    |
| Portada, sección 2 (tarjetas de marca de nueva)                   | `marcas-maquinaria.logo`                                   | `logoDeMarca`, sobre su baldosa blanca al 80 %                                                                             |
| Portada, sección 4 (carrusel de logos)                            | El logo de cada fila de la portada                         | El de repuestos si el nombre es de una marca de repuestos (Hitachi, CASE, Yanmar); si no, el de la fila (Dynapac, ENI, CF) |

**Fuera del alcance, a propósito:**

- el logo de la marca de lubricante (ENI): no es una marca de máquina;
- las imágenes al compartir (`og:image`): no se pintan;
- el logo de Partequipos.

**Retirado:** `logoBlancoSobre`. El logo ya no se pinta en blanco sobre el color de la marca.

**Regla:** un logo de marca nuevo en cualquier plantilla se pinta con `LogoMarca` y se resuelve con `logoDeMarca` (o `logoPropio` si la marca es de repuestos), nunca con `next/image` directo.
