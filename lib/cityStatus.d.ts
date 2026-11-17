import { Engine } from '@civ-clone/core-engine/Engine';
import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
/**
 * Recorded in the save for a city in civil disorder. It's owed an "order
 * restored" notice, and while it's recorded a second turn of disorder brings a
 * Democracy down.
 */
export declare const CIVIL_DISORDER = 'civ1-city-happiness:civil-disorder';
/** Recorded in the save for a city celebrating ("We Love the King Day"). */
export declare const LEADER_CELEBRATION =
  'civ1-city-happiness:leader-celebration';
export declare const civilDisorder: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => PendingEffect | null;
export declare const leaderCelebration: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => PendingEffect | null;
/**
 * Puts a city in civil disorder as it's captured: its disorder is recorded, carrying a note that it was captured
 * into it, which a `CivilDisorder` rule holds to until the city's next production is lost
 * (`settleCapturedDisorder`). Kept in the record, so it's saved with it, and dropped with it if the city is captured
 * again or destroyed first.
 */
export declare const imposeCapturedDisorder: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => void;
/** Whether the city's disorder was put on it by its capture, and hasn't yet cost it a turn's production. */
export declare const capturedDisorder: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => boolean;
/**
 * Takes the capture's note off the city's disorder, leaving the record: from then on the city's citizens decide
 * whether it stays in disorder, and if it doesn't the record ends with "order restored".
 */
export declare const settleCapturedDisorder: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => void;
/** Registered with the rules, at import, so a status loaded from a save can still end. */
export declare const registerHandlers: (
  pendingEffects?: PendingEffectRegistry,
  engine?: Engine
) => void;
