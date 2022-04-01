import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Happiness, Unhappiness } from '../../Yields';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Yield from '@civ-clone/core-yield/Yield';
import { reduceYields } from '@civ-clone/core-yield/lib/reduceYields';

export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry
) => CelebrateLeader[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): CelebrateLeader[] => [
  new CelebrateLeader(
    new Criterion(
      (city: City): boolean => cityGrowthRegistry.getByCity(city).size() > 2
    ),
    new Criterion((city: City, yields: Yield[] = city.yields()): boolean => {
      const [happiness, unhappiness] = reduceYields(
        yields,
        Happiness,
        Unhappiness
      );

      return (
        unhappiness === 0 &&
        Math.floor(happiness) >= cityGrowthRegistry.getByCity(city).size() / 2
      );
    })
  ),
];

export default getRules;
