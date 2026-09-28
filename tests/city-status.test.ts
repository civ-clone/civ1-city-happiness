import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  civilDisorder,
  leaderCelebration,
} from '../lib/cityStatus';
import { Anarchy, Democracy } from '@civ-clone/civ1-government/Governments';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import CivilDisorderAction from '../PlayerActions/CivilDisorder';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import { PendingEffect } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import anarchyDuration from '@civ-clone/civ1-government/Rules/Player/anarchy-duration';
import cityDestroyed from '../Rules/City/destroyed';
import { expect } from 'chai';
import playerAction from '../Rules/Player/action';
import turnStart from '../Rules/Player/turn-start';

// A game with one Democracy and one city, whose disorder and celebration are
// set per turn. Only what the turn-start rules ask of a city is stubbed.
const setUp = () => {
  const game = new Game(),
    player = new Player(game.rules),
    city = { player: () => player, yields: () => [] } as unknown as City,
    cityRegistry = {
      getByPlayer: (): City[] => [city],
    } as unknown as CityRegistry,
    cityGrowthRegistry = {
      getByCity: () => ({ grow: (): void => {} }),
    } as unknown as CityGrowthRegistry,
    playerGovernment = new PlayerGovernment(
      player,
      game.availableGovernments,
      game.rules
    ),
    events: string[] = [],
    state = { disorder: false, celebration: false };

  game.availableGovernments.register(Anarchy, Democracy);
  playerGovernment.set(new Democracy());
  game.playerGovernments.register(playerGovernment);

  game.rules.register(
    new CivilDisorder(new Effect((): boolean => state.disorder)),
    new CelebrateLeader(new Effect((): boolean => state.celebration)),
    ...anarchyDuration(() => 0.5),
    ...cityDestroyed(game.pendingEffects),
    ...playerAction(cityRegistry, game.pendingEffects),
    ...turnStart(
      cityRegistry,
      game.rules,
      game.engine,
      cityGrowthRegistry,
      game.playerGovernments,
      game.pendingEffects,
      game.turn
    )
  );

  [
    'city:order-restored',
    'city:leader-celebration',
    'city:leader-celebration-ended',
    'player:government:collapsed',
  ].forEach((event: string): void => {
    game.engine.on(event, (): void => {
      events.push(event);
    });
  });

  const turn = (disorder: boolean, celebration: boolean = false): void => {
    state.disorder = disorder;
    state.celebration = celebration;
    game.turn.increment();
    game.rules.process(TurnStart, player);
  };

  return { city, events, game, player, playerGovernment, turn };
};

type SetUp = ReturnType<typeof setUp>;

// What loading the save gives a fresh game: its own city, and the saved
// effects pointing at it. The rules, and anything they held in memory, are new.
const reload = (saved: SetUp): SetUp => {
  const loaded = setUp();

  saved.game.pendingEffects
    .entries()
    .filter(
      (pendingEffect: PendingEffect): boolean =>
        pendingEffect.target() === saved.city
    )
    .forEach((pendingEffect: PendingEffect): void =>
      loaded.game.pendingEffects.register(
        new PendingEffect(
          pendingEffect.handler(),
          loaded.city,
          pendingEffect.data()
        )
      )
    );

  return loaded;
};

describe('city status across a save', (): void => {
  it('should record civil disorder in the game, not in memory', (): void => {
    const { city, game, turn } = setUp();

    turn(true);

    expect(civilDisorder(city, game.pendingEffects)?.handler()).to.equal(
      CIVIL_DISORDER
    );

    turn(false);

    expect(civilDisorder(city, game.pendingEffects)).null;
  });

  it('should overthrow a Democracy on the first turn of disorder after loading a game saved in disorder', (): void => {
    const saved = setUp();

    saved.turn(true);

    const { events, playerGovernment, turn } = reload(saved);

    turn(true);

    expect(playerGovernment.is(Anarchy)).true;
    expect(events).to.include('player:government:collapsed');
  });

  it('should restore order in a city that was in disorder when the game was saved', (): void => {
    const saved = setUp();

    saved.turn(true);

    const { city, events, game, turn } = reload(saved);

    turn(false);

    expect(events).to.deep.equal(['city:order-restored']);
    expect(civilDisorder(city, game.pendingEffects)).null;
  });

  it('should offer the civil disorder action for a city that was in disorder when the game was saved', (): void => {
    const saved = setUp();

    saved.turn(true);

    const { city, player } = reload(saved);

    expect(
      player
        .actions()
        .filter((action) => action instanceof CivilDisorderAction)
        .map((action) => action.value())
    ).to.deep.equal([city]);
  });

  it('should not announce a celebration again after loading', (): void => {
    const saved = setUp();

    saved.turn(false, true);

    expect(saved.events).to.deep.equal(['city:leader-celebration']);

    const { city, events, game, turn } = reload(saved);

    turn(false, true);

    expect(events).to.be.empty;

    turn(false, false);

    expect(events).to.deep.equal(['city:leader-celebration-ended']);
    expect(leaderCelebration(city, game.pendingEffects)).null;
  });

  it('should not share state between games', (): void => {
    const first = setUp(),
      second = setUp();

    first.turn(true, true);

    expect(second.game.pendingEffects.entries()).to.be.empty;
  });

  it("should forget a destroyed city's status", (): void => {
    const { city, game, player, turn } = setUp();

    turn(true, true);

    expect(
      game.pendingEffects
        .getByTarget(city)
        .map((pendingEffect: PendingEffect): string => pendingEffect.handler())
        .sort()
    ).to.deep.equal([CIVIL_DISORDER, LEADER_CELEBRATION]);

    game.rules.process(Destroyed, city, player);

    expect(game.pendingEffects.getByTarget(city)).to.be.empty;
  });
});
