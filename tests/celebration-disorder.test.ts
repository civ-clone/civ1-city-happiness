import {
  Anarchy,
  Democracy,
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import { Food, PopulationSupportFood } from '@civ-clone/civ1-city/Yields';
import { DESPOTISM_PENALTY } from '@civ-clone/civ1-world/lib/governmentTileYield';
import { Happiness, Unhappiness } from '../Yields';
import { civilDisorder, leaderCelebration } from '../lib/cityStatus';
import City from '@civ-clone/core-city/City';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import Grow from '@civ-clone/core-city-growth/Rules/Grow';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Trade } from '@civ-clone/civ1-world/Yields';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Yield from '@civ-clone/core-yield/Yield';
import anarchyDuration from '@civ-clone/civ1-government/Rules/Player/anarchy-duration';
import cityCelebrateLeader from '../Rules/City/celebrate-leader';
import cityCelebrationYield from '../Rules/City/celebration-yield';
import cityCivilDisorder from '../Rules/City/civil-disorder';
import cityGrow from '@civ-clone/civ1-city/Rules/City/grow';
import { expect } from 'chai';
import turnStart from '../Rules/Player/turn-start';

// The moods a size-5 city is put in, by the `Happiness` and `Unhappiness` it's given, judged by this package's own
//  `CelebrateLeader` and `CivilDisorder` rules.
const moods: { [mood: string]: Yield[] } = {
  // 3 happy, 2 content: celebrating.
  celebrating: [new Happiness(3)],
  // 5 content: neither.
  content: [],
  // 3 happy, 1 content, 1 unhappy: not celebrating, but not in disorder.
  oneUnhappy: [new Unhappiness(1), new Happiness(3)],
  // 1 content, 4 unhappy: civil disorder.
  disorder: [new Unhappiness(4)],
};

type Mood = keyof typeof moods;

// v474.05 (`CITYMGT.C` `city_process`) ends a celebration only while the city isn't in civil disorder:
//    } else if (scratch_i >= 0 && (townbuf[city].status & CITY_CELEBRATING)) {   (1788)
//  where `scratch_i = town_happy_ones_num - town_unhappy_counts;` (1697) is below 0 only in disorder
//  (civ-clone/web-renderer#1013).
const setUp = (
  GovernmentType: typeof Government = Republic,
  tileYields: Yield[] = [new Trade(2, 'Ocean')]
) => {
  const game = new Game(),
    player = new Player(game.rules),
    state: { mood: Mood } = { mood: 'celebrating' },
    // One square: what the celebration does to it shows in the city's yields.
    tile = {
      id: () => 'tile',
      yields: () => tileYields,
    },
    city = {
      player: () => player,
      tilesWorked: () => ({ entries: () => [tile] }),
      // 14 food from the squares, 10 eaten by five citizens: 4 to spare.
      yields: (): Yield[] => [
        new Food(14),
        new PopulationSupportFood(10),
        ...moods[state.mood],
      ],
    } as unknown as City,
    cityRegistry = {
      getByPlayer: (): City[] => [city],
    } as unknown as CityRegistry,
    playerGovernment = new PlayerGovernment(
      player,
      game.availableGovernments,
      game.rules
    ),
    cityGrowth = new CityGrowth(city, game.rules),
    events: string[] = [];

  game.availableGovernments.register(
    Anarchy,
    Democracy,
    Despotism,
    Monarchy,
    Republic
  );
  playerGovernment.set(new GovernmentType());
  game.playerGovernments.register(playerGovernment);
  game.cityGrowth.register(cityGrowth);

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
    ...anarchyDuration(() => 0.5),
    ...cityCelebrateLeader(
      game.cityGrowth,
      game.specialists,
      game.playerGovernments
    ),
    ...cityCivilDisorder(game.cityGrowth, game.specialists),
    ...cityCelebrationYield(game.pendingEffects, game.playerGovernments, {
      getByTile: () => [],
    } as unknown as TileImprovementRegistry),
    ...turnStart(
      cityRegistry,
      game.rules,
      game.engine,
      game.cityGrowth,
      game.playerGovernments,
      game.pendingEffects,
      game.turn,
      game.cityImprovements
    )
  );

  while (cityGrowth.size() < 5) {
    cityGrowth.grow();
  }

  [
    'city:civil-disorder',
    'city:grow',
    'city:leader-celebration',
    'city:leader-celebration-ended',
    'city:order-restored',
  ].forEach((event: string): void =>
    game.engine.on(event, (): void => {
      events.push(event);
    })
  );

  // A turn starts with the city in `mood`; returns what was announced.
  const turn = (mood: Mood): string[] => {
      state.mood = mood;
      events.length = 0;
      game.turn.increment();
      game.rules.process(TurnStart, player);

      return [...events];
    },
    celebrating = (): boolean =>
      leaderCelebration(city, game.pendingEffects) !== null,
    // What `celebration-yield` adds to the city's trade.
    celebrationTrade = (): number =>
      (game.rules.process(CityYield, city, []).flat() as Yield[])
        .filter((cityYield: Yield): boolean => cityYield instanceof Trade)
        .reduce(
          (total: number, cityYield: Yield) => total + cityYield.value(),
          0
        ),
    size = (): number => cityGrowth.size(),
    government = (): PlayerGovernment => playerGovernment;

  return { celebrating, celebrationTrade, city, game, government, size, turn };
};

