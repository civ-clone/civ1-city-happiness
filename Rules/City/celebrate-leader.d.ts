import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => CelebrateLeader[];
export default getRules;
