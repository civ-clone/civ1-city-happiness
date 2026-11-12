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

  // The cities celebrating for a second turn running (or more), with the yields they were judged on: only the first
  //  rule still knows whether a city was celebrating before this turn's check, so it hands them to the growth rule.
  const celebratingAgain = new WeakMap<City, Yield[]>();

  return [
    new TurnStart(
      new Low(),
      new Effect((player: Player): void =>
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

          if (isLeaderCelebration && celebration !== null) {
            celebratingAgain.set(city, yields);
          } else {
            celebratingAgain.delete(city);
          }

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

              engine.emit('player:government:collapsed', player, city);
            }
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

          // A city can't celebrate under Anarchy (`celebrate-leader`), and v474.05 ends a celebration then without a
          //  word: its "celebration canceled" notice needs `civ_gov[selected_owner] != 0` (`CITYMGT.C` `city_process`),
          //  so the record is dropped rather than ended (civ-clone/web-renderer#1010).
          if (
            !isLeaderCelebration &&
            celebration !== null &&
            playerGovernmentRegistry.getByPlayer(player).is(Anarchy)
          ) {
            forgetCityStatuses(city, [LEADER_CELEBRATION], pendingEffects);
          } else {
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
          }
        })
      )
    ),
    // A city celebrating "We Love the King Day" for a second turn running grows by one under a Republic or a Democracy,
    //  while it has food to spare (its Settlers' included) and the Aqueduct doesn't hold it back. v474.05
    //  (`CITYMGT.C` `city_process`, where the first celebrating turn only sets the flag):
    //    if (!(townbuf[city].status & CITY_CELEBRATING)) { ... townbuf[city].status |= CITY_CELEBRATING; }
    //    else if (civ_gov[selected_owner] >= 4 && townbuf[city].size * 2 + colonist_homed * sett_food_j <
    //      town_res_sums[0] && (townbuf[city].size < 10 || (townbuf[city].buildings & HAS_AQUEDUCT)))
    //      townbuf[city].size++;
    //  `civ_gov` 4 and 5 are the Republic and Democracy (`GAME.C` `government_names`). The food store is left as it is:
    //  this growth isn't paid for from it (civ-clone/web-renderer#1010).
    new TurnStart(
      'civ1-city-happiness:player/turn-start/celebration-growth',
      new Low(),
      new Effect((player: Player): void => {
        // Read here, not in a `Criterion`: every rule's criteria are checked before any rule runs, and the status rule
        //  above can bring a Democracy down this turn.
        const republicOrDemocracy = playerGovernmentRegistry
          .getByPlayer(player)
          .is(Republic, Democracy);

        cityRegistry.getByPlayer(player).forEach((city: City) => {
          const yields = celebratingAgain.get(city);

          // Taken once, so an entry the status rule didn't set this turn can't grow the city again.
          celebratingAgain.delete(city);

          if (yields === undefined || !republicOrDemocracy) {
            return;
          }

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
        });
      })
    ),
  ];
};

export default getRules;
