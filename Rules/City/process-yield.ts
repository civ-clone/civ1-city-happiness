import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Low } from '@civ-clone/core-rule/Priorities';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import { Production } from '@civ-clone/civ1-city/Yields';
import Yield from '@civ-clone/core-yield/Yield';
import { settleCapturedDisorder } from '../../lib/cityStatus';

export const getRules = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): ProcessYield[] => [
  // A city the human captured below a Republic loses one turn's shields to its disorder, as v474.05, which zeroes them
  //  while the flag its capture set is still up (`CITYMGT.C` `city_process`: `if (townbuf[city].status & 1) scratch_i =
  //  0;`), so its `CivilDisorder` rule (`captured`) holds until the production is processed, and no longer. Its food is
  //  stored as usual. Its trade is processed by `civ1-trade-rate`'s `High` `TurnStart`, which comes after
  //  `civ1-player`'s only because it's loaded later: then it's judged by its citizens, as v474.05 judges its taxes,
  //  and were it to come first that turn's research would be lost as well, as it is in any disorder here. Its disorder stays recorded until the citizens are judged at
  //  `Low` `TurnStart`, which keeps it or restores order (civ-clone/web-renderer#1014). At `Low`, after the production is
  //  added to the build (`civ1-city`).
  new ProcessYield(
    'civ1-city-happiness:city/process-yield/settle-captured-disorder',
    new Low(),
    new Criterion(
      (cityYield: Yield): cityYield is Production =>
        cityYield instanceof Production
    ),
    new Effect((cityYield: Production, city: City): void =>
      settleCapturedDisorder(city, pendingEffects)
    )
  ),
];

export default getRules;
