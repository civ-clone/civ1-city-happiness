import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Unit from '@civ-clone/core-unit/Unit';
export declare const neverAggressive: (unit: Unit) => boolean;
export declare const aggressiveAnywhere: (unit: Unit) => boolean;
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry,
  cityRegistry?: CityRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry
) => CityYield[];
export default getRules;
