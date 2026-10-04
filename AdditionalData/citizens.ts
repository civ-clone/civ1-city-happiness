import {
  CitizenMood,
  calculateCitizenState,
  citizenMood,
} from '../lib/calculateCitizenState';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Happiness, Unhappiness } from '../Yields';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import AdditionalData from '@civ-clone/core-data-object/AdditionalData';
import City from '@civ-clone/core-city/City';
import Yield from '@civ-clone/core-yield/Yield';

export type Citizens = {
  moods: CitizenMood[];
  causes: { yield: Yield; moods: CitizenMood[] }[];
};

/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule
 * (civ-clone/web-renderer#277). `causes` has one entry per `Happiness` or `Unhappiness` yield, in order, with the moods
 * once that yield and the ones before it are applied, for a report that shows what each one changes.
 */
export const getAdditionalData = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance
): AdditionalData[] => [
  new AdditionalData(City, 'citizens', (city: City): Citizens => {
    const cityGrowth = cityGrowthRegistry.getByCity(city),
      yields = city.yields(),
      causes = yields.filter(
        (cityYield) =>
          (cityYield instanceof Happiness ||
            cityYield instanceof Unhappiness) &&
          cityYield.value() !== 0
      ),
      moods = (yields: Yield[]): CitizenMood[] =>
        calculateCitizenState(cityGrowth, yields, specialistRegistry).map(
          citizenMood
        );

    return {
      moods: moods(yields),
      causes: causes.map((cityYield, index) => ({
        yield: cityYield,
        moods: moods(causes.slice(0, index + 1)),
      })),
    };
  }),
];

export default getAdditionalData;
