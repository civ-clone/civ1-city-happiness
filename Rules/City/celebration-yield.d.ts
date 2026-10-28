import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import CityYield from '@civ-clone/core-city/Rules/Yield';
export declare const getRules: (
  pendingEffects?: PendingEffectRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  tileImprovementRegistry?: TileImprovementRegistry
) => CityYield[];
export default getRules;
