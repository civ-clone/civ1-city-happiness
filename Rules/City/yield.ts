import { Air, Fortifiable, Naval } from '@civ-clone/civ1-unit/Types';
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
              .filter(
                (unit) =>
                  [Air, Fortifiable, Naval].some(
                    (UnitType) => unit instanceof UnitType
                  ) && unit.tile() !== city.tile()
              ).length > 0
        ),
        new Effect((city: City): Yield[] =>
          unitRegistry
            .getByCity(city)
            .filter(
              (unit) =>
                [Air, Fortifiable, Naval].some(
                  (UnitType) => unit instanceof UnitType
                ) && unit.tile() !== city.tile()
            )
            .map((unit) => new MilitaryUnhappiness(discontent, unit) as Yield)
        )
      )
  ),
];

export default getRules;
