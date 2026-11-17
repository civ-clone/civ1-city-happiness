import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
export declare const getRules: (
  pendingEffects?: PendingEffectRegistry,
  turn?: Turn
) => ProcessYield[];
export default getRules;
