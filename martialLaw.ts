// Civ1's martial law, as v474.05 has it (OpenCivOne's decompile, `src/Game/CodeObjects/CityWorker.cs`, the city
//  happiness routine, L1527–1575): under these governments, each unit in a city whose type has an attack strength makes
//  one of the city's unhappy citizens content, up to `martialLawUnitLimit` units, after its Temple, Colosseum,
//  Cathedral and Wonders have calmed what they can. `Rules/City/cost.ts` applies it; exported so that other packages
//  (the computer players' production, for one) don't repeat it.
import {
  Anarchy,
  Communism,
  Despotism,
  Monarchy,
} from '@civ-clone/civ1-government/Governments';
import Government from '@civ-clone/core-government/Government';
import Unit from '@civ-clone/core-unit/Unit';

export const martialLawGovernments: (typeof Government)[] = [
  Anarchy,
  Communism,
  Despotism,
  Monarchy,
];

export const martialLawUnitLimit = 3;

// A unit that martial law can use: any whose attack isn't 0, so not Settlers, Diplomats, Caravans or Transports, but
//  a ship or an aircraft in the city counts.
export const keepsMartialLaw = (unit: Unit): boolean =>
  unit.attack().value() > 0;
