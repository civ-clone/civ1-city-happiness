import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  calculateCitizenState,
  citizenSummary,
} from '../../lib/calculateCitizenState';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
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
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const cityGrowth = cityGrowthRegistry.getByCity(city),
        citizenState = calculateCitizenState(cityGrowth, yields),
        [unhappiness, , happiness] = citizenSummary(citizenState);

      return (
        unhappiness === 0 && Math.floor(happiness) >= cityGrowth.size() / 2
      );
    })
  ),
];

export default getRules;
