import { CitizenMood } from '../lib/calculateCitizenState';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import AdditionalData from '@civ-clone/core-data-object/AdditionalData';
import Yield from '@civ-clone/core-yield/Yield';
export type Citizens = {
  moods: CitizenMood[];
  causes: {
    yield: Yield;
    moods: CitizenMood[];
  }[];
};
/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule
 * (civ-clone/web-renderer#277). `causes` has one entry per `Happiness` or `Unhappiness` yield, in order, with the moods
 * once that yield and the ones before it are applied, for a report that shows what each one changes.
 */
export declare const getAdditionalData: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry
) => AdditionalData[];
export default getAdditionalData;
