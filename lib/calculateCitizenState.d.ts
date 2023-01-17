import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Yield from '@civ-clone/core-yield/Yield';
declare enum CitizenState {
  Unhappy = 0,
  Content = 1,
  Happy = 2,
}
export declare const calculateCitizenState: (
  cityGrowth: CityGrowth,
  yields?: Yield[]
) => CitizenState[];
export declare const citizenSummary: (
  state: CitizenState[]
) => [number, number, number];
export default calculateCitizenState;
