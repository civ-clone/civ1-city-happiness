import { Air, Fortifiable, Naval } from '@civ-clone/civ1-unit/Types';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Democracy, Republic } from '@civ-clone/civ1-government/Governments';
import { Happiness, Unhappiness } from '../../Yields';
import {High, Low} from '@civ-clone/core-rule/Priorities';
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
import Luxuries from '@civ-clone/base-city-yield-luxuries/Luxuries';
import Yield from '@civ-clone/core-yield/Yield';
import Government from "@civ-clone/core-government/Government";

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
    new High(),
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Unhappiness
    ),
    // TODO: factor in difficulty levels
    new Effect((cityYield: Yield, city: City): void =>
      cityYield.add(
        Math.max(cityGrowthRegistry.getByCity(city).size() - 5, 0),
        'Population'
      )
    )
  ),

  new CityYield(
    new Criterion((cityYield: Yield): boolean => cityYield instanceof Luxuries),
    new Effect((cityYield: Yield, city: City, yields: Yield[]): void => {
      const [happiness] = yields.filter(
        (cityYield: Yield): boolean => cityYield instanceof Happiness
      );

      happiness.add(Math.floor(cityYield.value() / 2), Luxuries.name);
    })
  ),

  ...([
    [Republic, 1],
    [Democracy, 2],
  ] as [typeof Government, number][])
    .map(([GovernmentType, discontent]) =>
      new CityYield(
        new Criterion(
          (cityYield: Yield): boolean => cityYield instanceof Unhappiness
        ),
        new Criterion((cityYield: Yield, city: City): boolean =>
          playerGovernmentRegistry.getByPlayer(city.player()).is(GovernmentType)
        ),
        new Criterion(
          (cityYield: Yield, city: City): boolean =>
            unitRegistry
              .getByCity(city)
              .filter(
                (unit) =>
                  [Air, Fortifiable, Naval].some(
                    (UnitType) => unit instanceof UnitType
                  ) && unit.tile() !== city.tile()
              ).length > 0
        ),
        new Effect((cityYield: Yield, city: City): void =>
          cityYield.add(
            unitRegistry
              .getByCity(city)
              .filter(
                (unit) =>
                  [Air, Fortifiable, Naval].some(
                    (UnitType) => unit instanceof UnitType
                  ) && unit.tile() !== city.tile()
              ).length * discontent,
            'MilitaryDiscontent'
          )
        )
      ),
    ),

  new CityYield(
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Unhappiness
    ),
    new Criterion((cityYield: Yield, city: City): boolean =>
      playerGovernmentRegistry.getByPlayer(city.player()).is(Democracy)
    ),
    new Criterion(
      (cityYield: Yield, city: City): boolean =>
        unitRegistry
          .getByCity(city)
          .filter(
            (unit) =>
              [Air, Fortifiable, Naval].some(
                (UnitType) => unit instanceof UnitType
              ) && unit.tile() !== city.tile()
          ).length > 0
    ),
    new Effect((cityYield: Yield, city: City): void =>
      cityYield.add(
        unitRegistry
          .getByCity(city)
          .filter(
            (unit) =>
              [Air, Fortifiable, Naval].some(
                (UnitType) => unit instanceof UnitType
              ) && unit.tile() !== city.tile()
          ).length * 2,
        'MilitaryDiscontent'
      )
    )
  ),
];

export default getRules;
