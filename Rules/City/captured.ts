import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import { CIVIL_DISORDER, LEADER_CELEBRATION } from '../../lib/cityStatus';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';
import { High } from '@civ-clone/core-rule/Priorities';
import { forgetCityStatuses } from '@civ-clone/base-city-happiness-status/lib/cityStatus';

export const getRules = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): Captured[] => [
  // A captured city, taken by force or incited by a Diplomat, starts out for its captor neither in disorder nor
  //  celebrating, as v474.05 (`CAPTURE.C` `capunit`, which both captures go through): `townbuf[b].status &=
  //  CITY_CAPTURE_MASK;` and `townbuf[b].status &= CITY_TRANSFER_MASK;`, which clear `CITY_DISORDER` (0x01) and
  //  `CITY_CELEBRATING` (0x40) (`CIV.H`). Dropped rather than ended, so the captor isn't told order was restored or the
  //  celebration is over, and its first turn of either counts as a first. At `High`, ahead of the other packages'
  //  `Captured` rules that read the city's status (civ-clone/web-renderer#1010).
  new Captured(
    'civ1-city-happiness:city/captured/forget-status',
    new High(),
    new Effect((city: City): void =>
      forgetCityStatuses(
        city,
        [CIVIL_DISORDER, LEADER_CELEBRATION],
        pendingEffects
      )
    )
  ),
];

export default getRules;
