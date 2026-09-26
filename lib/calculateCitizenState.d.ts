import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Yield from '@civ-clone/core-yield/Yield';
declare enum CitizenState {
  Unhappy = 0,
  Content = 1,
  Happy = 2,
}
/**
 * The mood of each of a city's working citizens. Its specialists are neither: they are drawn from the content citizens
 * first and then from the happy ones (p249, Wilson, J.L & Emrich A. (1992). Sid Meier's Civilization, or Rome on 640K a
 * Day. Rocklin, CA: Prima Publishing), so the list is shorter than the city's size by one per specialist.
 */
export declare const calculateCitizenState: (
  cityGrowth: CityGrowth,
  yields?: Yield[],
  specialistRegistry?: SpecialistRegistry
) => CitizenState[];
export declare const citizenSummary: (
  state: CitizenState[]
) => [number, number, number];
export default calculateCitizenState;
