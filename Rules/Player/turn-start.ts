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
import CelebrateLeader, {
  ICelebrateLeaderRegistry,
} from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import CivilDisorder, {
  ICivilDisorderRegistry,
} from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';

export const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine
) => TurnStart[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  engine = engineInstance
): TurnStart[] => [
  new TurnStart(
    new Effect((player: Player): void =>
      cityRegistry.getByPlayer(player).forEach((city: City) => {
        if (
          (ruleRegistry as ICivilDisorderRegistry)
            .get(CivilDisorder)
            .some((rule: CivilDisorder): boolean =>
              rule.validate(city, city.yields())
            )
        ) {
          engine.emit('city:civil-disorder', city);
        }

        if (
          (ruleRegistry as ICelebrateLeaderRegistry)
            .get(CelebrateLeader)
            .some((rule: CelebrateLeader): boolean =>
              rule.validate(city, city.yields())
            )
        ) {
          engine.emit('city:leader-celebration', city);
        }
      })
    )
  ),
];

export default getRules;
