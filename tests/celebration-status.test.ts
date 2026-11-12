import {
  Anarchy,
  Democracy,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  civilDisorder,
  leaderCelebration,
} from '../lib/cityStatus';
import { Food, PopulationSupportFood } from '@civ-clone/civ1-city/Yields';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import Government from '@civ-clone/core-government/Government';
import Grow from '@civ-clone/core-city-growth/Rules/Grow';
import { Happiness } from '../Yields';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Yield from '@civ-clone/core-yield/Yield';
import anarchyDuration from '@civ-clone/civ1-government/Rules/Player/anarchy-duration';
import cityCaptured from '../Rules/City/captured';
import cityCelebrateLeader from '../Rules/City/celebrate-leader';
import cityGrow from '@civ-clone/civ1-city/Rules/City/grow';
import { expect } from 'chai';
import turnStart from '../Rules/Player/turn-start';

// How a city's celebration (and disorder) is kept across a change of government or of owner, with the real
//  `CelebrateLeader` rule: every city here is size 5 with 4 food to spare, and celebrates while it's happy
//  (civ-clone/web-renderer#1010).
const setUp = (...governments: (typeof Government)[]) => {
  const game = new Game(),
    players = governments.map(() => new Player(game.rules)),
    owners = new Map<City, Player>(),
    state = new Map<City, { disorder: boolean; happy: boolean }>(),
    cities: City[] = [],
    cityRegistry = {
      getByPlayer: (player: Player): City[] =>
        cities.filter((city: City): boolean => owners.get(city) === player),
    } as unknown as CityRegistry,
    events: [string, City][] = [];

  game.availableGovernments.register(Anarchy, Democracy, Monarchy, Republic);

  players.forEach((player: Player, index: number): void => {
    const playerGovernment = new PlayerGovernment(
      player,
      game.availableGovernments,
      game.rules
    );

    playerGovernment.set(new governments[index]());
    game.playerGovernments.register(playerGovernment);
  });

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
    new CivilDisorder(
      new Effect((city: City): boolean => state.get(city)!.disorder)
    ),
    ...cityCaptured(game.pendingEffects),
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

  [
    'city:grow',
    'city:leader-celebration',
    'city:leader-celebration-ended',
    'city:order-restored',
  ].forEach((event: string): void =>
    game.engine.on(event, (city: City): void => {
      events.push([event, city]);
    })
  );

  // A city of `player`'s, happy (celebrating) or not, in disorder or not.
  const city = (
    player: Player,
    { disorder = false, happy = true } = {}
  ): City => {
    const city = {
        player: () => owners.get(city)!,
        yields: (): Yield[] => [
          new Food(14),
          new PopulationSupportFood(10),
          ...(state.get(city)!.happy ? [new Happiness(5)] : []),
        ],
      } as unknown as City,
      cityGrowth = new CityGrowth(city, game.rules);

    owners.set(city, player);
    state.set(city, { disorder, happy });
    cities.push(city);
    game.cityGrowth.register(cityGrowth);

    while (cityGrowth.size() < 5) {
      cityGrowth.grow();
    }

    return city;
  };

  const size = (city: City): number => game.cityGrowth.getByCity(city).size(),
    government = (player: Player): PlayerGovernment =>
      game.playerGovernments.getByPlayer(player),
    // A turn: each player's turn starts in turn.
    turn = (): void => {
      events.length = 0;
      game.turn.increment();
      players.forEach((player: Player): void => {
        game.rules.process(TurnStart, player);
      });
    },
    capture = (city: City, captor: Player): void => {
      const previous = owners.get(city)!;

      events.length = 0;
      owners.set(city, captor);
      game.rules.process(Captured, city, captor, previous, null);
    };

  return {
    capture,
    city,
    events,
    game,
    government,
    players,
    size,
    state,
    turn,
  };
};