describe('a celebration through civil disorder', (): void => {
  [Republic, Democracy].forEach((GovernmentType: typeof Government) =>
    it(`should keep a celebration through civil disorder under ${GovernmentType.name}, and grow the city as soon as order returns, with no new notice`, (): void => {
      const { celebrating, size, turn } = setUp(GovernmentType);

      expect(turn('celebrating')).to.deep.equal(['city:leader-celebration']);
      expect(turn('disorder')).to.deep.equal(['city:civil-disorder']);
      expect(celebrating()).true;
      expect(size()).to.equal(5);
      expect(turn('celebrating')).to.deep.equal([
        'city:order-restored',
        'city:grow',
      ]);
      expect(size()).to.equal(6);
    })
  );

  it('should keep a celebration through several turns of civil disorder', (): void => {
    const { celebrating, size, turn } = setUp(Republic);

    turn('celebrating');
    turn('disorder');
    turn('disorder');
    turn('disorder');

    expect(celebrating()).true;
    expect(size()).to.equal(5);
    expect(turn('celebrating')).to.deep.equal([
      'city:order-restored',
      'city:grow',
    ]);
  });

  it('should end a celebration, with its notice, when a citizen is unhappy but the city is not in disorder', (): void => {
    const { celebrating, size, turn } = setUp(Republic);

    turn('celebrating');

    expect(turn('oneUnhappy')).to.deep.equal(['city:leader-celebration-ended']);
    expect(celebrating()).false;
    expect(size()).to.equal(5);
  });

  it('should end a celebration, with its notice, when order returns without the celebration', (): void => {
    const { celebrating, turn } = setUp(Republic);

    turn('celebrating');
    turn('disorder');

    expect(turn('content')).to.deep.equal([
      'city:order-restored',
      'city:leader-celebration-ended',
    ]);
    expect(celebrating()).false;
  });

  it('should not start a celebration for a city that falls into disorder', (): void => {
    const { celebrating, size, turn } = setUp(Republic);

    turn('content');

    expect(turn('disorder')).to.deep.equal(['city:civil-disorder']);
    expect(celebrating()).false;
    // So celebrating when order returns is a first turn: announced, and no growth.
    expect(turn('celebrating')).to.deep.equal([
      'city:order-restored',
      'city:leader-celebration',
    ]);
    expect(size()).to.equal(5);
  });

  it('should not grow the city under Monarchy when order returns, nor announce the celebration again', (): void => {
    const { celebrating, size, turn } = setUp(Monarchy);

    turn('celebrating');
    turn('disorder');

    expect(turn('celebrating')).to.deep.equal(['city:order-restored']);
    expect(celebrating()).true;
    expect(size()).to.equal(5);
  });

  // `tile_yield` reads the flag (`CITYMGT.C` 1981, 1990), which disorder leaves set.
  it('should keep the celebration’s trade on the city’s squares under Monarchy while it is in disorder', (): void => {
    const { celebrationTrade, turn } = setUp(Monarchy);

    expect(celebrationTrade()).to.equal(0);

    turn('celebrating');

    expect(celebrationTrade()).to.equal(1);

    turn('disorder');

    expect(celebrationTrade()).to.equal(1);

    turn('oneUnhappy');

    expect(celebrationTrade()).to.equal(0);
  });

  // Under Anarchy nothing celebrates (1765 needs `civ_gov[selected_owner] != 0`), but the flag is cleared only out of
  //  disorder (1788), and then without a notice (1789).
  it('should keep a celebration through disorder under Anarchy, and drop it without a word once order returns', (): void => {
    const { celebrating, government, turn } = setUp(Monarchy);

    turn('celebrating');
    government().set(new Anarchy());

    expect(turn('disorder')).to.deep.equal(['city:civil-disorder']);
    expect(celebrating()).true;
    expect(turn('disorder')).to.deep.equal(['city:civil-disorder']);
    expect(celebrating()).true;
    expect(turn('celebrating')).to.deep.equal(['city:order-restored']);
    expect(celebrating()).false;
  });

  it('should keep a celebration’s squares free of the Anarchy penalty while in disorder under Anarchy', (): void => {
    // 3 trade, less 1 for Anarchy, as civ1-world works it out for a city that isn't celebrating.
    const { celebrationTrade, government, turn } = setUp(Monarchy, [
      new Trade(3, 'Ocean'),
      new Trade(-1, DESPOTISM_PENALTY),
    ]);

    turn('celebrating');
    government().set(new Anarchy());
    turn('disorder');

    expect(celebrationTrade()).to.equal(1);

    turn('content');

    expect(celebrationTrade()).to.equal(0);
  });

  it('should carry a celebration kept through Anarchy into the next government, growing the city at once with no notice', (): void => {
    const { celebrating, government, size, turn } = setUp(Republic);

    turn('celebrating');
    government().set(new Anarchy());
    turn('disorder');
    government().set(new Republic());

    expect(turn('celebrating')).to.deep.equal([
      'city:order-restored',
      'city:grow',
    ]);
    expect(celebrating()).true;
    expect(size()).to.equal(6);
  });

  it('should bring a Democracy down on a second turn of disorder, and keep the celebration through it', (): void => {
    const { celebrating, game, government, city, turn } = setUp(Democracy);

    turn('celebrating');
    turn('disorder');

    expect(government().is(Democracy)).true;

    turn('disorder');

    expect(government().is(Anarchy)).true;
    expect(celebrating()).true;
    expect(civilDisorder(city, game.pendingEffects)).not.null;
  });
});

