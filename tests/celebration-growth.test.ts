import {
  Aqueduct,
  Granary,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import {
  Anarchy,
  Democracy,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  Food,
  PopulationSupportFood,
  UnitSupportFood,
} from '@civ-clone/civ1-city/Yields';
import { LEADER_CELEBRATION, leaderCelebration } from '../lib/cityStatus';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import Grow from '@civ-clone/core-city-growth/Rules/Grow';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Yield from '@civ-clone/core-yield/Yield';
import cityGrow from '@civ-clone/civ1-city/Rules/City/grow';
import cityImprovementGrow from '@civ-clone/civ1-city-improvement/Rules/City/grow';
import { expect } from 'chai';
import turnStart from '../Rules/Player/turn-start';

// v474.05 grows a celebrating city only from its second turn of celebrating, under a Republic or Democracy, with food
//  to spare after its citizens and Settlers have eaten, and past size 10 only with an Aqueduct; the food store is left
//  as it is (civ-clone/web-renderer#1010).
const setUp = ({
  GovernmentType = Republic,
  size = 5,
  stored = 7,
}: {
  GovernmentType?: typeof Government;
  size?: number;
  stored?: number;
} = {}) => {
  const game = new Game(),
    player = new Player(game.rules),
    state: { celebrating: boolean; yields: Yield[] } = {
      celebrating: true,
      // 14 food from the squares, 10 eaten by five citizens: 4 to spare.
      yields: [new Food(14), new PopulationSupportFood(10)],
    },
    // Only what the turn-start rules ask of a city.
    city = {
      player: () => player,
      yields: () => state.yields,
    } as unknown as City,
    cityRegistry = {
      getByPlayer: (): City[] => [city],
    } as unknown as CityRegistry,
    playerGovernment = new PlayerGovernment(
      player,
      game.availableGovernments,
      game.rules
    ),
    cityGrowth = new CityGrowth(city, game.rules);

  game.availableGovernments.register(Anarchy, Democracy, Monarchy, Republic);
  playerGovernment.set(new GovernmentType());
  game.playerGovernments.register(playerGovernment);
  game.cityGrowth.register(cityGrowth);

  // civ1-city's own `Grow` rules that empty the store, set the next size's cost and announce the growth, and
  //  civ1-city-improvement's that half-fill the store with a Granary and hold a city back without an Aqueduct, so the
  //  store is checked against the real ones. The rest put a citizen to work, which needs a world.
  game.rules.register(
    ...cityGrow(
      game.cityGrowth,
      undefined,
      undefined,
      undefined,
      undefined,
      game.engine
    ).filter((rule: Grow): boolean =>
      [
        'civ1-city:city/grow/empty-food-store',
        'civ1-city:city/grow/set-growth-cost',
        'civ1-city:city/grow/emit',
      ].includes(rule.id() as string)
    ),
    ...cityImprovementGrow(game.cityImprovements)
  );

  while (cityGrowth.size() < size) {
    cityGrowth.grow();
  }

  cityGrowth.progress().set(stored);

  const rules = turnStart(
    cityRegistry,
    game.rules,
    game.engine,
    game.cityGrowth,
    game.playerGovernments,
    game.pendingEffects,
    game.turn,
    game.cityImprovements
  );

  game.rules.register(
    new CelebrateLeader(new Effect((): boolean => state.celebrating)),
    ...rules
  );

  const grown: [City, unknown][] = [];

  game.engine.on('city:grow', (city: City, cause: unknown): void => {
    grown.push([city, cause]);
  });

  // A turn starts with the city celebrating, or not.
  const turn = (celebrating: boolean = true): void => {
    state.celebrating = celebrating;
    game.turn.increment();
    game.rules.process(TurnStart, player);
  };

  return { city, cityGrowth, game, grown, player, rules, state, turn };
};

describe('player:turn-start/celebration-growth', (): void => {
  it('should not grow on the first turn of celebrating', (): void => {
    const { cityGrowth, turn } = setUp();

    turn();

    expect(cityGrowth.size()).to.equal(5);
  });

  [Republic, Democracy].forEach((GovernmentType: typeof Government): void =>
    it(`should grow by one each turn from the second turn of celebrating under ${GovernmentType.name}`, (): void => {
      const { city, cityGrowth, grown, turn } = setUp({ GovernmentType });

      turn();
      turn();

      expect(cityGrowth.size()).to.equal(6);
      expect(grown).to.deep.equal([[city, CelebrateLeader]]);

      turn();

      expect(cityGrowth.size()).to.equal(7);
    })
  );

  it('should leave the food store as it is', (): void => {
    const { cityGrowth, turn } = setUp({ stored: 7 });

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);
    expect(cityGrowth.progress().value()).to.equal(7);
    // The next size costs what it would have had the city grown from food.
    expect(cityGrowth.cost().value()).to.equal(70);
  });

  it('should leave the food store as it is with a Granary', (): void => {
    const { city, cityGrowth, game, turn } = setUp({ stored: 7 });

    game.cityImprovements.register(new Granary(city, game.rules));

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);
    expect(cityGrowth.progress().value()).to.equal(7);
  });

  it('should grow a city whose celebration was recorded before this turn (a loaded game)', (): void => {
    const { city, cityGrowth, game, turn } = setUp();

    game.pendingEffects.register(new PendingEffect(LEADER_CELEBRATION, city));

    turn();

    expect(cityGrowth.size()).to.equal(6);
  });

  it('should not grow when the celebration has ended', (): void => {
    const { city, cityGrowth, game, turn } = setUp();

    turn();
    turn(false);

    expect(cityGrowth.size()).to.equal(5);
    expect(leaderCelebration(city, game.pendingEffects)).null;
  });

  it('should stop growing when the celebration ends', (): void => {
    const { cityGrowth, turn } = setUp();

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);

    turn(false);

    expect(cityGrowth.size()).to.equal(6);
  });

  it('should grow a city only on the turn the status rule found it celebrating again', (): void => {
    const { cityGrowth, rules, turn } = setUp();

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);

    // With the status rule off, nothing says the city is still celebrating.
    rules[0].disable();
    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);
  });

  it('should not grow on what the status rule found while the growth rule was off', (): void => {
    const { cityGrowth, rules, turn } = setUp();

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);

    rules[1].disable();
    turn();
    rules[1].enable();
    turn(false);

    expect(cityGrowth.size()).to.equal(6);
  });

  // `celebrate-leader` says no city celebrates under Anarchy; the record follows whatever the `CelebrateLeader` rules
  //  say, and only a celebration that has ended is dropped without a notice.
  it('should keep the celebration of a city still celebrating under Anarchy', (): void => {
    const { city, game, turn } = setUp({ GovernmentType: Anarchy });

    turn();
    turn();

    expect(leaderCelebration(city, game.pendingEffects)).not.null;
  });

  it('should not grow when the celebration has ended, though it was recorded before this turn', (): void => {
    const { city, cityGrowth, game, turn } = setUp();

    game.pendingEffects.register(new PendingEffect(LEADER_CELEBRATION, city));

    turn(false);

    expect(cityGrowth.size()).to.equal(5);
  });

  it('should start again from the first turn after a break in celebrating', (): void => {
    const { cityGrowth, turn } = setUp();

    turn();
    turn(false);
    turn();

    expect(cityGrowth.size()).to.equal(5);

    turn();

    expect(cityGrowth.size()).to.equal(6);
  });

  it('should not grow under Monarchy', (): void => {
    const { cityGrowth, turn } = setUp({ GovernmentType: Monarchy });

    turn();
    turn();
    turn();

    expect(cityGrowth.size()).to.equal(5);
  });

  it('should not grow with no food to spare', (): void => {
    const { cityGrowth, state, turn } = setUp();

    state.yields = [new Food(10), new PopulationSupportFood(10)];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(5);
  });

  it('should not grow when short of food', (): void => {
    const { cityGrowth, state, turn } = setUp();

    state.yields = [new Food(8), new PopulationSupportFood(10)];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(5);
  });

  it('should not grow when its Settlers eat what would be to spare', (): void => {
    const { cityGrowth, state, turn } = setUp();

    state.yields = [
      new Food(14),
      new PopulationSupportFood(10),
      new UnitSupportFood(2),
      new UnitSupportFood(2),
    ];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(5);
  });

  it('should grow when food is still to spare after its Settlers have eaten', (): void => {
    const { cityGrowth, state, turn } = setUp();

    state.yields = [
      new Food(15),
      new PopulationSupportFood(10),
      new UnitSupportFood(2),
      new UnitSupportFood(2),
    ];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(6);
  });

  it('should grow to size 10 without an Aqueduct', (): void => {
    const { cityGrowth, state, turn } = setUp({ size: 9 });

    state.yields = [new Food(20), new PopulationSupportFood(18)];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(10);
  });

  it('should not grow past size 10 without an Aqueduct', (): void => {
    const { cityGrowth, grown, state, turn } = setUp({ size: 10 });

    state.yields = [new Food(22), new PopulationSupportFood(20)];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(10);
    expect(grown).to.be.empty;
  });

  it('should grow past size 10 with an Aqueduct', (): void => {
    const { city, cityGrowth, game, state, turn } = setUp({ size: 10 });

    game.cityImprovements.register(new Aqueduct(city, game.rules));
    state.yields = [new Food(22), new PopulationSupportFood(20)];

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(11);
  });

  it('should not grow under Monarchy when every other condition holds, then grow once a Republic', (): void => {
    const { cityGrowth, game, player, turn } = setUp({
      GovernmentType: Monarchy,
    });

    turn();
    turn();

    expect(cityGrowth.size()).to.equal(5);

    game.playerGovernments.getByPlayer(player).set(new Republic());

    turn();

    expect(cityGrowth.size()).to.equal(6);
  });
});