describe('celebration and disorder status', (): void => {
  // v474.05 (`CITYMGT.C` `city_process`): no celebration while `civ_gov[selected_owner] == 0`, and the celebration that
  //  was going ends with no "celebration canceled" notice, which also needs `civ_gov[selected_owner] != 0`.
  it('should end a celebration under Anarchy without a notice, so the first Republic turn is a first turn again', (): void => {
    const {
      city: addCity,
      events,
      game,
      government,
      players: [player],
      size,
      turn,
    } = setUp(Monarchy);
    const city = addCity(player);

    turn();

    expect(events).to.deep.equal([['city:leader-celebration', city]]);

    turn();

    expect(size(city)).to.equal(5);

    government(player).set(new Anarchy());
    turn();

    expect(leaderCelebration(city, game.pendingEffects)).null;
    expect(events).to.be.empty;

    turn();

    expect(events).to.be.empty;

    government(player).set(new Republic());
    turn();

    expect(events).to.deep.equal([['city:leader-celebration', city]]);
    expect(size(city)).to.equal(5);

    turn();

    expect(size(city)).to.equal(6);
  });

  it('should still announce the end of a celebration under any other government', (): void => {
    const {
      city: addCity,
      events,
      players: [player],
      state,
      turn,
    } = setUp(Monarchy);
    const city = addCity(player);

    turn();
    state.get(city)!.happy = false;
    turn();

    expect(events).to.deep.equal([['city:leader-celebration-ended', city]]);
  });

  // The status rule can bring a Democracy down part-way through a player's cities: the growth rule reads the
  //  government after it has, whichever city comes first.
  [
    ['before', true],
    ['after', false],
  ].forEach(([where, celebratingFirst]) =>
    it(`should not grow a city celebrating again ${where} the city whose disorder brings a Democracy down`, (): void => {
      const {
        city: addCity,
        government,
        players: [player],
        size,
        turn,
      } = setUp(Democracy);
      const unrest = { disorder: true, happy: false },
        first = addCity(player, celebratingFirst ? {} : unrest),
        second = addCity(player, celebratingFirst ? unrest : {}),
        celebrating = celebratingFirst ? first : second;

      turn();

      expect(government(player).is(Democracy)).true;

      turn();

      expect(government(player).is(Anarchy)).true;
      expect(size(celebrating)).to.equal(5);
    })
  );

  // v474.05 (`CAPTURE.C` `capunit`): `townbuf[b].status &= CITY_CAPTURE_MASK;` then `&= CITY_TRANSFER_MASK;`, which
  //  clear `CITY_DISORDER` and `CITY_CELEBRATING`.
  it('should forget a captured city’s celebration, so the captor’s first turn of it is a first turn', (): void => {
    const {
      capture,
      city: addCity,
      events,
      game,
      players: [owner, captor],
      size,
      turn,
    } = setUp(Republic, Republic);
    const city = addCity(owner);

    turn();
    turn();

    expect(size(city)).to.equal(6);

    capture(city, captor);

    expect(leaderCelebration(city, game.pendingEffects)).null;
    expect(events).to.be.empty;

    turn();

    expect(events).to.deep.equal([['city:leader-celebration', city]]);
    expect(size(city)).to.equal(6);

    turn();

    expect(size(city)).to.equal(7);
  });

  it('should forget a captured city’s disorder, so a Democracy that captures it falls only on a second turn of it', (): void => {
    const {
      capture,
      city: addCity,
      events,
      game,
      government,
      players: [owner, captor],
      turn,
    } = setUp(Monarchy, Democracy);
    const city = addCity(owner, { disorder: true, happy: false });

    turn();

    expect(civilDisorder(city, game.pendingEffects)).not.null;

    capture(city, captor);

    expect(civilDisorder(city, game.pendingEffects)).null;
    expect(events).to.be.empty;

    turn();

    expect(government(captor).is(Democracy)).true;

    turn();

    expect(government(captor).is(Anarchy)).true;
  });

  it('should leave any other city’s status alone on a capture', (): void => {
    const {
      capture,
      city: addCity,
      game,
      players: [owner, captor],
    } = setUp(Republic, Republic);
    const city = addCity(owner),
      other = addCity(owner);

    game.pendingEffects.register(
      new PendingEffect(LEADER_CELEBRATION, city),
      new PendingEffect(LEADER_CELEBRATION, other),
      new PendingEffect(CIVIL_DISORDER, other)
    );

    capture(city, captor);

    expect(leaderCelebration(other, game.pendingEffects)).not.null;
    expect(civilDisorder(other, game.pendingEffects)).not.null;
  });
});
