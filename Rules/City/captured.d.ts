import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
export declare const getRules: (
  pendingEffects?: PendingEffectRegistry,
  clientRegistry?: ClientRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => Captured[];
export default getRules;
