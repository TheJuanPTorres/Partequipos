import * as migration_20260728_072955_inicial from './20260728_072955_inicial';
import * as migration_20260729_042128_paginas_institucionales from './20260729_042128_paginas_institucionales';
import * as migration_20260809_075627_maquinaria from './20260809_075627_maquinaria';
import * as migration_20260809_225008_solicitudes from './20260809_225008_solicitudes';

export const migrations = [
  {
    up: migration_20260728_072955_inicial.up,
    down: migration_20260728_072955_inicial.down,
    name: '20260728_072955_inicial',
  },
  {
    up: migration_20260729_042128_paginas_institucionales.up,
    down: migration_20260729_042128_paginas_institucionales.down,
    name: '20260729_042128_paginas_institucionales',
  },
  {
    up: migration_20260809_075627_maquinaria.up,
    down: migration_20260809_075627_maquinaria.down,
    name: '20260809_075627_maquinaria',
  },
  {
    up: migration_20260809_225008_solicitudes.up,
    down: migration_20260809_225008_solicitudes.down,
    name: '20260809_225008_solicitudes'
  },
];
