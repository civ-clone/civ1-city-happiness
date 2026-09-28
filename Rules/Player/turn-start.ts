import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
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
  PendingEffect,
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
  pendingRevolution,
  revolution,
} from '@civ-clone/civ1-government/lib/revolution';
import City from '@civ-clone/core-city/City';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import { Democracy } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import { Low } from '@civ-clone/core-rule/Priorities';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';

export const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  pendingEffects?: PendingEffectRegistry,
  turn?: Turn
) => TurnStart[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  engine = engineInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  turn: Turn = turnInstance
): TurnStart[] => {
  registerHandlers(pendingEffects, engine);

  return [
    new TurnStart(
      new Low(),
      new Effect((player: Player): void =>
        cityRegistry.getByPlayer(player).forEach((city: City) => {
          const isCivilDisorder = ruleRegistry
              .process(CivilDisorder, city, city.yields())
              .some((result: boolean): boolean => result),
            isLeaderCelebration = ruleRegistry
              .process(CelebrateLeader, city, city.yields())
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

              engine.emit('player:government:collapsed', player, city);
            }
          }

          if (isCivilDisorder && disorder === null) {
            pendingEffects.register(new PendingEffect(CIVIL_DISORDER, city));
          }

          // Emits `city:order-restored`.
          if (!isCivilDisorder && disorder !== null) {
            pendingEffects.discharge(disorder);
          }

          if (isLeaderCelebration && celebration === null) {
            engine.emit('city:leader-celebration', city);

            pendingEffects.register(
              new PendingEffect(LEADER_CELEBRATION, city)
            );
          }

          // Emits `city:leader-celebration-ended`.
          if (!isLeaderCelebration && celebration !== null) {
            pendingEffects.discharge(celebration);
          }
        })
      )
    ),
    new TurnStart(
      new Low(),
      new Effect((player: Player): void =>
        cityRegistry.getByPlayer(player).forEach((city: City) => {
          if (leaderCelebration(city, pendingEffects) === null) {
            return;
          }

          const cityGrowth = cityGrowthRegistry.getByCity(city);

          cityGrowth.grow();
        })
      )
    ),
  ];
};

export default getRules;
