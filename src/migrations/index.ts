import * as migration_20260728_072955_inicial from './20260728_072955_inicial';
import * as migration_20260729_042128_paginas_institucionales from './20260729_042128_paginas_institucionales';
import * as migration_20260809_075627_maquinaria from './20260809_075627_maquinaria';
import * as migration_20260809_225008_solicitudes from './20260809_225008_solicitudes';
import * as migration_20260812_225927_lubricantes from './20260812_225927_lubricantes';
import * as migration_20260813_030629_blog from './20260813_030629_blog';
import * as migration_20260813_205131_estado_destino_redirects from './20260813_205131_estado_destino_redirects';

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
    name: '20260809_225008_solicitudes',
  },
  {
    up: migration_20260812_225927_lubricantes.up,
    down: migration_20260812_225927_lubricantes.down,
    name: '20260812_225927_lubricantes',
  },
  {
    up: migration_20260813_030629_blog.up,
    down: migration_20260813_030629_blog.down,
    name: '20260813_030629_blog',
  },
  {
    up: migration_20260813_205131_estado_destino_redirects.up,
    down: migration_20260813_205131_estado_destino_redirects.down,
    name: '20260813_205131_estado_destino_redirects'
  },
];
