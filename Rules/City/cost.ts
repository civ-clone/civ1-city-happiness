import {
  Anarchy,
  Despotism,
  Monarchy,
} from '@civ-clone/base-government-civ1/Governments';
import { Happiness, Unhappiness } from '../../Yields';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortifiable } from '@civ-clone/base-unit-civ1/Types';
import Luxuries from '@civ-clone/base-city-yield-luxuries/Luxuries';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: (
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry
) => Cost[] = (
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance
): Cost[] => [
  new Cost(
    new Criterion((cityYield: Yield): boolean => cityYield instanceof Luxuries),
    new Effect((cityYield: Yield, city: City, yields: Yield[]): void => {
      const [happiness] = yields.filter(
        (cityYield: Yield): boolean => cityYield instanceof Happiness
      );

      happiness.add(Math.floor(cityYield.value() / 2), 'luxuries');
    })
  ),
  new Cost(
    new Criterion(
      (cityYield: Yield): boolean => cityYield instanceof Unhappiness
    ),
    new Criterion((cityYield: Yield, city: City): boolean =>
      playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Anarchy, Despotism, Monarchy)
    ),
    new Effect((cityYield: Yield, city: City): void =>
      cityYield.subtract(
        Math.min(
          4,
          Math.min(
            cityYield.value(),
            unitRegistry
              .getByTile(city.tile())
              .filter((unit: Unit): boolean => unit instanceof Fortifiable)
              .length
          )
        ),
        'martial-law'
      )
    )
  ),
];

export default getRules;
