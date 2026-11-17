import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  calculateCitizenState,
  citizenSummary,
} from '../../lib/calculateCitizenState';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Yield from '@civ-clone/core-yield/Yield';
import { capturedDisorder } from '../../lib/cityStatus';

export const getRules = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): CivilDisorder[] => [
  new CivilDisorder(
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const cityGrowth = cityGrowthRegistry.getByCity(city),
        citizenState = calculateCitizenState(
          cityGrowth,
          yields,
          specialistRegistry
        ),
        [unhappiness, , happiness] = citizenSummary(citizenState);

      return unhappiness > happiness;
    })
  ),
  // A city the human captured below a Republic is in disorder whatever its citizens think, until its next production
  //  is lost to it (`captured`, `process-yield`; civ-clone/web-renderer#1014).
  new CivilDisorder(
    'civ1-city-happiness:city/civil-disorder/captured',
    new Effect((city: City): boolean => capturedDisorder(city, pendingEffects))
  ),
];

export default getRules;
