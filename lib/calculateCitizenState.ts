/**
 * The mood of each of a city's working citizens, as v474.05 works it out (OpenCivOne's decompile,
 * `src/Game/CodeObjects/CityWorker.cs`, the city happiness routine and `F0_1d12_6dfe_AdjustHappyUnhappyCitizens`), now
 * `base-city-happiness`'s calculator. Specialists are neither happy nor unhappy, and are taken out before any
 * `Happiness` is applied: from the content citizens first, then from the unhappy ones.
 *
 * Rome on 640K a Day (p249) has specialists drawn from the content citizens and then the happy ones, which is what
 * this did until civ-clone/web-renderer#224: Entertainers' luxuries then made the happy citizens that the
 * Entertainers themselves were taken from, so a city that ran out of content citizens could never be calmed by them.
 *
 * Re-exported here for the packages that import it from this path.
 */
export type { CitizenMood } from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
export {
  CitizenState,
  calculateCitizenState,
  citizenMood,
  citizenSummary,
} from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
export { default } from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
