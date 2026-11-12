import { Anarchy, Republic } from '@civ-clone/civ1-government/Governments';
import { Food, PopulationSupportFood } from '@civ-clone/civ1-city/Yields';
import { LEADER_CELEBRATION, leaderCelebration } from '../lib/cityStatus';
import { Aqueduct } from '@civ-clone/civ1-city-improvement/CityImprovements';
import Captured from '@civ-clone/core-city/Rules/Captured';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import { Happiness } from '../Yields';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';
import register from '../registerRules';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

// What `registerRules` hands the rules (civ-clone/web-renderer#1010): the `Game`'s own registries, and the capture
//  rule ahead of other packages' `Captured` rules.
const setUp = async (
  GovernmentType: typeof Government = Republic,
  size: number = 10
) => {
  const game = new Game(),
    player = new Player(game.rules),
    playerGovernment = new PlayerGovernment(
      player,
      game.availableGovernments,
      game.rules
    );

  register(game);

  game.availableGovernments.register(Anarchy, Republic);
  playerGovernment.set(new GovernmentType());
  game.playerGovernments.register(playerGovernment);

  const city = await setUpCity({
    size,
    player,
    ruleRegistry: game.rules,
    playerWorldRegistry: new PlayerWorldRegistry(),
    cityGrowthRegistry: game.cityGrowth,
    tileImprovementRegistry: game.tileImprovements,
  });

  game.cities.register(city);

  return { city, game, player };
};

describe('registerRules', (): void => {
  it("should judge a celebration by the game's governments", async (): Promise<void> => {
    const { city, game } = await setUp(Anarchy, 4);

    expect(
      game.rules
        .process(CelebrateLeader, city, [new Happiness(4)] as Yield[])
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  it("should hold celebration growth back by the game's city improvements", async (): Promise<void> => {
    const { city, game, player } = await setUp();

    // Celebrating since a turn before, happy, with food to spare.
    city.yields = (): Yield[] => [
      new Food(22),
      new PopulationSupportFood(20),
      new Happiness(10),
    ];
    game.pendingEffects.register(new PendingEffect(LEADER_CELEBRATION, city));
    game.cityImprovements.register(new Aqueduct(city, game.rules));

    game.turn.increment();
    game.rules.process(TurnStart, player);

    expect(game.cityGrowth.getByCity(city).size()).to.equal(11);
  });

  it("should forget a captured city's status before another package's `Captured` rule sees it", async (): Promise<void> => {
    const { city, game } = await setUp(),
      // Whether it was still celebrating, as that rule saw it.
      seen: boolean[] = [];

    game.rules.register(
      new Captured(
        new Effect((city: City): void => {
          seen.push(leaderCelebration(city, game.pendingEffects) !== null);
        })
      )
    );
    game.pendingEffects.register(new PendingEffect(LEADER_CELEBRATION, city));

    city.capture(new Player(game.rules));

    expect(seen).to.deep.equal([false]);
  });
});
