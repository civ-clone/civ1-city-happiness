import { Happiness, Unhappiness } from '../../Yields';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Criterion from '@civ-clone/core-rule/Criterion';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: () => CivilDisorder[] = (): CivilDisorder[] => [
  new CivilDisorder(
    new Criterion((city: City, yields: Yield[] = city.yields()): boolean => {
      const happiness = yields
          .filter(
            (citizenState: Yield): boolean => citizenState instanceof Happiness
          )
          .reduce(
            (total: number, happiness: Happiness): number =>
              total + happiness.value(),
            0
          ),
        unhappiness = yields
          .filter(
            (citizenState: Yield): boolean =>
              citizenState instanceof Unhappiness
          )
          .reduce(
            (total: number, unhappiness: Unhappiness): number =>
              total + unhappiness.value(),
            0
          );

      return unhappiness > happiness;
    })
  ),
];

export default getRules;
