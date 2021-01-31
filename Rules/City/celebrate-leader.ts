import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Happiness, Unhappiness } from '../../Yields';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Yield from '@civ-clone/core-yield/Yield';

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
      return (
        !unhappiness &&
        Math.floor(happiness) >= cityGrowthRegistry.getByCity(city).size() / 2
      );
    })
  ),
];

export default getRules;
