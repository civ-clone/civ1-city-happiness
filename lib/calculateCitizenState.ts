import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Happiness from '@civ-clone/base-city-yield-happiness/Happiness';
import Unhappiness from '@civ-clone/base-city-yield-unhappiness/Unhappiness';
import { reduceYields } from '@civ-clone/core-yield/lib/reduceYields';
import Yield from '@civ-clone/core-yield/Yield';

enum CitizenState {
  Unhappy,
  Content,
  Happy,
}

export const calculateCitizenState = (
  cityGrowth: CityGrowth,
  yields: Yield[] = cityGrowth.city().yields()
): CitizenState[] => {
  const city = cityGrowth.city(),
    state: CitizenState[] = new Array(cityGrowth.size()).fill(
      CitizenState.Content
    );

  let [happiness, unhappiness] = reduceYields(yields, Happiness, Unhappiness),
    currentIndex = state.length - 1;

  // Set the citizens at the end of the list to unhappy for each Unhappiness...
  while (unhappiness > 0 && currentIndex > -1) {
    state[currentIndex--] = CitizenState.Unhappy;
    unhappiness--;
  }

  // ...then for each Happiness start at the beginning, setting each Content citizen
  currentIndex = 0;

  while (happiness > 0 && currentIndex < state.length) {
    if (state[currentIndex] === CitizenState.Unhappy) {
      state[currentIndex] = CitizenState.Content;
      happiness--;
    }

    if (state[currentIndex] === CitizenState.Content) {
      state[currentIndex++] = CitizenState.Happy;
      happiness--;
    }

    if (state[currentIndex] === CitizenState.Happy) {
      currentIndex++;
    }
  }

  return state;
};

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
