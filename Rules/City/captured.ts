import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  imposeCapturedDisorder,
} from '../../lib/cityStatus';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import { Democracy, Republic } from '@civ-clone/civ1-government/Governments';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { High } from '@civ-clone/core-rule/Priorities';
import Player from '@civ-clone/core-player/Player';
import { forgetCityStatuses } from '@civ-clone/base-city-happiness-status/lib/cityStatus';
import isHuman from '@civ-clone/civ1-difficulty/isHuman';

export const getRules = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  turn: Turn = turnInstance
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
  // ...except that a city the human captures under any government but a Republic or a Democracy is put in civil
  //  disorder at once, as v474.05 (`CAPTURE.C` `capunit`, further on): `if (a == civnow && civ_gov[civnow] < 4)
  //  townbuf[b].status |= CITY_DISORDER;`. Its next turn's shields are lost (`CITYMGT.C` `city_process`, which reads
  //  the flag before working the city's disorder out again: `if (townbuf[city].status & 1) scratch_i = 0;`), it can't
  //  buy a unit while it lasts (civ1-treasury's `Spend`), and when its citizens are content that turn order is restored,
  //  with its notice. No notice is given now. A computer player's capture leaves the city out of disorder. After
  //  `forget-status`, and at `High` too, so the other packages' `Captured` rules see the city in disorder
  //  (civ-clone/web-renderer#1014).
  new Captured(
    'civ1-city-happiness:city/captured/disorder',
    new High(),
    new Criterion(
      (city: City, capturingPlayer: Player): boolean =>
        isHuman(capturingPlayer, clientRegistry) &&
        !playerGovernmentRegistry
          .getByPlayer(capturingPlayer)
          .is(Republic, Democracy)
    ),
    new Effect((city: City): void =>
      imposeCapturedDisorder(city, turn.value(), pendingEffects)
    )
  ),
];

export default getRules;
