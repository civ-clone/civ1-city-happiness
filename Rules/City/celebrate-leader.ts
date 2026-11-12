import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  calculateCitizenState,
  citizenSummary,
} from '../../lib/calculateCitizenState';
import { Anarchy } from '@civ-clone/civ1-government/Governments';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => CelebrateLeader[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
): CelebrateLeader[] => [
  new CelebrateLeader(
    new Criterion(
      (city: City): boolean => cityGrowthRegistry.getByCity(city).size() > 2
    ),
    // No celebration under Anarchy. v474.05 (`CITYMGT.C` `city_process`): `if (town_unhappy_counts == 0 &&
    //  townbuf[city].size > 2 && (townbuf[city].size + 1) / 2 <= town_happy_ones_num && civ_gov[selected_owner] != 0)`,
    //  where `civ_gov` 0 is Anarchy (`GAME.C` `government_names`) (civ-clone/web-renderer#1010).
    new Criterion(
      (city: City): boolean =>
        !playerGovernmentRegistry.getByPlayer(city.player()).is(Anarchy)
    ),
    new Effect((city: City, yields: Yield[] = city.yields()): boolean => {
      const cityGrowth = cityGrowthRegistry.getByCity(city),
        citizenState = calculateCitizenState(
          cityGrowth,
          yields,
          specialistRegistry
        ),
        [unhappiness, , happiness] = citizenSummary(citizenState);

      return (
        unhappiness === 0 && Math.floor(happiness) >= cityGrowth.size() / 2
      );
    })
  ),
];

export default getRules;