// The government is asked only when a city is celebrating again, or has a celebration to end: simple-ai-client's
//  suite registers these rules with no government for the player (civ-clone/web-renderer#1010).
describe('a city that never celebrates', (): void => {
  it('should not ask for the government', (): void => {
    const game = new Game(),
      player = new Player(game.rules),
      state: { mood: Mood } = { mood: 'content' },
      city = {
        player: () => player,
        yields: (): Yield[] => [...moods[state.mood]],
      } as unknown as City,
      cityGrowth = new CityGrowth(city, game.rules);

    game.cityGrowth.register(cityGrowth);
    game.rules.register(
      ...cityCelebrateLeader(
        game.cityGrowth,
        game.specialists,
        game.playerGovernments
      ),
      ...cityCivilDisorder(game.cityGrowth, game.specialists),
      ...turnStart(
        {
          getByPlayer: (): City[] => [city],
        } as unknown as CityRegistry,
        game.rules,
        game.engine,
        game.cityGrowth,
        game.playerGovernments,
        game.pendingEffects,
        game.turn,
        game.cityImprovements
      )
    );

    while (cityGrowth.size() < 5) {
      cityGrowth.grow();
    }

    (
      ['content', 'disorder', 'oneUnhappy', 'disorder', 'content'] as Mood[]
    ).forEach((mood: Mood): void => {
      state.mood = mood;
      game.turn.increment();

      expect(() => game.rules.process(TurnStart, player)).not.to.throw();
    });
  });
});
