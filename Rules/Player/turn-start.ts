import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import City from '@civ-clone/core-city/City';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import { Low } from '@civ-clone/core-rule/Priorities';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';

// These could be `Registry`s but this is enough for now.
export const hasCivilDisorder: Set<City> = new Set(),
  hasLeaderCelebration: Set<City> = new Set();

export const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  cityGrowthRegistry?: CityGrowthRegistry
) => TurnStart[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  engine = engineInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): TurnStart[] => [
  new TurnStart(
    new Low(),
    new Effect((player: Player): void =>
      cityRegistry.getByPlayer(player).forEach((city: City) => {
        const isCivilDisorder = ruleRegistry
            .process(CivilDisorder, city, city.yields())
            .some((result: boolean): boolean => result),
          isLeaderCelebration = ruleRegistry
            .process(CelebrateLeader, city, city.yields())
            .some((result: boolean): boolean => result);

        if (isCivilDisorder) {
          engine.emit('city:civil-disorder', city);
        }

        if (isCivilDisorder && !hasCivilDisorder.has(city)) {
          hasCivilDisorder.add(city);
        }

        if (!isCivilDisorder && hasCivilDisorder.has(city)) {
          engine.emit('city:order-restored', city);

          hasCivilDisorder.delete(city);
        }

        if (isLeaderCelebration && !hasLeaderCelebration.has(city)) {
          engine.emit('city:leader-celebration', city);

          hasLeaderCelebration.add(city);
        }

        if (!isLeaderCelebration && hasLeaderCelebration.has(city)) {
          engine.emit('city:leader-celebration-ended', city);

          hasLeaderCelebration.delete(city);
        }
      })
    )
  ),
  new TurnStart(
    new Low(),
    new Effect((player: Player): void =>
      cityRegistry.getByPlayer(player).forEach((city: City) => {
        if (!hasLeaderCelebration.has(city)) {
          return;
        }

        const cityGrowth = cityGrowthRegistry.getByCity(city);

        cityGrowth.grow();
      })
    )
  ),
];

export default getRules;
