import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Happiness from '@civ-clone/base-city-yield-happiness/Happiness';
import Unhappiness from '@civ-clone/base-city-yield-unhappiness/Unhappiness';
import { reduceYields } from '@civ-clone/core-yield/lib/reduceYields';
import Yield from '@civ-clone/core-yield/Yield';

export enum CitizenState {
  Unhappy,
  Content,
  Happy,
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
export const calculateCitizenState = (
  cityGrowth: CityGrowth,
  yields: Yield[] = cityGrowth.city().yields(),
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance
): CitizenState[] => {
  const city = cityGrowth.city(),
    state: CitizenState[] = new Array(cityGrowth.size()).fill(
      CitizenState.Content
    );

  let [happiness, unhappiness] = reduceYields(yields, Happiness, Unhappiness),
    specialists = specialistRegistry.getByCity(city).length,
    currentIndex = state.length - 1;

  // Set the citizens at the end of the list to unhappy for each Unhappiness...
  while (unhappiness > 0 && currentIndex > -1) {
    state[currentIndex--] = CitizenState.Unhappy;
    unhappiness--;
  }

  // ...take the specialists out, the content citizens first...
  [CitizenState.Content, CitizenState.Unhappy].forEach((citizenState) => {
    while (specialists > 0 && state.includes(citizenState)) {
      state.splice(state.lastIndexOf(citizenState), 1);
      specialists--;
    }
  });

  // ...then for each Happiness start at the beginning, making a content citizen happy, or an unhappy one content.
  currentIndex = 0;

  while (happiness > 0 && currentIndex < state.length) {
    if (state[currentIndex] === CitizenState.Happy) {
      currentIndex++;

      continue;
    }

    state[currentIndex] =
      state[currentIndex] === CitizenState.Unhappy
        ? CitizenState.Content
        : CitizenState.Happy;
    happiness--;
  }

  return state;
};

export type CitizenMood = 'unhappy' | 'content' | 'happy';

/** The name a renderer is sent for a `CitizenState`. */
export const citizenMood = (citizenState: CitizenState): CitizenMood =>
  (['unhappy', 'content', 'happy'] as CitizenMood[])[citizenState];

export const citizenSummary = (
  state: CitizenState[]
): [number, number, number] =>
  state.reduce(
    ([unhappy, content, happy], citizenState) => [
      unhappy + (citizenState === CitizenState.Unhappy ? 1 : 0),
      content + (citizenState === CitizenState.Content ? 1 : 0),
      happy + (citizenState === CitizenState.Happy ? 1 : 0),
    ],
    [0, 0, 0]
  );

export default calculateCitizenState;
