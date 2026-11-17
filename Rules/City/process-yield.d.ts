import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
export declare const getRules: (
  pendingEffects?: PendingEffectRegistry
) => ProcessYield[];
export default getRules;
