import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Yield from '@civ-clone/core-yield/Yield';
declare enum CitizenState {
  Unhappy = 0,
  Content = 1,
  Happy = 2,
}
/**
 * The mood of each of a city's working citizens, as v474.05 works it out (OpenCivOne's decompile,
 * `src/Game/CodeObjects/CityWorker.cs`, the city happiness routine and `F0_1d12_6dfe_AdjustHappyUnhappyCitizens`).
 * Specialists are neither happy nor unhappy, and are taken out before any `Happiness` is applied: from the content
 * citizens first, then from the unhappy ones. So the list is shorter than the city's size by one per specialist.
 *
 * Each point of `Happiness` then makes a content citizen happy or, when none is left, an unhappy one content.
 *
 * Rome on 640K a Day (p249) has specialists drawn from the content citizens and then the happy ones, which is what
 * this did until civ-clone/web-renderer#224: Entertainers' luxuries then made the happy citizens that the
 * Entertainers themselves were taken from, so a city that ran out of content citizens could never be calmed by them.
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
