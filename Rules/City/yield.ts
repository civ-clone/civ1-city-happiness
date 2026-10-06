import { Air, Diplomatic } from '@civ-clone/civ1-unit/Types';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Democracy, Republic } from '@civ-clone/civ1-government/Governments';
import { MilitaryUnhappiness, PopulationUnhappiness } from '../../Yields';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import Yield from '@civ-clone/core-yield/Yield';
import Unit from '@civ-clone/core-unit/Unit';

// v474.05 (OpenCivOne `CityWorker.cs` L422-L460): a unit with an attack makes its home city unhappy when it's away, or
//  wherever it is if it's an aircraft. Unarmed units (a Transport, Settlers) never do, and Diplomats and Caravans are
//  skipped before the check.
const causesUnhappiness = (unit: Unit, city: City): boolean =>
  !(unit instanceof Diplomatic) &&
  unit.attack().value() > 0 &&
  (unit instanceof Air || unit.tile() !== city.tile());

export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry
) => CityYield[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance
): CityYield[] => [
  new CityYield(
    // TODO: factor in difficulty levels
    new Criterion(
      (city: City) => cityGrowthRegistry.getByCity(city).size() - 5 > 0
    ),
    new Effect(
      (city: City): Yield =>
        new PopulationUnhappiness(
          Math.max(cityGrowthRegistry.getByCity(city).size() - 5, 0)
        )
    )
  ),

  ...(
    [
      [Republic, 1],
      [Democracy, 2],
    ] as [typeof Government, number][]
  ).map(
    ([GovernmentType, discontent]) =>
      new CityYield(
        new Criterion((city: City): boolean => {
          try {
            return playerGovernmentRegistry
              .getByPlayer(city.player())
              .is(GovernmentType);
          } catch (e) {
            return false;
          }
        }),
        new Criterion(
          (city: City): boolean =>
            unitRegistry
              .getByCity(city)
              .filter((unit) => causesUnhappiness(unit, city)).length > 0
        ),
        new Effect((city: City): Yield[] =>
          unitRegistry
            .getByCity(city)
            .filter((unit) => causesUnhappiness(unit, city))
            .map((unit) => new MilitaryUnhappiness(discontent, unit) as Yield)
        )
      )
  ),
];

export default getRules;
