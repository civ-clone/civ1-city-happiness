import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import CityYield from '@civ-clone/core-city/Rules/Yield';
export declare const getRules: (
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry
) => CityYield[];
export default getRules;
