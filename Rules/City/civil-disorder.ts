import { Happiness, Unhappiness } from '../../Yields';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Criterion from '@civ-clone/core-rule/Criterion';
import Yield from '@civ-clone/core-yield/Yield';
import { reduceYields } from '@civ-clone/core-yield/lib/reduceYields';

export const getRules: () => CivilDisorder[] = (): CivilDisorder[] => [
  new CivilDisorder(
    new Criterion((city: City, yields: Yield[] = city.yields()): boolean => {
      const [happiness, unhappiness] = reduceYields(
        yields,
        Happiness,
        Unhappiness
      );

      return unhappiness > happiness;
    })
  ),
];

export default getRules;
