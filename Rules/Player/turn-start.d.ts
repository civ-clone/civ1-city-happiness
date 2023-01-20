import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import City from '@civ-clone/core-city/City';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
export declare const hasCivilDisorder: Set<City>,
  hasLeaderCelebration: Set<City>;
export declare const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  cityGrowthRegistry?: CityGrowthRegistry
) => TurnStart[];
export default getRules;
