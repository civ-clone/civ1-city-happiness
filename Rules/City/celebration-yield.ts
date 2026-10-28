import {
  DESPOTISM_PENALTY,
  TRADE_BONUS,
  governmentTileYield,
  governmentTileYieldTypes,
} from '@civ-clone/civ1-world/lib/governmentTileYield';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import { Pollution } from '@civ-clone/civ1-world/TileImprovements';
import Priority from '@civ-clone/core-rule/Priority';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Yield, { YieldValue } from '@civ-clone/core-yield/Yield';
import { leaderCelebration } from '../../lib/cityStatus';

// The providers of what the government and pollution did to a square, which a celebrating city works out again.
const governmentSteps = [DESPOTISM_PENALTY, TRADE_BONUS, Pollution.name];

export const getRules: (
  pendingEffects?: PendingEffectRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  tileImprovementRegistry?: TileImprovementRegistry
) => CityYield[] = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance
): CityYield[] => [
  // A celebrating city's squares escape the Anarchy and Despotism penalty, and under Monarchy and Communism get The
  //  Republic's trade bonus (v474.05 `CityWorker.cs` L4102-4134, civ-clone/web-renderer#401). A square's own yields
  //  are worked out for a city that isn't celebrating, as they're kept per player, so this adds the difference: what
  //  the square yields before the government's steps, through them again as a celebrating city, then pollution. After
  //  the worked squares, and before trade routes and corruption, which count it.
  new CityYield(
    'civ1-city-happiness:city/yield/celebration',
    new Priority(1),
    new Criterion(
      (city: City): boolean => leaderCelebration(city, pendingEffects) !== null
    ),
    new Effect((city: City): Yield[] => {
      let government: PlayerGovernment;

      try {
        government = playerGovernmentRegistry.getByPlayer(city.player());
      } catch (e) {
        return [];
      }

      return city
        .tilesWorked()
        .entries()
        .flatMap((tile): Yield[] => {
          const tileYields = tile.yields(city.player()),
            polluted = tileImprovementRegistry
              .getByTile(tile)
              .some(
                (improvement: TileImprovement): boolean =>
                  improvement instanceof Pollution
              );

          return governmentTileYieldTypes.flatMap(
            (YieldType: typeof Yield): Yield[] => {
              const ofType = tileYields.filter(
                  (tileYield: Yield): boolean => tileYield instanceof YieldType
                ),
                current = ofType.reduce(
                  (total: number, tileYield: Yield): number =>
                    total + tileYield.value(),
                  0
                ),
                before = ofType
                  .flatMap((tileYield: Yield) => tileYield.values())
                  .filter(
                    ([, provider]: YieldValue): boolean =>
                      !governmentSteps.includes(provider)
                  )
                  .reduce(
                    (total: number, [value]: YieldValue): number =>
                      total + value,
                    0
                  ),
                celebrating = governmentTileYield(
                  YieldType,
                  before,
                  government,
                  true
                ),
                value = polluted ? Math.ceil(celebrating / 2) : celebrating;

              if (value === current) {
                return [];
              }

              return [
                new YieldType(value - current, `${tile.id()}: celebration`),
              ];
            }
          );
        });
    })
  ),
];

export default getRules;
