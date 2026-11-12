import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  cityStatus,
  registerCityStatusHandler,
} from '@civ-clone/base-city-happiness-status/lib/cityStatus';
import City from '@civ-clone/core-city/City';

/**
 * Recorded in the save for a city in civil disorder. It's owed an "order
 * restored" notice, and while it's recorded a second turn of disorder brings a
 * Democracy down.
 */
export const CIVIL_DISORDER = 'civ1-city-happiness:civil-disorder';

/** Recorded in the save for a city celebrating ("We Love the King Day"). */
export const LEADER_CELEBRATION = 'civ1-city-happiness:leader-celebration';

export const civilDisorder = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): PendingEffect | null => cityStatus(CIVIL_DISORDER, city, pendingEffects);

export const leaderCelebration = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): PendingEffect | null => cityStatus(LEADER_CELEBRATION, city, pendingEffects);

/** Registered with the rules, at import, so a status loaded from a save can still end. */
export const registerHandlers = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  engine: Engine = engineInstance
): void => {
  registerCityStatusHandler(
    CIVIL_DISORDER,
    'city:order-restored',
    pendingEffects,
    engine
  );

  registerCityStatusHandler(
    LEADER_CELEBRATION,
    'city:leader-celebration-ended',
    pendingEffects,
    engine
  );
};
