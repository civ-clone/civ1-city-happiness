import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  calculateCitizenState,
  citizenSummary,
} from '../../lib/calculateCitizenState';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance
): CivilDisorder[] => [
  new CivilDisorder(
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const cityGrowth = cityGrowthRegistry.getByCity(city),
        citizenState = calculateCitizenState(
          cityGrowth,
          yields,
          specialistRegistry
        ),
        [unhappiness, , happiness] = citizenSummary(citizenState);

      return unhappiness > happiness;
    })
  ),
];

export default getRules;
