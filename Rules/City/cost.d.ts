import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Advance from '@civ-clone/core-science/Advance';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Cost from '@civ-clone/core-city/Rules/Cost';
export declare const contentImprovements: [
  typeof CityImprovement,
  number,
  ...(typeof Advance)[]
][];
export declare const getRules: (
  ruleRegistry?: RuleRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityImprovementRegistry?: CityImprovementRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  playerResearchRegistry?: PlayerResearchRegistry,
  unitRegistry?: UnitRegistry
) => Cost[];
export default getRules;
