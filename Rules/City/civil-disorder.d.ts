import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry,
  pendingEffects?: PendingEffectRegistry
) => CivilDisorder[];
export default getRules;
