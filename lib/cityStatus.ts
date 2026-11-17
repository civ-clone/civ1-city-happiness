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

// Set in a city's `CIVIL_DISORDER` record while the disorder was put on it by its capture and its production hasn't
//  been lost to it yet (civ-clone/web-renderer#1014).
const CAPTURED = 'captured';

/**
 * Puts a city in civil disorder as it's captured: its disorder is recorded, carrying a note that it was captured
 * into it, which a `CivilDisorder` rule holds to until the city's next production is lost
 * (`settleCapturedDisorder`). Kept in the record, so it's saved with it, and dropped with it if the city is captured
 * again or destroyed first.
 */
export const imposeCapturedDisorder = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  const recorded = civilDisorder(city, pendingEffects);

  if (recorded !== null) {
    recorded.setData({ ...recorded.data(), [CAPTURED]: 'true' });

    return;
  }

  pendingEffects.register(
    new PendingEffect(CIVIL_DISORDER, city, { [CAPTURED]: 'true' })
  );
};

/** Whether the city's disorder was put on it by its capture, and hasn't yet cost it a turn's production. */
export const capturedDisorder = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): boolean => CAPTURED in (civilDisorder(city, pendingEffects)?.data() ?? {});

/**
 * Takes the capture's note off the city's disorder, leaving the record: from then on the city's citizens decide
 * whether it stays in disorder, and if it doesn't the record ends with "order restored".
 */
export const settleCapturedDisorder = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  const recorded = civilDisorder(city, pendingEffects),
    // A copy, so it can be changed.
    data = recorded?.data() ?? {};

  if (recorded === null || !(CAPTURED in data)) {
    return;
  }

  delete data[CAPTURED];

  recorded.setData(data);
};

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
