import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  civilDisorder,
  leaderCelebration,
  registerHandlers,
} from '../../lib/cityStatus';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  Anarchy,
  Democracy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  pendingRevolution,
  revolution,
} from '@civ-clone/civ1-government/lib/revolution';
import City from '@civ-clone/core-city/City';
import {
  forgetCityStatuses,
  updateCityStatus,
} from '@civ-clone/base-city-happiness-status/lib/cityStatus';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import { Food } from '@civ-clone/civ1-city/Yields';
import { Low } from '@civ-clone/core-rule/Priorities';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Yield from '@civ-clone/core-yield/Yield';
import { growthLimit } from '@civ-clone/civ1-city-improvement/lib/growthLimit';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

export const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  pendingEffects?: PendingEffectRegistry,
  turn?: Turn,
  cityImprovementRegistry?: CityImprovementRegistry
) => TurnStart[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  engine = engineInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  turn: Turn = turnInstance,
  cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance
): TurnStart[] => {
  registerHandlers(pendingEffects, engine);

  // The cities celebrating for a second turn running (or more), with the yields they were judged on and whether the
  //  player was a Republic or Democracy when the city's turn came: only the first rule still knows whether a city was
  //  celebrating before this turn's check, so it hands them to the growth rule.
  const celebratingAgain = new WeakMap<
    City,
    { republicOrDemocracy: boolean; yields: Yield[] }
  >();

  return [
    new TurnStart(
      new Low(),
      new Effect((player: Player): void => {
        // Asked once a city is celebrating again, and then once, until a city's disorder brings a Democracy down.
        let republicOrDemocracy: boolean | undefined;

        cityRegistry.getByPlayer(player).forEach((city: City) => {
          // Both rules read the same yields, and working them out isn't cheap
          // (civ-clone/web-renderer#315).
          const yields = city.yields(),
            isCivilDisorder = ruleRegistry
              .process(CivilDisorder, city, yields)
              .some((result: boolean): boolean => result),
            isLeaderCelebration = ruleRegistry
              .process(CelebrateLeader, city, yields)
              .some((result: boolean): boolean => result);

          if (isCivilDisorder) {
            engine.emit('city:civil-disorder', city);
          }

          // Kept in `pendingEffects`, which is saved, so a loaded game knows
          // which cities were already in disorder or celebrating
          // (civ-clone/web-renderer#121).
          const disorder = civilDisorder(city, pendingEffects),
            celebration = leaderCelebration(city, pendingEffects);

          // A Democracy falls when a city is in civil disorder for a second turn
          // running (Rome on 640K a Day, p221-223), and the Anarchy lasts twice
          // as long as usual.
          if (isCivilDisorder && disorder !== null) {
            const playerGovernment =
              playerGovernmentRegistry.getByPlayer(player);

            if (
              playerGovernment.is(Democracy) &&
              pendingRevolution(playerGovernment, pendingEffects) === null
            ) {
              revolution(
                playerGovernment,
                pendingEffects,
                ruleRegistry,
                turn,
                'civil-disorder'
              );

              republicOrDemocracy = undefined;

              engine.emit('player:government:collapsed', player, city);
            }
          }

          // v474.05 works through a player's cities one at a time, and a Democracy falls inside the city whose
          //  disorder brings it down (`set_government(selected_owner, 0);`, `CITYMGT.C` 1740), so the cities before it
          //  have already grown under the Democracy, and those after it see Anarchy. The government is asked here, as
          //  each city's turn comes, for the growth rule (civ-clone/web-renderer#1013).
          if (isLeaderCelebration && celebration !== null) {
            celebratingAgain.set(city, {
              republicOrDemocracy: (republicOrDemocracy ??=
                playerGovernmentRegistry
                  .getByPlayer(player)
                  .is(Republic, Democracy)),
              yields,
            });
          } else {
            celebratingAgain.delete(city);
          }

          // Records disorder that has started, and ends disorder that has
          // stopped, which emits `city:order-restored`.
          updateCityStatus(
            CIVIL_DISORDER,
            city,
            isCivilDisorder,
            disorder,
            pendingEffects
          );

          // v474.05 ends a celebration only while the city isn't in civil disorder (`CITYMGT.C` `city_process`):
          //    scratch_i = town_happy_ones_num - town_unhappy_counts;                                    (1697)
          //    if (scratch_i < 0) { ... "Civil Disorder in" ... }                                          (1698)
          //    ...
          //    if (town_unhappy_counts == 0 && townbuf[city].size > 2 && ... && civ_gov[selected_owner] != 0) {
          //      ...                                                           (1765, starts it or grows the city)
          //    } else if (scratch_i >= 0 && (townbuf[city].status & CITY_CELEBRATING)) {                (1788)
          //      if ((human_set & (1 << selected_owner)) && civ_gov[selected_owner] != 0) {               (1789)
          //        ... "celebration canceled" ... }
          //      townbuf[city].status &= ~CITY_CELEBRATING;                                             (1799)
          //    }
          //  So a celebrating city in disorder keeps its celebration, with no notice, under any government (Anarchy
          //  too); its squares keep the celebration's yields (`celebration-yield`); and when order returns with the
          //  celebration's conditions met it carries on, with no new notice, and a Republic or Democracy grows it at
          //  once (civ-clone/web-renderer#1013).
          if (isCivilDisorder && !isLeaderCelebration) {
            return;
          }

          // A city can't celebrate under Anarchy (`celebrate-leader`), and v474.05 ends a celebration then without a
          //  word: its "celebration canceled" notice needs `civ_gov[selected_owner] != 0` (1789), so the record is
          //  dropped rather than ended (civ-clone/web-renderer#1010).
          if (
            !isLeaderCelebration &&
            celebration !== null &&
            playerGovernmentRegistry.getByPlayer(player).is(Anarchy)
          ) {
            forgetCityStatuses(city, [LEADER_CELEBRATION], pendingEffects);

            return;
          }

          // The same for a celebration, emitting `city:leader-celebration` as
          // it starts and `city:leader-celebration-ended` as it ends.
          updateCityStatus(
            LEADER_CELEBRATION,
            city,
            isLeaderCelebration,
            celebration,
            pendingEffects,
            () => engine.emit('city:leader-celebration', city)
          );
        });
      })
    ),
    // A city celebrating "We Love the King Day" for a second turn running grows by one under a Republic or a Democracy,
    //  while it has food to spare (its Settlers' included) and the Aqueduct doesn't hold it back. v474.05
    //  (`CITYMGT.C` `city_process`, where the first celebrating turn only sets the flag):
    //    if (!(townbuf[city].status & CITY_CELEBRATING)) { ... townbuf[city].status |= CITY_CELEBRATING; }
    //    else if (civ_gov[selected_owner] >= 4 && townbuf[city].size * 2 + colonist_homed * sett_food_j <
    //      town_res_sums[0] && (townbuf[city].size < 10 || (townbuf[city].buildings & HAS_AQUEDUCT)))
    //      townbuf[city].size++;
    //  The size cap here is unconditional; growth from the food store has the same one, under `rule_options & 4`
    //  (`CITYMGT.C` 321-322), which is always set (`rule_options = 15;`, `NEWGAME.C` 65). `civ_gov` 4 and 5 are the Republic and Democracy (`GAME.C` `government_names`). The food store is left as it is:
    //  this growth isn't paid for from it (civ-clone/web-renderer#1010).
    new TurnStart(
      'civ1-city-happiness:player/turn-start/celebration-growth',
      new Low(),
      new Effect((player: Player): void =>
        cityRegistry.getByPlayer(player).forEach((city: City) => {
          const celebrating = celebratingAgain.get(city);

          // Taken once, so an entry the status rule didn't set this turn can't grow the city again.
          celebratingAgain.delete(city);

          // The government as it was when the status rule came to the city, not as it is now: the status rule can
          //  bring a Democracy down part-way through the player's cities. (Not a `Criterion` either: every rule's
          //  criteria are checked before any rule runs.)
          if (celebrating === undefined || !celebrating.republicOrDemocracy) {
            return;
          }

          const { yields } = celebrating;

          const cityGrowth = cityGrowthRegistry.getByCity(city);

          // The city's food net of what its citizens and Settlers eat.
          if (
            reduceYield(yields, Food) <= 0 ||
            growthLimit(cityGrowth, cityImprovementRegistry) !== null
          ) {
            return;
          }

          const storedFood = cityGrowth.progress().value();

          // Grown through `CityGrowth`, so the new citizen is put to work, as joining Settlers are; its `Grow` rules
          //  also empty the store (or, with a Granary, half-fill it), so it's put back.
          cityGrowth.grow(CelebrateLeader);
          cityGrowth.progress().set(storedFood, 'celebration-growth');
        })
      )
    ),
  ];
};

export default getRules;
