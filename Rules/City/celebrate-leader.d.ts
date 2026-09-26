import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry
) => CelebrateLeader[];
export default getRules;
