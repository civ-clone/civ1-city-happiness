import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
export declare const getRules: (
  pendingEffects?: PendingEffectRegistry
) => Destroyed[];
export default getRules;
