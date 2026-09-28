import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';

/**
 * Recorded in the save for a city in civil disorder. It's owed an "order
 * restored" notice, and while it's recorded a second turn of disorder brings a
 * Democracy down.
 */
export const CIVIL_DISORDER = 'civ1-city-happiness:civil-disorder';

/** Recorded in the save for a city celebrating ("We Love the King Day"). */
export const LEADER_CELEBRATION = 'civ1-city-happiness:leader-celebration';

const find = (
  handler: string,
  city: City,
  pendingEffects: PendingEffectRegistry
): PendingEffect | null =>
  pendingEffects
    .getByTarget(city)
    .find(
      (pendingEffect: PendingEffect): boolean =>
        pendingEffect.handler() === handler
    ) ?? null;

export const civilDisorder = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): PendingEffect | null => find(CIVIL_DISORDER, city, pendingEffects);

export const leaderCelebration = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): PendingEffect | null => find(LEADER_CELEBRATION, city, pendingEffects);

/** Registered with the rules, at import, so a status loaded from a save can still end. */
export const registerHandlers = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  engine: Engine = engineInstance
): void => {
  pendingEffects.handler(CIVIL_DISORDER, (pendingEffect: PendingEffect) =>
    engine.emit('city:order-restored', pendingEffect.target())
  );

  pendingEffects.handler(LEADER_CELEBRATION, (pendingEffect: PendingEffect) =>
    engine.emit('city:leader-celebration-ended', pendingEffect.target())
  );
};
