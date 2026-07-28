import * as migration_20260728_072955_inicial from './20260728_072955_inicial';

export const migrations = [
  {
    up: migration_20260728_072955_inicial.up,
    down: migration_20260728_072955_inicial.down,
    name: '20260728_072955_inicial'
  },
];
